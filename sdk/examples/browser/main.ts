import { init, captureException } from '@lograven/sdk/browser';

init({
  dsn: 'your-dsn-here',
  environment: 'development',
  release: 'sdk-demo',
  sdk: {
    captureUnhandledErrors: true,
    captureConsoleErrors: true,
    captureUnhandledRejections: true,
    captureFetchErrors: true,
    captureXHRErrors: true
  }
});

document.getElementById('btn-error')?.addEventListener('click', () => {
  throw new Error('Manual error from UI');
});

document.getElementById('btn-fetch')?.addEventListener('click', () => {
  fetch('https://api.invalid-domain-404.com/broken-endpoint');
});
