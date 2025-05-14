/**
 * Template email untuk notifikasi error
 */

interface ErrorDetails {
  projectName: string;
  errorType: string;
  message: string;
  count: number;
  environment?: string;
  browser?: string;
  os?: string;
  url?: string;
  code?: string;
  detailUrl?: string;
}

export function getErrorNotificationEmailTemplate(errorDetails: ErrorDetails): string {
  const {
    projectName,
    errorType,
    message,
    count,
    environment = 'unknown',
    browser,
    os,
    url,
    code,
    detailUrl
  } = errorDetails;

  // Formatting timestamp
  const timestamp = new Date().toLocaleString('id-ID', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit'
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Error Terdeteksi di ${projectName}</title>
      <style>
        body {
          font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
          margin: 0;
          padding: 0;
          color: #333;
          background-color: #f9f9f9;
        }
        .container {
          max-width: 600px;
          margin: 0 auto;
          background: #fff;
          border-radius: 8px;
          overflow: hidden;
          box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
        }
        .header {
          background-color: #e53e3e;
          color: white;
          padding: 24px;
          text-align: center;
        }
        .content {
          padding: 24px;
          background-color: white;
        }
        .footer {
          padding: 15px;
          text-align: center;
          font-size: 12px;
          color: #666;
          border-top: 1px solid #eee;
        }
        .label {
          font-weight: bold;
          margin-bottom: 5px;
          color: #666;
        }
        .value {
          margin-bottom: 15px;
          background-color: #f5f5f5;
          padding: 10px;
          border-radius: 4px;
          font-family: monospace;
          white-space: pre-wrap;
          word-break: break-word;
        }
        .action-button {
          display: inline-block;
          background-color: #3182ce;
          color: white;
          text-decoration: none;
          padding: 12px 24px;
          border-radius: 4px;
          font-weight: bold;
          margin: 20px 0;
        }
        .code-badge {
          display: inline-block;
          background-color: #f3f4f6;
          color: #374151;
          padding: 4px 8px;
          border-radius: 4px;
          font-family: monospace;
          font-size: 14px;
          margin-top: 4px;
        }
        .details-section {
          margin-top: 20px;
          padding-top: 20px;
          border-top: 1px solid #eee;
        }
        .meta-row {
          display: flex;
          margin-bottom: 12px;
        }
        .meta-col {
          flex: 1;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <h1 style="margin:0;">🚨 Error Terdeteksi</h1>
          <p style="margin-top:8px;">Project: ${projectName}</p>
          ${code ? `<div class="code-badge">${code}</div>` : ''}
        </div>
        
        <div class="content">
          <div>
            <div class="label">Error Type:</div>
            <div class="value">${errorType}</div>
            
            <div class="label">Message:</div>
            <div class="value">${message}</div>
            
            <div class="meta-row">
              <div class="meta-col">
                <div class="label">Environment:</div>
                <div class="value">${environment}</div>
              </div>
              <div class="meta-col">
                <div class="label">Count:</div>
                <div class="value">${count}</div>
              </div>
            </div>
            
            ${browser || os ? `
            <div class="meta-row">
              ${browser ? `
              <div class="meta-col">
                <div class="label">Browser:</div>
                <div class="value">${browser}</div>
              </div>
              ` : ''}
              ${os ? `
              <div class="meta-col">
                <div class="label">OS:</div>
                <div class="value">${os}</div>
              </div>
              ` : ''}
            </div>
            ` : ''}
            
            ${url ? `
            <div class="label">URL:</div>
            <div class="value">${url}</div>
            ` : ''}
            
            ${detailUrl ? `
            <div style="text-align:center;">
              <a href="${detailUrl}" class="action-button">Lihat Detail Error</a>
            </div>
            ` : ''}
          </div>
          
          <div class="details-section">
            <p>Error ini terdeteksi pada ${timestamp}.</p>
            <p>Anda menerima email ini karena Anda telah mengaktifkan notifikasi email untuk project ${projectName}.</p>
          </div>
        </div>
        
        <div class="footer">
          <p>LogRaven - Platform Monitoring Error</p>
          <p>© ${new Date().getFullYear()} LogRaven. Semua hak dilindungi.</p>
        </div>
      </div>
    </body>
    </html>
  `;
} 