const express = require("express");
const cors = require("cors");
const candidateRoutes = require("./routes/candidateRoutes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "2mb" }));

  app.get("/health", (req, res) => {
    res.status(200).json({
      service: "candidate-service",
      status: "ok"
    });
  });

  app.use("/candidates", candidateRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
