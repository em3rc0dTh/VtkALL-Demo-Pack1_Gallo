import express from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import Cliente from '../models/Cliente.js';
import { protegerRuta } from '../middleware/auth.js';
import { env } from '../config/env.js';

const router = express.Router();

const permitirUploadPublico = (req, res, next) => {
  if (!env.enablePublicUpload) {
    return res.status(403).json({ error: 'Uploads públicos desactivados.' });
  }

  next();
};

// Configurar storage local con multer
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(process.cwd(), 'upload_utils');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'video/mp4', 'video/webm'];
  if (allowedMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Formato no permitido. Solo se permiten imágenes y videos (JPG, PNG, WEBP, GIF, MP4, WEBM)'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 50 * 1024 * 1024 }, // Max 50MB para videos
  fileFilter: fileFilter
});

// POST /api/upload/vehiculo/:clienteId/:patente
router.post('/vehiculo/:clienteId/:patente', protegerRuta, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }

    const { clienteId, patente } = req.params;
    const cliente = await Cliente.findById(clienteId);
    
    if (!cliente) {
      return res.status(404).json({ error: 'Cliente no encontrado' });
    }

    const vehiculo = cliente.vehiculos.find(v => v.patente === patente);
    if (!vehiculo) {
      return res.status(404).json({ error: 'Vehículo no encontrado en este cliente' });
    }

    const imageUrl = `/upload_utils/${req.file.filename}`;
    
    if (!vehiculo.historial_imagenes) {
      vehiculo.historial_imagenes = [];
    }

    vehiculo.historial_imagenes.push({
      url: imageUrl,
      descripcion: req.body.descripcion || ''
    });

    cliente.markModified('vehiculos');
    await cliente.save();

    res.json({ ok: true, imageUrl, vehiculo });
  } catch (error) {
    console.error('Error al subir imagen:', error);
    res.status(500).json({ error: error.message || 'Error del servidor al subir imagen' });
  }
});

// POST /api/upload/general (upload any image, return URL)
router.post('/general', protegerRuta, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    const imageUrl = `/upload_utils/${req.file.filename}`;
    res.json({ ok: true, imageUrl });
  } catch (error) {
    console.error('Error al subir imagen general:', error);
    res.status(500).json({ error: error.message || 'Error del servidor al subir imagen' });
  }
});

// POST /api/upload/public (public upload of evidence photos by customers)
router.post('/public', permitirUploadPublico, upload.single('imagen'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No se subió ninguna imagen' });
    }
    const imageUrl = `/upload_utils/${req.file.filename}`;
    res.json({ ok: true, imageUrl });
  } catch (error) {
    console.error('Error al subir imagen pública:', error);
    res.status(500).json({ error: error.message || 'Error del servidor al subir imagen' });
  }
});

export default router;
