# AI Product Photo MVP - Dev Notes
# 服务器更新代码

```bash
ssh ubuntu@43.129.234.2
cd ~/ai-product-photo-mvp
```
```bash
# 重新构建 PM2
git pull
npm run build
pm2 restart ai-product-photo
```
```bash
# 删除重启 PM2（ delete + start）
npx prisma migrate deploy   # 应用新数据库迁移（如有）
pm2 delete ai-product-photo
pm2 start npm --name ai-product-photo -- start
pm2 save
tail -f /home/ubuntu/.pm2/logs/ai-product-photo-error.log
tail -f /home/ubuntu/.pm2/logs/ai-product-photo-out.log
```

# Todo

## 图片：上传更高画质

Nginx 默认 `client_max_body_size` 是 1MB（当前未显式配置），所以前端把图片压缩到 1MB 兜底。以后要支持更高画质上传时：

- 在 `/etc/nginx/sites-available/ai-product-photo` 的 `location /` 里加 `client_max_body_size 20m;`（或更大）
- `sudo nginx -t && sudo systemctl reload nginx`
- 同步放宽前端 `src/lib/image-compression.ts` 的 `TARGET_SIZE` 和 `src/app/api/image/generate/route.ts` 的 `MAX_FILE_SIZE`

## 视频：暂不做，备忘

真要上线视频前需要处理：

- **Nginx body size**：视频远超 1MB，必须先把 `client_max_body_size` 调到几十/几百 MB
- **Nginx 超时**：默认 `proxy_read_timeout` 60s，视频生成往往要几分钟，需要加大（例如 `proxy_read_timeout 600s;`）
- **流式上传**：考虑 `proxy_request_buffering off;`，避免 Nginx 把整段视频缓到临时文件再转发
- **前端校验思路**：不要在浏览器端做转码压缩；只校验时长/分辨率/大小，让用户直传

## 月卡续费 / 月度发放（暂未实现）

当前实现：月卡激活后 30 天到期，到期直接禁用扣费（402），用户必须用**新激活码**才能续期与补充积分。
省事但用户体验差。产品成熟后再做：

- 续期：在到期日自动按同套餐再发一份积分、把 `planExpiresAt` 往后推 30 天
- 触发方式：cron 定时 vs 用户登录时懒触发；MVP 推荐懒触发
- 滚动结余：未用完的旧月积分是否累加，要不要设上限（如套餐月额 × 3）
- 设计文档第 5.3 节有更详细的讨论：`docs/user-management.md`




---
# 指令
## SSH 登录服务器

```bash
ssh ubuntu@43.129.234.2
```

## 提交代码

```bash
git add .

git commit -m "update"

git push
```

---
# PM2


```bash
pm2 status

pm2 logs ai-product-photo

pm2 logs ai-product-photo --lines 20

pm2 restart ai-product-photo

pm2 save

pm2 flush
```

---

# Nginx

## 查看配置

```bash
cat /etc/nginx/sites-available/ai-product-photo

sudo nginx -t

sudo systemctl reload nginx
```

---

## 打印日志
```bash
tail -f /home/ubuntu/.pm2/logs/ai-product-photo-out.log
```

---
# 数据库（SQLite + Prisma）

数据库文件：`prisma/dev.db`（本地）/ 服务器同样在 `prisma/dev.db`。
**所有 prisma 命令必须在项目根目录跑**（路径是相对 cwd）。

```bash
# 应用新迁移到现有数据库（生产）
npx prisma migrate deploy

# 灌入套餐基础数据（首次部署时执行一次；幂等可重复）
npm run db:seed

# 创建第一个 admin 账号（必须；首次部署执行一次）
npx tsx scripts/create-admin.ts --username <name> --password <pwd>

# 命令行查表（可选）
npm run db:studio
```

迁移文件在 `prisma/migrations/`，受 git 管理，`git pull` 后 `migrate deploy` 即可同步。
db 文件本身不进 git，服务器自己持有数据。

---
# 服务器首次部署：用户系统（Step 1）

数据库这一版还没接前端，部署后**整站功能不变**，只是把数据表建好。在服务器项目根目录执行：

