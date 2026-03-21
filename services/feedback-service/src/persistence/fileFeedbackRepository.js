import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';

async function ensureDir(dir) {
  await mkdir(dir, { recursive: true });
}

function reportPath(storageDir, interviewId) {
  return path.join(storageDir, `${interviewId}.json`);
}

export async function saveReport({ storageDir, report }) {
  await ensureDir(storageDir);
  const record = {
    savedAt: new Date().toISOString(),
    emailNotification: {
      simulated: true,
      sentAt: new Date().toISOString(),
      status: 'queued',
    },
    report,
  };

  await writeFile(reportPath(storageDir, report.interviewId), JSON.stringify(record, null, 2), 'utf8');

  return record;
}

export async function getReport({ storageDir, interviewId }) {
  const raw = await readFile(reportPath(storageDir, interviewId), 'utf8');
  return JSON.parse(raw);
}
