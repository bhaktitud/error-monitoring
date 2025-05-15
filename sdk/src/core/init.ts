export type LogRavenOptions = {
    dsn: string;
    apiUrl?: string;
    environment?: string;
    release?: string;
  };
  
  export const LogRavenContext = {
    config: null as LogRavenOptions | null,
    user: null as Record<string, any> | null,
    tags: {} as Record<string, string>,
    breadcrumbs: [] as Array<{ category: string; message: string; data?: any; level?: string; timestamp: string }>,
  };
  
  export function init(options: LogRavenOptions) {
    LogRavenContext.config = {
      apiUrl: options.apiUrl ?? 'https://api.lograven.dev',
      environment: options.environment ?? 'production',
      ...options,
    };
    console.log('[LogRaven] initialized:', LogRavenContext.config);
  }