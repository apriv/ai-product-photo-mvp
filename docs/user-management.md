# 用户管理设计文档

> 状态：设计中，未实现。本文档讨论实现思路与取舍，不是最终 API 规范。

## 1. 目标

把现在的"整站共享密码"换成正式的用户系统，支持：

- 每个用户独立账号、独立额度
- 通过外部平台（淘宝/微店）售卖月卡，用户拿到激活码到网站激活
- 每月有积分上限，未用完积分滚入下个月
- 额度不够时可购买补充包
- 管理员可在后台手动生成激活码、调整用户额度

## 2. 关键设计决策

| 项 | 选择 | 理由 |
|---|---|---|
| 计费方式 | 月卡 + 月度积分上限 | 既可控成本，又给用户明确预期；滚动积分降低"用不完浪费"的心理摩擦 |
| 数据库 | SQLite + Prisma | MVP 阶段单机够用，Prisma schema 可平滑迁移到 Postgres |
| 登录方式 | 用户名 + 密码（无邮箱） | 不发邮件；找回密码走客服 |
| 卡密售卖 | 外部平台售卖，网站只激活 | 不接支付，最快上线变现 |
| Session | HttpOnly Cookie + 服务端 session 记录 | 比 JWT 更容易做"踢下线" |
| 密码哈希 | bcrypt（cost 10） | 标准做法，够用 |

## 3. 业务模型

### 3.1 核心概念

- **User**：账号
- **Plan**：套餐定义（如 "标准月卡 = 每月 500 积分"）
- **ActivationCode**：激活码，一次性使用
- **CreditWallet**：用户钱包，记录"本月剩余 + 滚动结余"
- **CreditLedger**：所有积分变动的流水（充值 / 消费 / 月度发放 / 过期）
- **GenerationLog**：每次生成调用的记录（用于成本统计和用户历史）

### 3.2 积分规则

- 月卡激活时：立即按 plan 发放当月积分
- 每月续费日（激活日 + N×30 天）：再发放一份当月积分
- **滚动规则**：未用完的当月积分，在续费时不清零，累加到 wallet（暂定无上限滚动；如要防止刷量，可以加"滚动上限 = 套餐月额 × 3"之类的）
- 补充包：直接增加 wallet 余额，不区分"本月/滚动"
- 不同模板消费不同积分：在 `imageTemplates` 里加 `cost` 字段
- 生成失败：不扣积分（在 try/catch 里只在成功时扣）

### 3.3 激活码生命周期

```
[管理员生成] → status=unused
        ↓ 用户在激活页输入
[已使用] → status=used，关联到 user_id，记录激活时间
        ↓ 用户每月续费
[到期] → 自动不再发放新积分；钱包余额不消失
```

激活码本身 = `<plan_id>` + `<随机串>`，比如 `STD-7K3M9XQP2VWN`。前缀方便客服肉眼识别套餐。

## 4. 数据模型（Prisma schema 草案）

```prisma
model User {
  id           String   @id @default(cuid())
  username     String   @unique
  passwordHash String
  role         Role     @default(USER)
  createdAt    DateTime @default(now())
  lastLoginAt  DateTime?

  wallet       CreditWallet?
  sessions     Session[]
  activations  ActivationCode[]
  ledger       CreditLedger[]
  generations  GenerationLog[]
}

enum Role { USER ADMIN }

model Session {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  expiresAt DateTime
  createdAt DateTime @default(now())
  ip        String?
  userAgent String?

  @@index([userId])
}

model Plan {
  id            String  @id           // "STD", "PRO", "TOPUP-100"
  name          String
  monthlyCredits Int                  // 月卡月度发放；补充包此处=0
  topupCredits  Int     @default(0)   // 一次性补充包用
  kind          PlanKind
  active        Boolean @default(true)
}

enum PlanKind { MONTHLY TOPUP }

model ActivationCode {
  code         String   @id           // "STD-7K3M9XQP2VWN"
  planId       String
  plan         Plan     @relation(fields: [planId], references: [id])
  status       CodeStatus @default(UNUSED)
  usedByUserId String?
  usedBy       User?    @relation(fields: [usedByUserId], references: [id])
  usedAt       DateTime?
  createdAt    DateTime @default(now())
  note         String?                // 给客服/批次的备注

  @@index([status])
}

enum CodeStatus { UNUSED USED DISABLED }

model CreditWallet {
  userId           String   @id
  user             User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  balance          Int      @default(0)   // 当前可用积分总额
  activePlanId    String?                  // 当前生效的月卡
  planExpiresAt   DateTime?                // 月卡到期日
  nextRefillAt    DateTime?                // 下次月度发放时间
  updatedAt        DateTime @updatedAt
}

model CreditLedger {
  id        String   @id @default(cuid())
  userId    String
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  delta     Int                            // 正=入账，负=消费
  reason    LedgerReason
  refId     String?                        // 对应的激活码 / 生成记录 id
  balanceAfter Int
  createdAt DateTime @default(now())

  @@index([userId, createdAt])
}

enum LedgerReason {
  ACTIVATION    // 激活月卡/补充包
  MONTHLY_REFILL // 月度自动发放
  GENERATION    // 生成扣费
  ADMIN_ADJUST  // 管理员手动调整
  REFUND        // 生成失败退回（暂未启用）
}

model GenerationLog {
  id         String   @id @default(cuid())
  userId     String
  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  feature    String                       // "image" | 未来 "video"
  template   String                       // 模板名
  model      String?                      // fal 模型 id
  cost       Int                          // 扣的积分
  status     GenerationStatus
  errorMsg   String?
  durationMs Int?
  createdAt  DateTime @default(now())

  @@index([userId, createdAt])
  @@index([status])
}

enum GenerationStatus { SUCCESS FAILED }
```

