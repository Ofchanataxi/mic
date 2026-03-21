export const serviceConfig = {
  port: Number(process.env.PORT ?? 3010),
  maxTranscriptLength: Number(process.env.MAX_TRANSCRIPT_LENGTH ?? 15000),
  maxQuestionLength: Number(process.env.MAX_QUESTION_LENGTH ?? 3000),
};
