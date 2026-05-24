const express = require("express");
const cors = require("cors");
const interviewRoutes = require("./routes/interviewRoutes");
const { errorHandler, notFoundHandler } = require("./middlewares/errorHandler");

function createApp() {
  const app = express();

  app.use(cors());
  app.use(express.json({ limit: "4mb" }));

  app.get("/health", (req, res) => {
    res.status(200).json({
      service: "interview-service",
      status: "ok",
      timestamp: new Date().toISOString()
    });
  });

  app.use("/interviews", interviewRoutes);

  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}

module.exports = {
  createApp
};
