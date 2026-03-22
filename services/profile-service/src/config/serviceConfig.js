export const serviceConfig = {
  port: Number(process.env.PORT ?? 3002),
  maxCvTextLength: Number(process.env.MAX_CV_TEXT_LENGTH ?? 30000),
};