## 5. 关键流程

### 5.1 注册

最小流程：填用户名 + 密码 + 激活码，一步完成。
- 校验用户名唯一
- 校验激活码 `status = UNUSED`
- 创建 user，bcrypt 哈希密码
- 创建 wallet，激活套餐 → 余额 = `plan.monthlyCredits`
- 写 ledger，标记激活码为 USED
- 自动登录（写 session cookie）

**取舍**：也可以"先注册账号，再随时激活"，但这会让新用户登录后看到"0 积分 / 没买卡"的尴尬空状态。一步式更顺。

### 5.2 登录

- POST `/api/auth/login` { username, password }
- 比对密码哈希，生成 session id，写 Cookie `session=<id>; HttpOnly; Secure; SameSite=Lax`
- 服务端在 Session 表里插入记录（带 ip/userAgent）

### 5.3 月度续费（cron 或懒触发）

两种实现：

- **Cron 定时**：每天凌晨扫 `wallet.nextRefillAt <= now() && planExpiresAt > now()` 的用户，发放当月积分
- **懒触发**：每次用户进入生成页时检查 wallet，到期就补发

推荐**懒触发**：服务器不需要额外定时任务，MVP 更简单。代价是用户当月没登录就不会触发，但反正没用就没用，下次登录补上即可。

### 5.4 生成扣费

在 `/api/image/generate` 现有逻辑里加：

```
1. 获取 session → user
2. 懒触发月度续费检查
3. 读 wallet.balance，对比 template.cost；不够 → 返回 402
4. 调 fal.subscribe(...)
5. 成功 → wallet.balance -= cost，写 ledger + GenerationLog(SUCCESS)
6. 失败 → 不扣费，写 GenerationLog(FAILED)
```

**事务**：扣费 + ledger 写入用 Prisma `$transaction` 包起来，避免对账不一致。

### 5.5 激活码生成（管理员）

后台页面 `/admin/codes`：
- 选 plan + 数量 + 备注 → 批量生成
- 列表展示 + 导出 CSV（给外部平台店主）

## 6. 路由 / API 草案

```
页面：
  /login                  登录页
  /register               注册 + 激活
  /account                个人中心（余额、ledger、修改密码）
  /admin                  管理员入口（仅 role=ADMIN）
    /admin/users
    /admin/codes
    /admin/stats          使用量与成本

API：
  POST /api/auth/login
  POST /api/auth/logout
  POST /api/auth/register     { username, password, activationCode }
  POST /api/account/activate  { activationCode }    // 已登录用户追加激活
  GET  /api/account/wallet    返回余额、套餐到期、最近 ledger
  POST /api/admin/codes       批量生成（admin 限定）
  GET  /api/admin/codes
  GET  /api/admin/users
  POST /api/admin/users/:id/adjust  手动调整额度
```

## 7. 与现有代码的衔接

需要改动的地方：

- **删除 `AccessGate` + `APP_PASSWORD`**：换成真正的 session 校验
- **新增 `lib/auth.ts`**：`getCurrentUser(request)` / `requireUser(request)` / `requireAdmin(request)`
- **新增 `lib/credits.ts`**：`checkAndCharge(userId, cost)`、`refillIfDue(userId)`
- **`/api/image/generate`**：在密码校验位置换成 `requireUser`，调用前后插扣费逻辑
- **`features/image/templates.ts`**：每个模板加 `cost: number`
- **`/image` 页面**：显示当前余额、不够时跳激活页

不变的地方：fal 调用、prompt、压缩、日志、模板 dispatch。

## 8. 不在本次范围

- 邮箱验证 / 邮件发送
- 找回密码自助流程（先走客服）
- 多设备同时登录的精细管控（先允许）
- 在线支付 / 自动开卡
- 队列、限流、防刷（QPS 限制可以晚一步）

## 9. 落地顺序建议

1. **Prisma + 数据模型**（schema + migration + seed 一个 admin 账号）
2. **登录/注册/激活 + AccessGate 替换**（最小闭环）
3. **积分扣费接入图片生成**（先所有模板统一 cost，再细分）
4. **个人中心页**（余额 + ledger）
5. **管理员后台**（生成激活码 + 用户列表）
6. **统计面板**（使用量 / 成本）

每一步都能独立部署上线。
