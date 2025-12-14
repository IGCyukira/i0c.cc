Cloudflare Worker 脚本：特点是强制 HTTPS、返回 favicon，并基于远程 redirects.json 中的规则执行重定向或代理。

# `redirects.json` 配置速查

在 `redirects.json` 中提供 `Slots`（或 `slots` / `SLOT`）对象即可定义所有规则。下表列出每条路由可用字段：

| 字段        | 类型     | 默认值  | 说明 |
|-------------|----------|---------|------|
| `type`      | string   | `prefix` | 路由模式：`prefix` 前缀重定向、`exact` 精确匹配、`proxy` 反向代理 |
| `target`    | string   | `""`    | 目标地址（优先于 `to` / `url`） |
| `to` / `url`| string   | `""`    | `target` 的别名，缺省时可使用 |
| `appendPath`| boolean  | `true`   | `prefix` 模式下是否拼接余下路径 |
| `status`    | number   | `302`    | 重定向状态码（301 / 302 / 307 / 308 等） |
| `priority`  | number   | 按顺序   | 同一路径存在多条规则时用于排序，数字越小优先级越高 |

- 键名需以 `/` 开头，可使用冒号参数（如 `:id`）或 `*` 通配符；匹配结果可在目标里用 `$1`、`:id` 等占位符。
- `proxy` 类型会把请求透传至目标并回传对方响应，其余类型返回 `Location` 重定向。
- 若需要为同一路径配置多条规则，可将值写成数组，数组顺序决定默认优先级，也可通过 `priority` 字段显式指定。数字越小越先匹配。

提示：在文件顶部添加下面的 Schema 引用，就能在支持的编辑器里获得自动补全和校验（Schema 放在 main 分支，即使 `redirects.json` 在 data 分支也能生效）：

```jsonc
{
  "$schema": "https://raw.githubusercontent.com/IGCyukira/i0c.cc/main/redirects.schema.json",
  "Slots": {
    // ...
  }
}
```

## 示例 `redirects.json`

```jsonc
{
  "Slots": {
    // 兜底：所有未命中的路径都会跳到站点首页
    "/": "https://example.com",

    // 同一路径配置多条规则，可通过 priority 控制优先级
    "/docs/:page": [
      {
        "type": "exact",
        "target": "https://kb.example.com/:page",
        "status": 302,
        "priority": 1
      },
      {
        "type": "prefix",
        "target": "https://docs.example.com/:page",
        "appendPath": false,
        "status": 301,
        "priority": 5
      }
    ],

    // 简单重定向：活动页
    "/promo": {
      "target": "https://example.com/campaign",
      "status": 308
    },

    // API 示例：
    //   1. /api 精确命中健康检查，直接返回 200
    //   2. 其余请求走主接口
    //   3. 主接口异常时回退到备份接口
    "/api": [
      {
        "type": "exact",
        "target": "https://status.example.com/healthz",
        "status": 200,
        "priority": 1
      },
      {
        "type": "proxy",
        "target": "https://api.example.com",
        "appendPath": true,
        "priority": 10
      },
      {
        "type": "proxy",
        "target": "https://backup-api.example.com",
        "appendPath": true,
        "priority": 20
      }
    ],

    // 通配符：将 /media/* 透传到 CDN，并保留剩余路径
    "/media/*": {
      "type": "proxy",
      "target": "https://cdn.example.com/$1",
      "status": 200
    },

    // 前缀重定向：后台入口，保持原路径
    "/admin": {
      "type": "prefix",
      "target": "https://console.example.com",
      "appendPath": true,
      "status": 307
    }
  }
}
```

将文件提交后，Worker 会自动按以上配置处理重定向与代理。
