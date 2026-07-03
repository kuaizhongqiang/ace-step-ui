# Context (React 状态管理)

3 个 React Context，无外部状态管理库。

## Provider 嵌套顺序

```
AuthProvider → ResponsiveProvider → App
                                   └─ I18nProvider 包裹 AppContent
```

## Context 说明

| Context | 用途 |
|---------|------|
| `AuthContext` | 认证状态（本地模式始终已认证） |
| `ResponsiveContext` | 响应式布局（移动端/桌面端） |
| `I18nContext` | 国际化（en/zh/ja/ko） |
