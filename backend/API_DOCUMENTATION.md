# Dokumentasi API Backend

Dokumentasi berikut menjelaskan endpoint API yang tersedia pada backend aplikasi monitoring error.

## Autentikasi

### Register
- **URL**: `/api/auth/register`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response Success**: `201 Created`
  ```json
  {
    "id": "uuid",
    "email": "user@example.com",
    "verificationEmailSent": true
  }
  ```
- **Response Error**: `400`, `409`, `500`

### Verify Email
- **URL**: `/api/auth/verify-email?token=<verification_token>`
- **Method**: `GET`
- **Response Success**: Redirect ke `/verify-success` di frontend
- **Response Error**: `400`, `404`, `500`
  ```json
  {
    "error": "Token verifikasi tidak valid"
  }
  ```

### Resend Verification Email
- **URL**: `/api/auth/resend-verification`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com"
  }
  ```
- **Response Success**: `200 OK`
  ```json
  {
    "message": "Email verifikasi telah dikirim ulang",
    "success": true
  }
  ```
- **Response Error**: `400`, `500`

### Login
- **URL**: `/api/auth/login`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "user@example.com",
    "password": "password123"
  }
  ```
- **Response Success**: `200 OK`
  ```json
  {
    "token": "jwt_token"
  }
  ```
- **Response Error**: 
  - `400`: Input tidak valid
  - `401`: Kredensial salah
  - `403`: Email belum diverifikasi
    ```json
    {
      "error": "Email belum diverifikasi",
      "needVerification": true,
      "email": "user@example.com"
    }
    ```
  - `500`: Error server

## Proyek

Semua endpoint berikut memerlukan autentikasi dengan header: `Authorization: Bearer <token>`

### Membuat Proyek Baru
- **URL**: `/api/projects`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "name": "Project Name"
  }
  ```
- **Response Success**: `201 Created`
  ```json
  {
    "id": "uuid",
    "name": "Project Name",
    "dsn": "uuid"
  }
  ```
- **Response Error**: `400`, `500`

### Mendapatkan Daftar Proyek
- **URL**: `/api/projects`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "name": "Project Name",
      "dsn": "uuid",
      "createdAt": "timestamp"
    }
  ]
  ```
- **Response Error**: `500`

### Mendapatkan Daftar Member Proyek
- **URL**: `/api/projects/:id/members`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "role": "admin",
      "user": {
        "id": "uuid",
        "email": "user@example.com"
      }
    }
  ]
  ```
- **Response Error**: `500`

### Mengundang Member ke Proyek
- **URL**: `/api/projects/:id/members`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "email": "newmember@example.com",
    "role": "member"
  }
  ```
- **Response Success**: `201 Created`
  ```json
  {
    "id": "uuid",
    "role": "member",
    "user": {
      "id": "uuid", 
      "email": "newmember@example.com"
    }
  }
  ```
- **Response Error**: `400`, `403`, `409`, `500`

### Mengubah Role Member
- **URL**: `/api/projects/:id/members/:memberId`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "role": "admin"
  }
  ```
- **Response Success**: `200 OK`
  ```json
  {
    "id": "uuid",
    "role": "admin",
    "user": {
      "id": "uuid",
      "email": "member@example.com"
    }
  }
  ```
- **Response Error**: `400`, `403`, `500`

### Menghapus Member
- **URL**: `/api/projects/:id/members/:memberId`
- **Method**: `DELETE`
- **Response Success**: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Response Error**: `403`, `500`

## Event Error

### Mengirim Event Error (dari SDK)
- **URL**: `/api/events`
- **Method**: `POST`
- **Headers**: `X-DSN: <project_dsn>`
- **Body**:
  ```json
  {
    "errorType": "TypeError",
    "message": "Cannot read property of undefined",
    "stacktrace": "Error stack trace...",
    "userAgent": "Browser/Version",
    "statusCode": 500,
    "userContext": { "userId": "123" },
    "tags": { "version": "1.0.0" }
  }
  ```
- **Response Success**: `201 Created`
  ```json
  {
    "success": true
  }
  ```
- **Response Error**: `400`, `404`, `500`

### Mendapatkan Daftar Event per Proyek
- **URL**: `/api/events/project/:id`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "errorType": "TypeError",
      "message": "Error message",
      "timestamp": "timestamp",
      "stacktrace": "Error stack trace...",
      "userAgent": "Browser/Version",
      "statusCode": 500,
      "userContext": { "userId": "123" },
      "tags": { "version": "1.0.0" }
    }
  ]
  ```
