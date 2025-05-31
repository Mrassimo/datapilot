import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

// Import DataPilot commands
import { eda } from './commands/eda.js';
import { integrity } from './commands/int.js';
import { visualize } from './commands/vis.js';
import { engineering } from './commands/eng.js';
import { llmContext } from './commands/llm.js';

// Import DataPilot utilities
import { parseCSV } from './utils/parser.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Multer for file uploads
const upload = multer({ 
  dest: 'uploads/',
  limits: {
    fileSize: 50 * 1024 * 1024 // 50MB limit
  }
});

// Serve static files from frontend dist
const frontendDistPath = path.join(__dirname, '..', 'frontend', 'dist');
if (fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
}

// Helper function to parse CSV and extract headers
async function parseCSVForAnalysis(filePath) {
  try {
    const data = await parseCSV(filePath, { quiet: true });
    
    if (!data || data.length === 0) {
      throw new Error('No data found in CSV file');
    }
    
    // Extract headers from the first record
    const headers = Object.keys(data[0]);
    
    return { data, headers };
  } catch (error) {
    throw new Error(`Failed to parse CSV: ${error.message}`);
  }
}

// API Routes
app.post('/api/analyze/eda', upload.single('file'), async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    let actualFilePath = filePath;
    
    // If file was uploaded, use the uploaded file path
    if (req.file) {
      actualFilePath = req.file.path;
    }
    
    if (!actualFilePath) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    // Parse the CSV file using DataPilot's parser
    const { data, headers } = await parseCSVForAnalysis(actualFilePath);
    
    // Run EDA analysis
    const result = await eda(data, headers, actualFilePath, options);
    
    // Clean up uploaded file if it was temporary
    if (req.file) {
      fs.unlinkSync(actualFilePath);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('EDA analysis error:', error);
    // Clean up uploaded file on error
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/int', upload.single('file'), async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    let actualFilePath = filePath;
    
    if (req.file) {
      actualFilePath = req.file.path;
    }
    
    if (!actualFilePath) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { data, headers } = await parseCSVForAnalysis(actualFilePath);
    const result = await integrity(data, headers, actualFilePath, options);
    
    if (req.file) {
      fs.unlinkSync(actualFilePath);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('INT analysis error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/vis', upload.single('file'), async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    let actualFilePath = filePath;
    
    if (req.file) {
      actualFilePath = req.file.path;
    }
    
    if (!actualFilePath) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { data, headers } = await parseCSVForAnalysis(actualFilePath);
    const result = await visualize(data, headers, actualFilePath, options);
    
    if (req.file) {
      fs.unlinkSync(actualFilePath);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('VIS analysis error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/eng', upload.single('file'), async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    let actualFilePath = filePath;
    
    if (req.file) {
      actualFilePath = req.file.path;
    }
    
    if (!actualFilePath) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { data, headers } = await parseCSVForAnalysis(actualFilePath);
    const result = await engineering(data, headers, actualFilePath, options);
    
    if (req.file) {
      fs.unlinkSync(actualFilePath);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('ENG analysis error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/analyze/llm', upload.single('file'), async (req, res) => {
  try {
    const { filePath, options = {} } = req.body;
    let actualFilePath = filePath;
    
    if (req.file) {
      actualFilePath = req.file.path;
    }
    
    if (!actualFilePath) {
      return res.status(400).json({ error: 'No file provided' });
    }
    
    const { data, headers } = await parseCSVForAnalysis(actualFilePath);
    const result = await llmContext(data, headers, actualFilePath, options);
    
    if (req.file) {
      fs.unlinkSync(actualFilePath);
    }
    
    res.json({ success: true, result });
  } catch (error) {
    console.error('LLM analysis error:', error);
    if (req.file && fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }
    res.status(500).json({ error: error.message });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve React app for all other routes (SPA routing)
app.get('*', (req, res) => {
  const indexPath = path.join(frontendDistPath, 'index.html');
  if (fs.existsSync(indexPath)) {
    res.sendFile(indexPath);
  } else {
    res.status(404).json({ error: 'Frontend not built. Run npm run build:frontend first.' });
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Server error:', error);
  res.status(500).json({ error: 'Internal server error' });
});

export function startWebServer(port = process.env.PORT || 3000) {
  return new Promise((resolve, reject) => {
    const server = app.listen(port, (err) => {
      if (err) {
        reject(err);
      } else {
        console.log(`DataPilot web server running at http://localhost:${port}`);
        resolve(server);
      }
    });
  });
}

export default app;