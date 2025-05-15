import { LogRavenContext } from "./init";

export function setUser(user: Record<string, any>) {
    LogRavenContext.user = user;
}

export function setTags(tags: Record<string, string>) {
    LogRavenContext.tags = { ...LogRavenContext.tags, ...tags };
}

export function addBreadcrumb(
    category: string,
    message: string,
    data?: Record<string, any>,
    level: 'info' | 'warning' | 'error' = 'info'
) {
    const timestamp = new Date().toISOString();
    const breadcrumb = { category, message, data, level, timestamp };
    LogRavenContext.breadcrumbs.push(breadcrumb);
    if (LogRavenContext.breadcrumbs.length > 30) {
        LogRavenContext.breadcrumbs.shift();
    }
}
