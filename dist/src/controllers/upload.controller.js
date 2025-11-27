import multer from 'multer';
import * as uploadService from '../services/upload.service.js';

const storage = multer.memoryStorage();
export const upload = multer({ storage });

export const uploadImage = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({
      statusCode: 400,
      success: false,
      error: { message: 'No file' },
      data: null
    });
    const url = await uploadService.uploadImageBuffer(req.file.buffer, req.file.originalname);
    return res.status(200).json({
      statusCode: 200,
      success: true,
      error: null,
      data: { url }
    });
  } catch (e) { next(e); }
};
