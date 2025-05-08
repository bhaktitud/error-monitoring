# Status Implementasi API

Dokumen ini berisi daftar semua endpoint API dari dokumentasi backend dan status implementasinya di frontend.

## Endpoint Autentikasi
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/api/auth/register` | POST | ✅ | `AuthAPI.register()` |
| `/api/auth/login` | POST | ✅ | `AuthAPI.login()` |
| `/api/auth/me` | GET | ✅ | `AuthAPI.getCurrentUser()` |

## Endpoint Proyek
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/api/projects` | GET | ✅ | `ProjectsAPI.getProjects()` |
| `/api/projects` | POST | ✅ | `ProjectsAPI.createProject()` |
| `/api/projects/:id/members` | GET | ✅ | `ProjectsAPI.getProjectMembers()` |
| `/api/projects/:id/members` | POST | ✅ | `ProjectsAPI.inviteMember()` |
| `/api/projects/:id/members/:memberId` | PATCH | ✅ | `ProjectsAPI.changeMemberRole()` |
| `/api/projects/:id/members/:memberId` | DELETE | ✅ | `ProjectsAPI.removeMember()` |

## Endpoint Event Error
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/api/events` | POST | ✅ | `EventsAPI.sendEvent()` |
| `/api/events/project/:id` | GET | ✅ | `EventsAPI.getEvents()` |

## Endpoint Grup Error
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/api/projects/:id/groups` | GET | ✅ | `GroupsAPI.getGroups()` |
| `/api/groups/:groupId/events` | GET | ✅ | `GroupsAPI.getGroupEvents()` |
| `/api/groups/:groupId/status` | PATCH | ✅ | `GroupsAPI.changeGroupStatus()` |
| `/api/groups/:groupId/assign` | PATCH | ✅ | `GroupsAPI.assignGroup()` |
| `/api/groups/:groupId/comments` | GET | ✅ | `GroupsAPI.getComments()` |
| `/api/groups/:groupId/comments` | POST | ✅ | `GroupsAPI.addComment()` |

## Endpoint Webhook
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/api/projects/:id/webhooks` | GET | ✅ | `WebhooksAPI.getWebhooks()` |
| `/api/projects/:id/webhooks` | POST | ✅ | `WebhooksAPI.createWebhook()` |
| `/api/webhooks/:webhookId` | PUT | ✅ | `WebhooksAPI.updateWebhook()` |
| `/api/webhooks/:webhookId` | DELETE | ✅ | `WebhooksAPI.deleteWebhook()` |

## API Utilitas Tambahan (Tidak Ada di Dokumentasi)

Kami juga menambahkan beberapa API utilitas tambahan untuk meningkatkan fungsionalitas aplikasi:

### Endpoint Statistik
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/stats/projects/:id` | GET | ✅ | `StatsAPI.getProjectStats()` |
| `/stats/projects/:id/distribution/:category` | GET | ✅ | `StatsAPI.getErrorDistribution()` |

### Endpoint Ekspor
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/export/projects/:id/errors/csv` | GET | ✅ | `ExportAPI.exportErrorsCSV()` |
| `/export/projects/:id/errors/json` | GET | ✅ | `ExportAPI.exportErrorsJSON()` |

### Endpoint Notifikasi
| Endpoint | Method | Status | Implementasi |
|----------|--------|--------|--------------|
| `/notifications/projects/:id/settings` | GET | ✅ | `NotificationAPI.getNotificationSettings()` |
| `/notifications/projects/:id/settings` | PATCH | ✅ | `NotificationAPI.updateNotificationSettings()` |
| `/notifications/projects/:id/test` | POST | ✅ | `NotificationAPI.testNotification()` |

## Catatan
* Endpoint `/api/auth/me` tidak dijelaskan dalam dokumentasi API, tetapi ditambahkan dalam implementasi untuk mendapatkan informasi pengguna yang sedang login.
* Endpoint `/api/events` (POST) telah diimplementasikan untuk mengirim error langsung dari frontend. Ini umumnya akan digunakan oleh SDK, tapi bisa juga digunakan untuk keperluan testing.
* API Utilitas Tambahan yang tercantum di atas tidak ada dalam dokumentasi API asli, tetapi ditambahkan untuk melengkapi fungsionalitas aplikasi monitoring error. 