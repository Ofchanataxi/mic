import app from './app.js';
import { serviceConfig } from './config/serviceConfig.js';

if (process.env.NODE_ENV !== 'test') {
  app.listen(serviceConfig.port, () => {
    console.log(`audio-analysis-service listening on ${serviceConfig.port}`);
  });
}
