const { Queue } = require("bullmq");
const { env } = require("./env");
const { redisConnection } = require("./redis");

const mediaProcessingQueue = new Queue(env.queueName, {
  connection: redisConnection
});

module.exports = {
  mediaProcessingQueue
};
