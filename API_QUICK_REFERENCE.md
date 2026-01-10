# ShieldAuth API Quick Reference

## 🔐 Authentication
All admin endpoints require JWT Bearer token in Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## 📊 Dashboard & Stats

### Get Dashboard Statistics
```http
GET /api/v1/admin/stats
Authorization: Bearer <token>

Response:
{
  "totalLicenses": 1234,
  "activeLicenses": 890,
  "totalHwidBindings": 2456,
  "expiringThisWeek": 12,
  "totalApplications": 5,
  "recentActivity": [...]
}
```

### Get Public Stats (No Auth)
```http
GET /api/v1/public/stats

Response:
{
  "validations_today": 47923,
  "total_licenses": 12450,
  "active_licenses": 8732
}
```

## 🔑 License Management

### Bulk Operations
```http
POST /api/v1/admin/licenses/bulk-action
Authorization: Bearer <token>
Content-Type: application/json

{
  "action": "ban|unban|delete",
  "license_keys": ["key1", "key2", "key3"]
}
```

### Update License Notes
```http
PUT /api/v1/admin/license/:license_key/notes
Authorization: Bearer <token>
Content-Type: application/json

{
  "notes": "Customer notes here"
}
```

### Get HWID Bindings
```http
GET /api/v1/admin/license/:license_key/hwids
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "hwid_hash": "abc123...",
    "device_name": "Gaming PC",
    "last_seen": "2026-01-10T12:00:00Z",
    "unbind_count": 0
  }
]
```

### Unbind Device
```http
DELETE /api/v1/admin/license/:license_key/hwid/:hwid_id
Authorization: Bearer <token>
```

### Export Licenses
```http
GET /api/v1/admin/licenses/export
Authorization: Bearer <token>

Returns: CSV file
```

## 📝 License Templates

### List Templates
```http
GET /api/v1/admin/templates
Authorization: Bearer <token>
```

### Create Template
```http
POST /api/v1/admin/templates
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "30-Day Trial",
  "days_valid": 30,
  "max_hwid_slots": 1,
  "metadata": {}
}
```

### Delete Template
```http
DELETE /api/v1/admin/templates/:template_id
Authorization: Bearer <token>
```

## 📈 Analytics

### Per-App Analytics
```http
GET /api/v1/admin/analytics/:app_id?days=7
Authorization: Bearer <token>

Response:
{
  "validationsByDay": [...],
  "successRate": [...],
  "geoDistribution": [...],
  "errorBreakdown": [...]
}
```

## 📜 Logs

### Get Validation Logs
```http
GET /api/v1/admin/logs?app_id=xxx&license_key=yyy&result=success&limit=100&offset=0
Authorization: Bearer <token>

Response:
{
  "logs": [...],
  "total": 1234,
  "limit": 100,
  "offset": 0
}
```

## 🪝 Webhooks

### List Webhooks
```http
GET /api/v1/admin/webhooks
Authorization: Bearer <token>
```

### Create Webhook
```http
POST /api/v1/admin/webhooks
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://your-domain.com/webhook",
  "events": [
    "license.created",
    "license.expired",
    "license.banned",
    "hwid.bound"
  ]
}

Response:
{
  "webhook_id": "wh_xxxxxxxxxxxxx",
  "secret": "secret_xxxxxxxxxxxxx"
}
```

### Update Webhook
```http
PUT /api/v1/admin/webhooks/:webhook_id
Authorization: Bearer <token>
Content-Type: application/json

{
  "url": "https://new-url.com/webhook",
  "events": [...],
  "is_active": true
}
```

### Delete Webhook
```http
DELETE /api/v1/admin/webhooks/:webhook_id
Authorization: Bearer <token>
```

### Get Delivery Logs
```http
GET /api/v1/admin/webhooks/:webhook_id/deliveries
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "event_type": "license.created",
    "status_code": 200,
    "delivered_at": "2026-01-10T12:00:00Z"
  }
]
```

### Test Webhook
```http
POST /api/v1/admin/webhooks/:webhook_id/test
Authorization: Bearer <token>

Response:
{
  "success": true,
  "status_code": 200,
  "response_body": "..."
}
```

## 🔐 API Keys

### List API Keys
```http
GET /api/v1/admin/api-keys
Authorization: Bearer <token>
```

### Generate API Key
```http
POST /api/v1/admin/api-keys
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Production Key",
  "app_id": "app_xxxxx",
  "scopes": [
    "license:read",
    "license:write",
    "analytics:read"
  ],
  "expires_in_days": 365
}

Response:
{
  "key_id": "sk_xxxxxxxxxxxxx",
  "api_key": "sk_xxxxxxxxxxxxx_yyyyyyyyyyyyyy",
  "message": "Save this key securely - it won't be shown again"
}
```

### Revoke API Key
```http
DELETE /api/v1/admin/api-keys/:key_id
Authorization: Bearer <token>
```

## 🚨 Fraud Detection

