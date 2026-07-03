# Services (API 层)

`api.ts` — 前端 API 封装层，所有后端接口的统一调用入口。

## 模块

| 模块 | 说明 |
|------|------|
| `authApi` | 认证相关 |
| `songsApi` | 歌曲 CRUD、点赞、评论 |
| `generateApi` | 音乐生成、状态轮询、格式增强 |
| `playlistsApi` | 播放列表管理 |
| `searchApi` | 搜索 |
| `contactApi` | 联系表单 |
| `usersApi` | 用户信息 |

## 使用

```typescript
import { songsApi, generateApi } from './services/api';

// 获取歌曲
const { songs } = await songsApi.getMySongs(token);

// 生成音乐
const { jobId } = await generateApi.startGeneration(params, token);
```
