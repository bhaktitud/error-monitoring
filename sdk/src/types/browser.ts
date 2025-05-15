export type BrowserSDKOptions = {
    dsn: string;
    environment?: string;
    release?: string;
    sdk?: {
      captureUnhandledErrors?: boolean;
      captureUnhandledRejections?: boolean;
      captureConsoleErrors?: boolean;
      captureFetchErrors?: boolean;
      captureXHRErrors?: boolean;
    };
  };
  