### List Fraud Alerts
```http
GET /api/v1/admin/fraud-alerts?severity=high&is_resolved=false
Authorization: Bearer <token>

Response:
[
  {
    "id": 1,
    "license_key": "...",
    "alert_type": "hwid_spoofing",
    "severity": "high",
    "details": {...},
    "trust_score": 0.23,
    "is_resolved": false,
    "auto_banned": false
  }
]
```

### Resolve Alert
```http
PUT /api/v1/admin/fraud-alerts/:alert_id/resolve
Authorization: Bearer <token>
```

## 🌐 Public Portal (No Auth)

### Get License Info
```http
GET /api/v1/public/portal/:license_key

Response:
{
  "license_key": "...",
  "expires_at": "2026-12-31T23:59:59Z",
  "days_remaining": 355,
  "max_hwid_slots": 3,
  "is_banned": false,
  "is_active": true,
  "hwid_bindings": [...]
}
```

### Self-Service Unbind
```http
POST /api/v1/public/portal/:license_key/unbind/:hwid_id

Response (Success):
{
  "success": true,
  "message": "Device unbound successfully"
}

Response (Rate Limited):
{
  "message": "You can only unbind once every 7 days",
  "retry_after": 3
}
```

### Update Device Name
```http
PUT /api/v1/public/portal/:license_key/device/:hwid_id/name
Content-Type: application/json

{
  "device_name": "My Gaming PC"
}
```

## 🎯 Webhook Event Payloads

### license.created
```json
{
  "event": "license.created",
  "webhook_id": "wh_xxxxx",
  "timestamp": "2026-01-10T12:00:00Z",
  "data": {
    "license_key": "...",
    "app_id": "...",
    "expires_at": "2027-01-10T12:00:00Z",
    "max_hwid_slots": 1
  }
}
```

### license.expired
```json
{
  "event": "license.expired",
  "webhook_id": "wh_xxxxx",
  "timestamp": "2026-01-10T12:00:00Z",
  "data": {
    "license_key": "...",
    "app_id": "...",
    "expired_at": "2026-01-10T12:00:00Z"
  }
}
```

## 📊 Scopes for API Keys

- `license:read` - View licenses
- `license:write` - Create/modify licenses
- `license:delete` - Delete licenses
- `analytics:read` - View analytics
- `webhook:manage` - Manage webhooks
- `validate:read` - Use validation endpoint

## 🔍 Filter Options

### Logs
- `app_id` - Filter by application
- `license_key` - Filter by license
- `result` - success|expired|banned|invalid|hwid_mismatch|hwid_limit
- `limit` - Results per page (default: 100)
- `offset` - Pagination offset (default: 0)

### Analytics
- `days` - Time range in days (default: 7)

### Fraud Alerts
- `severity` - low|medium|high|critical
- `is_resolved` - true|false

## 🚀 Rate Limits

- Portal unbind: 1 per device per 7 days
- API calls: No limit (add Redis rate limiter in production)
- Webhook deliveries: 5 retries with exponential backoff

## 📱 SDK Examples

### C# SDK
```csharp
using ShieldAuth;

var client = new ShieldAuthClient("your_app_id");
var result = await client.ValidateAsync("license_key");

if (result.Valid) {
    Console.WriteLine($"Session: {client.GetSessionId()}");
    await client.HeartbeatAsync();
}
```

### Python SDK
```python
from shieldauth import ShieldAuthClient

client = ShieldAuthClient("your_app_id")
result = client.validate("license_key")

if result['valid']:
    print(f"Session: {client.get_session_id()}")
    client.heartbeat()
```

### C++ SDK
```cpp
#include "shieldauth.h"

ShieldAuth::Initialize("your_app_id");

if (ShieldAuth::Validate("license_key")) {
    std::cout << "Session: " << ShieldAuth::GetSessionID() << std::endl;
    ShieldAuth::Heartbeat();
}
```

## 🆘 Error Codes

- `401` - Unauthorized (missing/invalid token)
- `403` - Forbidden (not your resource)
- `404` - Not Found
- `429` - Rate Limited
- `500` - Server Error

## 💡 Best Practices

1. **Cache API Keys**: Store securely, don't regenerate frequently
2. **Use Scopes**: Limit API key permissions to minimum required
3. **Monitor Webhooks**: Check delivery logs regularly
4. **Review Fraud Alerts**: Act on high/critical severity quickly
5. **Export Backups**: Regular CSV exports of licenses
6. **Rate Limit**: Implement client-side rate limiting
7. **Retry Logic**: Exponential backoff for failed requests
8. **Validate Input**: Always validate user input on frontend
9. **Log Everything**: Use validation_logs for debugging
10. **Test Webhooks**: Use test endpoint before going live

---

**Base URL:** `https://shieldauth-production.up.railway.app/api/v1`
**Documentation:** https://shield-auth.vercel.app/docs
**Support:** support@shieldlabs.com
