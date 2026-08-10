import { createDatabaseSnapshot, recordBackup } from '@/db/database';

export type DriveBackupResult = {
  id: string;
  name: string;
  modifiedTime?: string;
};

const DRIVE_UPLOAD_URL =
  'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart&fields=id,name,modifiedTime';

export async function backupDatabaseToGoogleDrive(accessToken: string): Promise<DriveBackupResult> {
  const snapshot = await createDatabaseSnapshot();
  const boundary = `rabgyals-hostel-${Date.now()}`;
  const fileName = `rabgyals-hostel-backup-${new Date().toISOString()}.json`;
  const metadata = {
    name: fileName,
    mimeType: 'application/json',
    parents: ['appDataFolder'],
  };

  const body = [
    `--${boundary}`,
    'Content-Type: application/json; charset=UTF-8',
    '',
    JSON.stringify(metadata),
    `--${boundary}`,
    'Content-Type: application/json',
    '',
    JSON.stringify(snapshot),
    `--${boundary}--`,
    '',
  ].join('\r\n');

  try {
    const response = await fetch(DRIVE_UPLOAD_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body,
    });

    if (!response.ok) {
      throw new Error(`Google Drive backup failed with status ${response.status}.`);
    }

    const result = (await response.json()) as DriveBackupResult;
    await recordBackup(result.id, 'success');
    return result;
  } catch (error) {
    await recordBackup(null, 'failed');
    throw error;
  }
}
