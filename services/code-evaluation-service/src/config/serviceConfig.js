export const serviceConfig = {
  port: Number(process.env.PORT ?? 3005),
  maxSourceLength: Number(process.env.MAX_SOURCE_LENGTH ?? 20000),
  maxEstimatedComplexity: Number(process.env.MAX_ESTIMATED_COMPLEXITY ?? 100),
};
