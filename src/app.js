const express = require("express");
const routes = require("./routes");

const app = express();

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Range");
  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }
  next();
});

app.use("/api/v1", routes);

app.use("/api", (req, res) => {
  res.status(404).json({ error: "Endpoint not found" });
});

module.exports = app;
