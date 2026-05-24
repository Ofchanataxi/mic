require('dotenv').config();

const prisma = require('../config/prisma');
const env = require('../config/env');
const userRepository = require('../repositories/userRepository');
const { hashPassword } = require('../utils/passwordUtils');
const logger = require('../utils/logger');

const main = async () => {
  if (!env.adminEmail || !env.adminPassword) {
    throw new Error('ADMIN_EMAIL and ADMIN_PASSWORD are required to seed the first admin');
  }

  const existingAdmins = await userRepository.countAdmins();
  if (existingAdmins > 0) {
    logger.info('Admin user already exists; seed skipped');
    return;
  }

  if (env.adminPassword.length < 8) {
    throw new Error('ADMIN_PASSWORD must be at least 8 characters');
  }

  const passwordHash = await hashPassword(env.adminPassword);
  const admin = await userRepository.create({
    email: env.adminEmail,
    passwordHash,
    firstName: env.adminFirstName,
    lastName: env.adminLastName,
    role: 'ADMIN',
  });

  logger.info('Admin user created', { userId: admin.id, email: admin.email });
};

main()
  .catch((error) => {
    logger.error('Admin seed failed', { error: error.message });
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
