require("dotenv").config();

const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 10000;

app.use(cors({
  origin: process.env.FRONTEND_ORIGIN || "https://amnesfubbia.github.io"
}));

app.use(express.json());

app.get("/", (req, res) => {
  res.json({
    app: "H(Ai)R Backend",
    status: "running"
  });
});

app.get("/api/health", (req, res) => {
  res.json({
    success: true,
    message: "Backend H(Ai)R aktif",
    aiConfigured: Boolean(process.env.OPENAI_API_KEY)
  });
});

app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({
    success: false,
    error: "Terjadi kesalahan pada server."
  });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`H(Ai)R backend berjalan pada port ${PORT}`);
});
