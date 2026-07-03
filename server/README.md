# ACE-Step UI Server

Express 后端服务：API 路由、数据库、音频存储、Gradio 集成。

## 启动

```bash
cd server
npx tsx src/index.ts          # 开发
node ../server/cli.mjs start  # 生产（守护进程）
```

## 路由

| 路径 | 说明 |
|------|------|
| `/api/songs` | 歌曲 CRUD |
| `/api/generate` | 音乐生成 + 状态轮询 |
| `/api/playlists` | 播放列表 |
| `/api/reference-tracks` | 参考音频上传/管理 |
| `/api/search` | 搜索 |
| `/api/contact` | 联系表单 |
| `/health` | 健康检查 |
| `/audio/` | 音频文件静态目录 |

## 配置

| 环境变量 | 默认值 | 说明 |
|----------|--------|------|
| `PORT` | 3001 | 服务端口 |
| `ACESTEP_API_URL` | http://localhost:7860 | Gradio API |
| `DATABASE_PATH` | ./data/ace-step.db | SQLite 路径 |
| `JWT_SECRET` | (required) | JWT 密钥 |

## 数据库

SQLite (WAL 模式)。表：`songs`, `playlists`, `playlist_songs`, `likes`, `comments`, `users`, `generation_jobs`, `reference_tracks`
