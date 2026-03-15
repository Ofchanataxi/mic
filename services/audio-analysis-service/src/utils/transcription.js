import fs from 'node:fs/promises';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

function splitArgs(template) {
  return template
    .trim()
    .split(/\s+/)
    .filter(Boolean);
}

function buildArgs(template, replacements) {
  const args = splitArgs(template).map((token) => {
    let next = token;
    for (const [key, value] of Object.entries(replacements)) {
      next = next.replaceAll(`{${key}}`, value);
    }
    return next;
  });

  if (!args.some((arg) => arg.includes(replacements.input))) {
    args.push(replacements.input);
  }

  return args;
}

export async function extractSegmentWav({ inputPath, startSeconds, durationSeconds, outputPath }) {
  await fs.mkdir(path.dirname(outputPath), { recursive: true });

  const args = [
    '-hide_banner',
    '-loglevel',
    'error',
    '-ss',
    String(startSeconds),
    '-t',
    String(durationSeconds),
    '-i',
    inputPath,
    '-vn',
    '-ac',
    '1',
    '-ar',
    '16000',
    '-y',
    outputPath,
  ];

  await execFileAsync('ffmpeg', args, { windowsHide: true, maxBuffer: 10 * 1024 * 1024 });
}

export async function transcribeAudioFile({ audioPath, sttCommand, sttArgsTemplate, sttModelPath, sttLanguage, timeoutMs }) {
  if (!sttModelPath) {
    return { transcript: null, error: 'stt_model_not_configured' };
  }

  const args = buildArgs(sttArgsTemplate, {
    input: audioPath,
    model: sttModelPath,
    lang: sttLanguage,
  });

  try {
    const { stdout } = await execFileAsync(sttCommand, args, {
      windowsHide: true,
      timeout: timeoutMs,
      maxBuffer: 20 * 1024 * 1024,
    });

    const transcript = (stdout ?? '').trim();
    return {
      transcript: transcript.length ? transcript : null,
      error: transcript.length ? null : 'stt_empty_transcript',
    };
  } catch {
    return { transcript: null, error: 'stt_transcription_failed' };
  }
}
