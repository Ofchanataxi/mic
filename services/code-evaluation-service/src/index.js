import app from './app.js';
import { serviceConfig } from './config/serviceConfig.js';

app.listen(serviceConfig.port, () => {
  console.log(`code-evaluation-service running on port ${serviceConfig.port}`);
});
