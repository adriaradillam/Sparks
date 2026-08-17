import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { AuthRequest } from '../middleware/auth';
import { memoryStore } from '../store/memoryStore';

const uploadsDir = path.join(__dirname, '../../public/uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configuración de almacenamiento en disco para Multer
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.jpg';
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, `photo-${uniqueSuffix}${ext}`);
  }
});

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg', 'image/gif'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato de imagen no soportado. Usa JPEG, PNG o WEBP.'));
  }
};

export const uploadMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB máximo
});

export const uploadPhotoHandler = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se ha subido ningún archivo de imagen.' });
    }

    const host = req.get('host') || 'localhost:5000';
    const protocol = req.protocol === 'https' ? 'https' : 'http';
    const relativeUrl = `/uploads/${req.file.filename}`;
    const fullUrl = `${protocol}://${host}${relativeUrl}`;

    const isAvatar = req.query.isAvatar === 'true';
    const currentUserId = req.userId;

    if (currentUserId && isAvatar) {
      const user = memoryStore.users.find((u) => u.id === currentUserId);
      if (user) {
        user.avatarUrl = fullUrl;
      }
    }

    res.json({
      success: true,
      message: 'Foto subida con éxito.',
      filename: req.file.filename,
      relativeUrl,
      url: fullUrl
    });
  } catch (error) {
    console.error('Error en uploadPhotoHandler:', error);
    res.status(500).json({ error: 'Error al procesar y guardar la imagen.' });
  }
};