```bash
# 1. 拉新代码
git pull

# 2. 在 .env.local 里追加 DATABASE_URL（必须在 npm install 之前！
#    postinstall 会跑 prisma generate，generate 需要 DATABASE_URL）
echo 'DATABASE_URL="file:./prisma/dev.db"' >> .env.local

# 3. 装依赖（postinstall 自动跑 prisma generate）
npm install

# 4. 建表
npx prisma migrate deploy

# 5. 插入基础套餐（幂等，重复跑没事）
npm run db:seed

# 6. 创建第一个 admin（用强一点的密码！）
npx tsx scripts/create-admin.ts --username admin --password '<强密码>' Flzx

# 7. 构建并重启
npm run build
pm2 restart ai-product-photo
```

跑完后可以快速验证：
- 站点照常工作，密码登录依然用 `APP_PASSWORD`
- `ls -la prisma/dev.db` 看到非空文件
- `npm run db:studio` 浏览器打开能看到 Plan 有 2 条、User 有 1 条



---
# 服务器部署：登录/注册/激活（Step 2）

这一版**会改变用户访问方式**：旧的 `APP_PASSWORD` 密码访问被替换为账号系统。
已经有的 admin 账号仍然可用（数据没动），但浏览器侧的"输入密码进入"会变成"登录页"。

```bash
# 1. 拉新代码
git pull

# 2. 装依赖（这一步会跑 prisma generate，需要 .env.local 里有 DATABASE_URL）
npm install

# 3. 这一版没有新的数据库迁移，但保险起见跑一下
npx prisma migrate deploy

# 4. 给自己/测试用户生成几个激活码（拿来注册）
npm run generate-codes -- --plan STD --count 5 --note "step-2-onboard"
# 输出会列出 5 个 STD-XXXXXXXXXXXX 码，记下来

# 5. 构建并重启
npm run build
pm2 restart ai-product-photo
```

部署完后第一次使用：
1. 浏览器打开站点，会自动跳转 `/login`
2. 用 admin 账号直接登录，或者点"用激活码注册"用上面生成的码注册新账号
3. 在 `/account` 页可以看到余额（admin 默认 0 积分，要的话自己用一个 STD 码激活，或者再写脚本调整）

可选：清理废弃的 env 变量
```bash
# .env.local 里的 APP_PASSWORD 这一行可以删了，已经没人用它了
```


---
# 服务器部署：积分扣费（Step 3）

这一版接入了真正的扣费逻辑：fal 模型调用前先扣积分，失败自动退回。
没有新的数据库迁移，纯代码改动。

```bash
git pull
npm install
npm run build
pm2 restart ai-product-photo
```

部署完应该看到的变化：
- `/image` 页顶部多了一条余额栏；模板按钮右上角显示价格
- 余额不足时生成按钮被替换为黄色提示 + "去激活"按钮
- 套餐到期的用户调用 generate 会得到 402 而不是 500
- 数据库 `GenerationLog` 表开始有数据

价格目前硬编码在 `src/features/image/templates.ts`，调价直接改这个文件再 build 即可，不用改数据库。


---
# 服务器部署：管理后台（Step 5）

新增 `/admin/*` 路由（用户管理 + 激活码生成），仅 ADMIN 用户可见。无数据库迁移。

```bash
git pull
npm install
npm run build
pm2 restart ai-product-photo
```

部署完后：
1. 用 admin 账号登录，账户页右上角会出现"管理后台"按钮
2. `/admin` 看概览
3. `/admin/codes` 替代 CLI 批量生成激活码（CLI 仍然保留可用，无需手动登录的脚本场景）
4. `/admin/users` 可以按用户名搜，并通过对话框调额度（必填原因，记入 ledger 的 ADMIN_ADJUST）

权限说明：所有 `/api/admin/*` 都通过 `requireAdmin()` 拦截，普通用户访问会 403；
`/admin` 页面通过 server-side `getCurrentUser()` 拦截，未登录跳 `/login`，登录但不是 admin 跳首页。


---
# 服务器部署：统计面板（Step 6）

新增 `/admin/stats` 页 + `GET /api/admin/stats` 聚合接口。
读 `GenerationLog` 实时计算，无额外存储 / 无数据库迁移。

```bash
git pull
npm install
npm run build
pm2 restart ai-product-photo
```

部署完后用 admin 登录，`/admin/stats` 应看到 4 个汇总卡 + 按模板表 + 按用户 Top 20。
如果当前区间没数据会显示"暂无数据"——`GenerationLog` 是 Step 3 才开始写的，老服务器上线后用户实际生成才有数。
