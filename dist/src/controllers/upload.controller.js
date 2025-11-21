import multer from 'multer';
import * as uploadService from '../services/upload.service.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'No file' });
    const url = await uploadService.uploadImageBuffer(req.file.buffer, req.file.originalname);
    res.json({ url });
  } catch (e) { next(e); }
};
