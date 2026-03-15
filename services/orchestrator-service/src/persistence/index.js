import { createInMemoryPersistence } from './inMemoryPersistence.js';
import { createPostgresPersistence } from './postgresPersistence.js';
import { dbConfig, servicesConfig } from '../config/services.js';

export async function createPersistence() {
  if (!servicesConfig.enableDb) {
    return createInMemoryPersistence();
  }

  try {
    const persistence = createPostgresPersistence(dbConfig);
    await persistence.init();
    return persistence;
  } catch (error) {
    console.warn(`DB disabled due to initialization error: ${error.message}`);
    return createInMemoryPersistence();
  }
}
