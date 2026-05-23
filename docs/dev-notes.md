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