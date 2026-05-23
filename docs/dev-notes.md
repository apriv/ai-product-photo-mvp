# AI Product Photo MVP - Dev Notes
# 服务器更新代码

```bash
ssh ubuntu@43.129.234.2
cd ~/ai-product-photo-mvp
```
```bash
# 重新构建 PM2
git pull
npm install
npx prisma migrate deploy   # 应用新数据库迁移（如有）
npm run build
pm2 restart ai-product-photo
tail -f /home/ubuntu/.pm2/logs/ai-product-photo-out.log
```
```bash
# 删除重启 PM2（ delete + start）
pm2 delete ai-product-photo
pm2 start npm --name ai-product-photo -- start
pm2 save
tail -f /home/ubuntu/.pm2/logs/ai-product-photo-error.log
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
# 1. 拉新代码并装依赖（postinstall 会自动跑 prisma generate）
git pull
npm install

# 2. 在 .env.local 里追加 DATABASE_URL（如果还没加过）
echo 'DATABASE_URL="file:./prisma/dev.db"' >> .env.local

# 3. 建表
npx prisma migrate deploy

# 4. 插入基础套餐（幂等，重复跑没事）
npm run db:seed

# 5. 创建第一个 admin（用强一点的密码！）
npx tsx scripts/create-admin.ts --username admin --password '<强密码>'

# 6. 构建并重启
npm run build
pm2 restart ai-product-photo
```

跑完后可以快速验证：
- 站点照常工作，密码登录依然用 `APP_PASSWORD`
- `ls -la prisma/dev.db` 看到非空文件
- `npm run db:studio` 浏览器打开能看到 Plan 有 2 条、User 有 1 条

