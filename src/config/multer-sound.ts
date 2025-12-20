import multer from "multer";

// Allowed audio mime types
const ALLOWED_AUDIO_TYPES = [
  "audio/mpeg", // MP3
  "audio/mp3", // MP3 (alternative)
  "audio/wav", // WAV
  "audio/wave", // WAV (alternative)
  "audio/ogg", // OGG
  "audio/webm", // WebM
  "audio/aac", // AAC
  "audio/x-m4a", // M4A
];

// Max file size: 2MB
const MAX_AUDIO_SIZE = 2 * 1024 * 1024;

// Use memory storage for S3 upload
const storage = multer.memoryStorage();

// File filter for audio files
const audioFilter: multer.Options["fileFilter"] = (_req, file, cb) => {
  if (ALLOWED_AUDIO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        `Tipo de arquivo não permitido. Use: MP3, WAV, OGG ou WebM. Recebido: ${file.mimetype}`
      )
    );
  }
};

// Multer configuration for audio uploads (memory storage for S3)
export const uploadSound = multer({
  storage,
  fileFilter: audioFilter,
  limits: {
    fileSize: MAX_AUDIO_SIZE,
  },
});
