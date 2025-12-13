import multer from 'multer';
import { env } from './env';

const allowedMimeTypes = env.ALLOWED_FILE_TYPES.split(',').map((t) => t.trim());
const maxFileSize = parseInt(env.MAX_FILE_SIZE, 10);

const fileFilter: multer.Options['fileFilter'] = (req, file, cb) => {
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Tipo de ficheiro não permitido. Permitidos: ${allowedMimeTypes.join(', ')}`));
  }
};

// Use memory storage for S3 upload
export const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter,
  limits: {
    fileSize: maxFileSize,
  },
});

