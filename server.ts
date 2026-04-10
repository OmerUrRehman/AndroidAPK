import express from 'express';
import { createServer as createViteServer } from 'vite';
import multer from 'multer';
import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Ensure directories exist in the workspace so they are saved
const dataDir = path.join(process.cwd(), 'data');
const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

// Initialize SQLite Database
const db = new Database(path.join(dataDir, 'apps.db'));
db.exec(`
  CREATE TABLE IF NOT EXISTS apps (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    image_url TEXT NOT NULL,
    apk_url TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// Setup Multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // Serve uploaded files statically
  app.use('/uploads', express.static(uploadsDir));

  // API Routes
  app.get('/api/apps', (req, res) => {
    try {
      const apps = db.prepare('SELECT * FROM apps ORDER BY created_at DESC').all();
      res.json(apps);
    } catch (error) {
      res.status(500).json({ error: 'Failed to fetch apps' });
    }
  });

  app.post(
    '/api/apps',
    upload.fields([
      { name: 'image', maxCount: 1 },
      { name: 'apk', maxCount: 1 },
    ]),
    (req, res) => {
      try {
        const { title, description } = req.body;
        const files = req.files as { [fieldname: string]: Express.Multer.File[] };

        if (!files.image || !files.apk || !title || !description) {
          return res.status(400).json({ error: 'Missing required fields or files' });
        }

        const image_url = `/uploads/${files.image[0].filename}`;
        const apk_url = `/uploads/${files.apk[0].filename}`;

        const stmt = db.prepare(
          'INSERT INTO apps (title, description, image_url, apk_url) VALUES (?, ?, ?, ?)'
        );
        const info = stmt.run(title, description, image_url, apk_url);

        res.status(201).json({ id: info.lastInsertRowid, title, description, image_url, apk_url });
      } catch (error) {
        console.error('Upload error:', error);
        res.status(500).json({ error: 'Failed to upload app' });
      }
    }
  );

  app.delete('/api/apps/:id', (req, res) => {
    try {
      const { id } = req.params;
      const appRecord = db.prepare('SELECT * FROM apps WHERE id = ?').get(id) as any;
      
      if (!appRecord) {
        return res.status(404).json({ error: 'App not found' });
      }

      // Delete files
      const imagePath = path.join(process.cwd(), appRecord.image_url);
      const apkPath = path.join(process.cwd(), appRecord.apk_url);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
      if (fs.existsSync(apkPath)) fs.unlinkSync(apkPath);

      // Delete record
      db.prepare('DELETE FROM apps WHERE id = ?').run(id);
      res.json({ success: true });
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ error: 'Failed to delete app' });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