- **Response Error**: `500`

## Grup Error

### Mendapatkan Daftar Grup Error per Proyek
- **URL**: `/api/projects/:id/groups`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "errorType": "TypeError",
      "message": "Error message",
      "count": 5,
      "firstSeen": "timestamp",
      "lastSeen": "timestamp",
      "status": "open",
      "statusCode": 500,
      "assignedTo": "member_id",
      "updatedAt": "timestamp"
    }
  ]
  ```
- **Response Error**: `500`

### Mendapatkan Daftar Event dalam Grup
- **URL**: `/api/groups/:groupId/events`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "errorType": "TypeError",
      "message": "Error message",
      "timestamp": "timestamp",
      "stacktrace": "Error stack trace...",
      "userAgent": "Browser/Version",
      "statusCode": 500,
      "userContext": { "userId": "123" },
      "tags": { "version": "1.0.0" }
    }
  ]
  ```
- **Response Error**: `500`

### Mengubah Status Grup Error
- **URL**: `/api/groups/:groupId/status`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "status": "resolved" // open, resolved, ignored
  }
  ```
- **Response Success**: `200 OK`
  ```json
  {
    "id": "uuid",
    "status": "resolved",
    // other group properties
  }
  ```
- **Response Error**: `400`, `500`

### Assign Grup Error ke Member
- **URL**: `/api/groups/:groupId/assign`
- **Method**: `PATCH`
- **Body**:
  ```json
  {
    "memberId": "uuid" // atau null untuk unassign
  }
  ```
- **Response Success**: `200 OK`
  ```json
  {
    "id": "uuid",
    "assignedTo": "uuid",
    // other group properties
  }
  ```
- **Response Error**: `500`

### Mendapatkan Komentar Grup Error
- **URL**: `/api/groups/:groupId/comments`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "content": "Komentar tentang error",
      "createdAt": "timestamp",
      "author": {
        "id": "uuid",
        "user": {
          "id": "uuid",
          "email": "user@example.com"
        }
      }
    }
  ]
  ```
- **Response Error**: `500`

### Menambahkan Komentar pada Grup Error
- **URL**: `/api/groups/:groupId/comments`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "content": "Komentar tentang error"
  }
  ```
- **Response Success**: `201 Created`
  ```json
  {
    "id": "uuid",
    "content": "Komentar tentang error",
    "createdAt": "timestamp",
    "author": {
      "id": "uuid",
      "user": {
        "id": "uuid",
        "email": "user@example.com"
      }
    }
  }
  ```
- **Response Error**: `400`, `403`, `404`, `500`

## Webhook

### Mendapatkan Daftar Webhook per Proyek
- **URL**: `/api/projects/:id/webhooks`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  [
    {
      "id": "uuid",
      "url": "https://example.com/webhook",
      "enabled": true,
      "eventType": "all",
      "secret": "webhook_secret",
      "createdAt": "timestamp"
    }
  ]
  ```
- **Response Error**: `500`

### Membuat Webhook Baru
- **URL**: `/api/projects/:id/webhooks`
- **Method**: `POST`
- **Body**:
  ```json
  {
    "url": "https://example.com/webhook",
    "enabled": true,
    "eventType": "all",
    "secret": "webhook_secret"
  }
  ```
- **Response Success**: `201 Created`
  ```json
  {
    "id": "uuid",
    "url": "https://example.com/webhook",
    "enabled": true,
    "eventType": "all",
    "secret": "webhook_secret",
    "createdAt": "timestamp"
  }
  ```
- **Response Error**: `400`, `500`

### Mengubah Webhook
- **URL**: `/api/webhooks/:webhookId`
- **Method**: `PUT`
- **Body**:
  ```json
  {
    "url": "https://example.com/webhook-updated",
    "enabled": false,
    "eventType": "error",
    "secret": "new_secret"
  }
  ```
