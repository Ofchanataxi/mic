const express = require("express");
const cors = require("cors");
const mediaRoutes = require("./routes/mediaRoutes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");
const { ensureStorageReady } = require("./storage");

async function createApp() {
  await ensureStorageReady();

  const app = express();

  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  app.get("/health", (req, res) => {
    res.status(200).json({
      service: "media-service",
      status: "ok"
    });
  });

  app.use("/media", mediaRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
