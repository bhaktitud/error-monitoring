# Changelog

## [0.1.21] - 2025-05-14

### Added
- 🧩 Express adapter (`logRavenRequestTracker`, `logRavenErrorHandler`) to simplify integration with Express apps.
- Built-in support for capturing request metadata, user context, and error breadcrumbs.

### Changed
- Refactored internal error handling to be more robust in middleware contexts.

### How to Use

```ts
import { logRavenRequestTracker, logRavenErrorHandler } from '@lograven/sdk';

app.use(logRavenRequestTracker());
app.use(logRavenErrorHandler());
