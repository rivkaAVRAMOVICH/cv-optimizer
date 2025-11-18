// server.js
import express from 'express';
import multer from 'multer';
import fs from "fs";  
import fsPromises from "fs/promises";
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument, StandardFonts } from 'pdf-lib';
import cors from 'cors';
import dotenv from 'dotenv';
dotenv.config();

// --- Setup __dirname in ES modules ---
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Directories ---
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const GENERATED_DIR = path.join(__dirname, 'generated');

await fsPromises.mkdir(UPLOAD_DIR, { recursive: true });
await fsPromises.mkdir(GENERATED_DIR, { recursive: true });

// --- Multer storage ---
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const unique = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, unique + '-' + file.originalname);
  }
});
const upload = multer({ storage });

// --- Init Express ---
const app = express();
app.use(cors());
app.use(express.json());

// --- Convert file to base64 ---
async function fileToBase64(filePath) {
  const data = await fsPromises.readFile(filePath);
  return data.toString('base64');
}

// --- Wrap text for PDF ---
function wrapText(text, maxCharsPerLine = 90) {
  const words = text.split(/\s+/);
  const lines = [];
  let cur = '';

  for (const w of words) {
    if ((cur + ' ' + w).trim().length > maxCharsPerLine) {
      lines.push(cur.trim());
      cur = w;
    } else {
      cur += ' ' + w;
    }
  }

  if (cur.trim()) lines.push(cur.trim());
  return lines;
}

// --- Create PDF from improved text ---
async function createPdfFromText(filename, improvedText) {
  const pdfDoc = await PDFDocument.create();
  let page = pdfDoc.addPage();
  const timesRomanFont = await pdfDoc.embedFont(StandardFonts.TimesRoman);
  const fontSize = 12;
  const margin = 50;
  const { width, height } = page.getSize();

  const wrapped = wrapText(improvedText, 80);
  let y = height - margin;

  for (const line of wrapped) {
    if (y < margin) {
      page = pdfDoc.addPage();
      y = height - margin;
    }
    page.drawText(line, { x: margin, y: y, size: fontSize, font: timesRomanFont });
    y -= fontSize + 4;
  }

  const pdfBytes = await pdfDoc.save();
  const outPath = path.join(GENERATED_DIR, filename);
  await fsPromises.writeFile(outPath, pdfBytes);
  return outPath;
}

// --- Import Google GenAI ---
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY
});

// --- Call Gemini with PDF ---
async function callGeminiReal(pdfPath, jobDescription) {
  const pdfPart = {
    inlineData: {
      data: await fsPromises.readFile(pdfPath, { encoding: 'base64' }),
      mimeType: 'application/pdf',
    },
  };

  const prompt = `
You are a professional resume optimizer.
Analyze the candidate’s CV PDF and the job description.

Return a JSON object with EXACT fields:

{
  "skills_to_highlight": [],
  "suggested_changes": [],
  "missing_skills": [],
  "match_score": 0,
  "recommendations": "",
  "improved_cv_text": ""
}

Rules:
- Respond ONLY with valid JSON.
- improved_cv_text must contain the full rewritten CV optimized for the job.
- match_score is 0-100.
`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: [
      pdfPart,
      { text: "Job description:\n" + jobDescription },
      { text: prompt }
    ],
  });

  // ניקוי Markdown
  const raw = response.text;
  const cleaned = raw.replace(/^```json\s*/i, '').replace(/```$/i, '').trim();

  try {
    return JSON.parse(cleaned);
  } catch (err) {
    console.error("Gemini returned non-JSON:", raw);
    throw new Error("Gemini response is not valid JSON");
  }
}


// --- Routes ---

// Optimize CV for job
app.post('/api/optimize-for-job', upload.single('cv'), async (req, res) => {
  try {
    const jobDescription = req.body.jobDescription || '';
    if (!req.file) return res.status(400).json({ error: 'Missing CV file' });

    const uploadedPath = req.file.path;
    const analysis = await callGeminiReal(uploadedPath, jobDescription);

    const outFilename = `improved-${Date.now()}.pdf`;
    const outPath = await createPdfFromText(outFilename, analysis.improved_cv_text);

    await fsPromises.unlink(uploadedPath).catch(() => {});

    res.json({ analysis, filename: path.basename(outPath) });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Server error', details: err.message });
  }
});

// Download improved PDF
app.get('/api/download/:filename', async (req, res) => {
  try {
    const fname = req.params.filename;
    const fullPath = path.join(GENERATED_DIR, fname);

    try { await fsPromises.access(fullPath); }
    catch { return res.status(404).send('File not found'); }

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename="${fname}"`);

    const data = await fsPromises.readFile(fullPath);
    res.send(data);
  } catch (err) {
    res.status(500).send('Server error');
  }
});

// --- Run server ---
const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
