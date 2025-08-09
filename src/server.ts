import express from 'express';
import cors from 'cors';
import { config } from 'dotenv';
import path from 'path';
import { answerQuestion } from './services/qaService';

config();

const app = express();
app.use(cors());
app.use(express.json());

// API de perguntas
app.post('/api/ask', async (req, res) => {
  try {
    const pergunta = String(req.body?.question ?? '').trim();
    if (!pergunta) return res.status(400).json({ error: 'question é obrigatório' });
    const result = await answerQuestion(pergunta);
    res.json(result);
  } catch (err: any) {
    console.error('Erro /api/ask:', err);
    res.status(500).json({ error: 'Erro interno', details: String(err?.message || err) });
  }
});

// UI estática
app.use('/', express.static(path.join(__dirname, '..', 'public')));

const port = Number(process.env.PORT || 3000);
app.listen(port, () => {
  console.log(`🌐 Web UI disponível em http://localhost:${port}`);
});


