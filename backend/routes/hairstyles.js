const express = require("express");
const multer = require("multer");
const OpenAI = require("openai");
const { toFile } = require("openai/uploads");
const hairstyles = require("../config/hairstyles");

const router = express.Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter: (req, file, callback) => {
    const allowed = ["image/jpeg", "image/png", "image/webp"];

    if (!allowed.includes(file.mimetype)) {
      return callback(
        new Error("Foto harus berformat JPG, PNG, atau WEBP.")
      );
    }

    callback(null, true);
  }
});

router.get("/", (req, res) => {
  res.json({
    success: true,
    hairstyles: Object.entries(hairstyles).map(([id, style]) => ({
      id,
      name: style.name
    }))
  });
});

router.post("/generate", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Silakan unggah foto terlebih dahulu."
      });
    }

    const style = hairstyles[req.body.style];

    if (!style) {
      return res.status(400).json({
        success: false,
        error: "Pilihan gaya rambut tidak valid."
      });
    }

    if (!process.env.OPENAI_API_KEY) {
      return res.status(503).json({
        success: false,
        error: "API AI belum dikonfigurasi oleh pengelola."
      });
    }

    const client = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
      timeout: 150000,
      maxRetries: 0
    });

    const imageFile = await toFile(
      req.file.buffer,
      req.file.originalname || "photo.jpg",
      { type: req.file.mimetype }
    );

    const result = await client.images.edit({
      model: process.env.OPENAI_IMAGE_MODEL || "gpt-image-2",
      image: imageFile,
      prompt:
        "Edit this person's photograph to change only the hairstyle. " +
        style.prompt +
        " Preserve the person's identity, face, facial features, skin tone, " +
        "expression, clothing, background, and camera angle. " +
        "Make the hairstyle photorealistic and naturally blended. " +
        "Do not change the person's face.",
      size: "1024x1024",
      n: 1
    });

    const imageData = result.data && result.data[0];

    if (!imageData || !imageData.b64_json) {
      throw new Error("AI tidak mengembalikan hasil gambar.");
    }

    res.json({
      success: true,
      style: {
        id: req.body.style,
        name: style.name
      },
      image: "data:image/png;base64," + imageData.b64_json
    });
  } catch (error) {
    console.error("Kesalahan pemrosesan foto:", error.message);

    res.status(500).json({
      success: false,
      error: "Foto gagal diproses. Silakan coba lagi."
    });
  }
});

module.exports = router;
