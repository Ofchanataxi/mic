const fs = require('fs/promises');
const path = require('path');
const ffmpegProvider = require('./ffmpegProvider');
const openaiProvider = require('./openaiProvider');
const { clampScore } = require('../utils/scoreUtils');

const parseVisionJson = (content) => {
  const parsed = JSON.parse(content);
  return {
    eyeContactScore: clampScore(parsed.eyeContactScore),
    postureScore: clampScore(parsed.postureScore),
    attentionScore: clampScore(parsed.attentionScore),
    observableBehavior: parsed.observableBehavior && typeof parsed.observableBehavior === 'object'
      ? parsed.observableBehavior
      : {},
    rawData: parsed,
  };
};

const metadataFallback = ({ exists, timestampRangeValid, metadata, durationMs, hasVideoTrack, width, height, fps }) => {
  const attentionScore = exists && hasVideoTrack && timestampRangeValid
    ? Math.max(0, Math.min(100, durationMs >= 1000 ? 75 : 45))
    : null;

  return {
    eyeContactScore: null,
    postureScore: null,
    attentionScore,
    observableBehavior: {
      segmentExists: exists,
      timestampRangeValid,
      hasVideoTrack,
      durationMs,
      width,
      height,
      fps,
    },
    rawData: {
      status: exists && hasVideoTrack ? 'BASIC_VIDEO_METADATA_ANALYSIS' : 'VIDEO_SEGMENT_UNAVAILABLE',
      message: 'Basic video analysis validates the segment and extracts technical metadata. Eye contact and posture require frame analysis or a real vision model.',
      metadata: {
        formatName: metadata?.format?.format_name || null,
        duration: metadata?.format?.duration || null,
        size: metadata?.format?.size || null,
      },
    },
  };
};

const analyzeVideoSegment = async ({ videoSegmentPath, startTimeMs, endTimeMs }) => {
  let exists = false;
  let metadata = null;
  if (videoSegmentPath) {
    try {
      await fs.access(videoSegmentPath);
      exists = true;
      metadata = await ffmpegProvider.getMediaMetadata(videoSegmentPath);
    } catch (_) {
      exists = false;
    }
  }

  const timestampRangeValid = Number.isFinite(startTimeMs) && Number.isFinite(endTimeMs) && endTimeMs > startTimeMs;
  const videoStream = metadata?.streams?.find((stream) => stream.codec_type === 'video') || null;
  const durationMs = timestampRangeValid ? endTimeMs - startTimeMs : null;
  const hasVideoTrack = Boolean(videoStream);
  const width = videoStream?.width || null;
  const height = videoStream?.height || null;
  const rawFrameRate = videoStream?.avg_frame_rate || videoStream?.r_frame_rate || '';
  const [fpsNumerator, fpsDenominator] = rawFrameRate.split('/').map(Number);
  const fps = fpsNumerator && fpsDenominator ? fpsNumerator / fpsDenominator : null;

  const fallback = metadataFallback({
    exists,
    timestampRangeValid,
    metadata,
    durationMs,
    hasVideoTrack,
    width,
    height,
    fps,
  });

  if (!exists || !hasVideoTrack || !timestampRangeValid) {
    return fallback;
  }

  try {
    const framesDir = path.join(path.dirname(videoSegmentPath), `${path.basename(videoSegmentPath, '.mp4')}-frames`);
    const imagePaths = await ffmpegProvider.extractVideoFrames({
      videoPath: videoSegmentPath,
      outputDir: framesDir,
      count: 3,
    });

    if (!imagePaths.length) return fallback;

    const content = await openaiProvider.createJsonVisionEvaluation({
      imagePaths,
      systemPrompt: [
        'Eres un evaluador visual prudente de entrevistas técnicas.',
        'Responde solo JSON parseable en español.',
        'No diagnostiques emociones, salud mental, ansiedad, depresión ni condiciones médicas.',
        'Evalúa únicamente contacto visual aproximado, postura y atención observable.',
        'Las observaciones deben ser breves, naturales y útiles para la persona evaluada.',
        'Usa frases como "Mantuvo poca atención durante la respuesta" o "Conservó una postura estable".',
        'No menciones frames, imágenes, detecciones, modelos, puntuaciones, iluminación ni limitaciones técnicas.',
        'No interpretes expresiones faciales ni atribuyas emociones o intenciones.',
        'Si algo no se puede valorar con claridad, usa null y no agregues una explicación técnica.',
      ].join(' '),
      userPrompt: JSON.stringify({
        instruction: 'Valora el comportamiento observable durante la respuesta y devuelve scores de 0 a 100 o null si no hay evidencia suficiente.',
        requiredJsonShape: {
          eyeContactScore: 0,
          postureScore: 0,
          attentionScore: 0,
          observableBehavior: {
            visiblePerson: true,
            framing: 'string',
            gazeObservation: 'string',
            postureObservation: 'string',
            attentionObservation: 'string',
            limitations: [],
          },
        },
        technicalMetadata: fallback.observableBehavior,
      }),
    });

    const vision = parseVisionJson(content);
    return {
      eyeContactScore: vision.eyeContactScore,
      postureScore: vision.postureScore,
      attentionScore: vision.attentionScore,
      observableBehavior: {
        ...fallback.observableBehavior,
        ...vision.observableBehavior,
      },
      rawData: {
        status: 'OPENAI_FRAME_ANALYSIS',
        message: 'Video analysis used sampled frames from the answer segment. Scores are based on observable visual cues only.',
        frameCount: imagePaths.length,
        vision: vision.rawData,
        metadata: fallback.rawData.metadata,
      },
    };
  } catch (error) {
    return {
      ...fallback,
      rawData: {
        ...fallback.rawData,
        status: 'VIDEO_FRAME_ANALYSIS_FAILED',
        errorMessage: error.message,
      },
    };
  }
};

module.exports = {
  analyzeVideoSegment,
};