- **Response Success**: `200 OK`
  ```json
  {
    "id": "uuid",
    "url": "https://example.com/webhook-updated",
    "enabled": false,
    "eventType": "error",
    "secret": "new_secret",
    "createdAt": "timestamp"
  }
  ```
- **Response Error**: `500`

### Menghapus Webhook
- **URL**: `/api/webhooks/:webhookId`
- **Method**: `DELETE`
- **Response Success**: `200 OK`
  ```json
  {
    "success": true
  }
  ```
- **Response Error**: `500`

## Format Payload Webhook

Ketika terjadi error, sistem akan mengirimkan payload berikut ke URL webhook yang terdaftar:

```json
{
  "projectId": "uuid",
  "eventId": "uuid",
  "errorType": "TypeError",
  "message": "Error message",
  "statusCode": 500,
  "timestamp": "ISO timestamp",
  "userContext": { "userId": "123" },
  "tags": { "version": "1.0.0" }
}
```

Jika webhook memiliki secret, signature akan dikirimkan dalam header `x-webhook-signature`. Signature ini adalah HMAC SHA-256 dari payload JSON menggunakan secret sebagai kunci.

## Webhook Delivery Logs

Sistem akan mencatat setiap pengiriman webhook beserta response atau error-nya. Ini memungkinkan Anda untuk memantau dan mengulangi pengiriman webhook jika diperlukan.

### Get Webhook Delivery Logs

Mengambil daftar log pengiriman webhook untuk webhook tertentu.

- **Endpoint**: `/webhooks/:webhookId/deliveries`
- **Method**: `GET`
- **Parameters**:
  - `page`: nomor halaman (default: 1)
  - `limit`: jumlah log per halaman (default: 10)
- **Response Success**: `200 OK`
  ```json
  {
    "data": [
      {
        "id": "uuid",
        "webhookId": "uuid",
        "eventId": "uuid",
        "requestBody": "JSON string",
        "responseBody": "JSON string",
        "statusCode": 200,
        "success": true,
        "error": null,
        "sentAt": "ISO timestamp",
        "responseAt": "ISO timestamp"
      }
    ],
    "pagination": {
      "page": 1,
      "limit": 10,
      "total": 50,
      "totalPages": 5
    }
  }
  ```

### Get Webhook Delivery Detail

Mengambil detail pengiriman webhook tertentu.

- **Endpoint**: `/webhook-deliveries/:deliveryId`
- **Method**: `GET`
- **Response Success**: `200 OK`
  ```json
  {
    "id": "uuid",
    "webhookId": "uuid",
    "eventId": "uuid",
    "requestBody": "JSON string",
    "responseBody": "JSON string",
    "statusCode": 200,
    "success": true,
    "error": null,
    "sentAt": "ISO timestamp",
    "responseAt": "ISO timestamp",
    "webhook": {
      "id": "uuid",
      "url": "https://example.com/webhook",
      "enabled": true,
      "eventType": "all",
      "secret": "****",
      "createdAt": "ISO timestamp"
    }
  }
  ```

### Retry Webhook Delivery

Mencoba mengirim ulang webhook berdasarkan data yang sama seperti pengiriman sebelumnya.

- **Endpoint**: `/webhook-deliveries/:deliveryId/retry`
- **Method**: `POST`
- **Response Success**: `200 OK`
  ```json
  {
    "success": true,
    "delivery": {
      "id": "uuid",
      "webhookId": "uuid",
      "eventId": "uuid",
      "requestBody": "JSON string",
      "responseBody": "JSON string",
      "statusCode": 200,
      "success": true,
      "error": null,
      "sentAt": "ISO timestamp",
      "responseAt": "ISO timestamp"
    }
  }
  ```
- **Response Error**: `500`
  ```json
  {
    "success": false,
    "error": "Pesan error",
    "delivery": {
      "id": "uuid",
      "webhookId": "uuid",
      "eventId": "uuid",
      "requestBody": "JSON string",
      "responseBody": null,
      "statusCode": null,
      "success": false,
      "error": "Pesan error",
      "sentAt": "ISO timestamp",
      "responseAt": "ISO timestamp"
    }
  }
  ``` 