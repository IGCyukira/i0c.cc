Cloudflare Worker script: enforces HTTPS, serves a favicon, and applies redirect or proxy rules defined in a remote redirects.json file.

# `redirects.json` Quick Reference

Provide a `Slots` (or `slots` / `SLOT`) object in `redirects.json` to define all routing rules. The table below lists the available fields for each route:

| Field        | Type     | Default | Description |
|--------------|----------|---------|-------------|
| `type`       | string   | `prefix` | Route mode: `prefix` for prefix redirects, `exact` for exact matches, `proxy` for reverse proxying |
| `target`     | string   | `""`    | Destination URL (takes precedence over `to` / `url`) |
| `to` / `url` | string   | `""`    | Alias of `target`, can be used when `target` is omitted |
| `appendPath` | boolean  | `true`   | Whether to append the remaining path when using `prefix` mode |
| `status`     | number   | `302`    | HTTP status code for redirects (301 / 302 / 307 / 308, etc.) |
| `priority`   | number   | by order | Determines rule precedence for the same path; smaller numbers are matched first |

- Keys must start with `/` and can use colon parameters (such as `:id`) or the `*` wildcard; captures can be referenced in the target with `$1`, `:id`, and so on.
- The `proxy` type forwards the request to the destination and returns the upstream response; other types respond with a `Location` redirect.
- To configure multiple rules for the same path, provide an array. Array order controls the default priority, or you can specify `priority` explicitly. Smaller numbers match earlier.

## Sample `redirects.json`

```jsonc
{
  "Slots": {
    // Fallback: send any unmatched path to the site homepage
    "/": "https://example.com",

    // Multiple rules for one path, with priority controlling the order
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

    // Simple redirect: campaign landing page
    "/promo": {
      "target": "https://example.com/campaign",
      "status": 308
    },

    // API example:
    //   1. /api matches the health check exactly and returns 200
    //   2. Other requests go to the primary API
    //   3. Failover to the backup API if the primary fails
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

    // Wildcard: proxy /media/* to the CDN and keep the remainder of the path
    "/media/*": {
      "type": "proxy",
      "target": "https://cdn.example.com/$1",
      "status": 200
    },

    // Prefix redirect: admin console entry, keeping the original path
    "/admin": {
      "type": "prefix",
      "target": "https://console.example.com",
      "appendPath": true,
      "status": 307
    }
  }
}
```

After you commit the file, the Worker automatically applies these redirect and proxy rules.

For the Chinese version, see [README.zh-CN.md](README.zh-CN.md).
