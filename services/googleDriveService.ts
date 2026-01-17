
/**
 * Google Drive Persistence Service
 * Handles OAuth2 authentication and multipart file upload to GDrive.
 */

const CLIENT_ID = '936666355829-v2m7h2g8p4r7f2j3p6g7o8h9p0q1r2s3.apps.googleusercontent.com'; // Placeholder, user usually provides this
const SCOPES = 'https://www.googleapis.com/auth/drive.file';
const BACKUP_FILENAME = 'equity_insight_backup.json';

export interface DriveBackupPayload {
  purchases: any[];
  currentPrices: Record<string, number>;
  currentMetrics: Record<string, any>;
  alerts: any[];
  timestamp: string;
}

export const saveToDrive = async (payload: DriveBackupPayload): Promise<void> => {
  return new Promise((resolve, reject) => {
    // 1. Initialize Token Client
    const client = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: CLIENT_ID,
      scope: SCOPES,
      callback: async (response: any) => {
        if (response.error !== undefined) {
          reject(response);
          return;
        }

        const accessToken = response.access_token;

        try {
          // 2. Search for existing file
          const searchResponse = await fetch(
            `https://www.googleapis.com/drive/v3/files?q=name='${BACKUP_FILENAME}' and trashed=false`,
            {
              headers: { Authorization: `Bearer ${accessToken}` }
            }
          );
          const searchResult = await searchResponse.json();
          const existingFile = searchResult.files && searchResult.files[0];

          // 3. Prepare Multipart Request
          const metadata = {
            name: BACKUP_FILENAME,
            mimeType: 'application/json',
          };

          const fileContent = JSON.stringify(payload, null, 2);
          const boundary = '-------314159265358979323846';
          const delimiter = `\r\n--${boundary}\r\n`;
          const close_delim = `\r\n--${boundary}--`;

          const multipartRequestBody =
            delimiter +
            'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
            JSON.stringify(metadata) +
            delimiter +
            'Content-Type: application/json\r\n\r\n' +
            fileContent +
            close_delim;

          const url = existingFile 
            ? `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=multipart`
            : 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
          
          const method = existingFile ? 'PATCH' : 'POST';

          const uploadResponse = await fetch(url, {
            method: method,
            headers: {
              Authorization: `Bearer ${accessToken}`,
              'Content-Type': `multipart/related; boundary=${boundary}`,
            },
            body: multipartRequestBody,
          });

          if (!uploadResponse.ok) {
            throw new Error('Upload failed');
          }

          resolve();
        } catch (err) {
          console.error('Drive Sync Error:', err);
          reject(err);
        }
      },
    });

    client.requestAccessToken();
  });
};
