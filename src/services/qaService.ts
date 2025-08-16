import { config } from 'dotenv';
import { LanceDB as LanceDBStore } from '@langchain/community/vectorstores/lancedb';
import { connect } from 'vectordb';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Ollama } from '@langchain/community/llms/ollama';
import * as path from 'path';
import { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_EMBEDDINGS_MODEL, LANCEDB_DIR } from '../config';

config();

const promptTemplate = `
Você é um assistente que responde ESTRITAMENTE com base na evidência fornecida.

Tarefa do usuário (PT-BR):
{pergunta}

Evidência (trechos relevantes da base):
{base_conhecimento}

Instruções de resposta:
- Se a evidência contiver os itens pedidos, responda com uma lista objetiva contendo código CAPEC e título.
- Se a evidência não contiver a resposta, diga claramente que não encontrou na base.
- Não invente conteúdo que não esteja na evidência.
- Responda em português do Brasil.
`;

export interface QAResult {
  answer: string;
  sources: Array<{ pageContent: string; metadata: any }>;
}

const cache = new Map<string, QAResult>();

export async function answerQuestion(pergunta: string): Promise<QAResult> {
  if (cache.has(pergunta)) {
    return cache.get(pergunta)!;
  }

  // Embeddings e BD
  const embeddingFunction = new OllamaEmbeddings({
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_EMBEDDINGS_MODEL
  });

  const dbDir = LANCEDB_DIR;
  const ldb = await connect(dbDir);
  const table = await ldb.openTable('capec_attacks');
  const db = new LanceDBStore(embeddingFunction, { table });

  // Busca vetorial com filtro de categoria STRIDE, se detectado
  const resultados = await filteredSimilaritySearch(db, pergunta, 12);
  const documentos = resultados.map((r: [any, number]) => r[0]);
  const contents = documentos.map((d: any) => d.pageContent as string);

  // Resposta direta por categoria STRIDE
  const direta = tryDirectCategoryAnswer(pergunta, contents);
  if (direta) {
    const result = { answer: direta, sources: documentos as any };
    cache.set(pergunta, result);
    return result;
  }

  // Monta prompt e chama LLM
  const baseConhecimento = contents.join('\n\n----\n\n');
  const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
  const formattedPrompt = await prompt.format({ pergunta, base_conhecimento: baseConhecimento });

  const modelo = new Ollama({
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL
  });

  const resposta = await modelo.invoke(formattedPrompt);
  const result = { answer: String(resposta), sources: documentos as any };
  cache.set(pergunta, result);
  return result;
}

function detectStrideCategory(pergunta: string): string | null {
  const map: Record<string, string> = {
    'spoofing': 'Spoofing',
    'tampering': 'Tampering',
    'repudiation': 'Repudiation',
    'information disclosure': 'Information Disclosure',
    'info disclosure': 'Information Disclosure',
    'denial of service': 'Denial of Service',
    'dos': 'Denial of Service',
    'elevation of privilege': 'Elevation of Privilege',
    'eop': 'Elevation of Privilege'
  };
  const q = pergunta.toLowerCase();
  for (const [k, v] of Object.entries(map)) {
    if (q.includes(k)) return v;
  }
  return null;
}

async function filteredSimilaritySearch(db: any, pergunta: string, k: number) {
  const stride = detectStrideCategory(pergunta);
  if (!stride) {
    return await db.similaritySearchWithScore(pergunta, k);
  }

  // Primeiro busca ampla
  const initial = await db.similaritySearchWithScore(pergunta, Math.max(k, 12));
  // Prioriza documentos cuja categoria bate com STRIDE detectado
  const preferred = initial.filter(([doc]: any) => String(doc.metadata?.category || '').toLowerCase().includes(stride.toLowerCase()));
  const others = initial.filter(([doc]: any) => !String(doc.metadata?.category || '').toLowerCase().includes(stride.toLowerCase()));
  const merged = [...preferred, ...others].slice(0, k);
  return merged;
}

function tryDirectCategoryAnswer(pergunta: string, contents: string[]): string | null {
  const categoryMatch = (pergunta.toLowerCase().match(/(?:de|da|do)\s+([a-zA-Z \-]+)/) || [])[1]?.trim();
  const candidate = categoryMatch || pergunta.toLowerCase();

  const doc = contents.find(c => /CATEGORIA:\s*/i.test(c) && c.toLowerCase().includes(candidate));
  if (!doc) return null;

  const capecs: { id: string; title: string; link: string }[] = [];
  const regex = /\[\s*CAPEC-(\d+):\s*([^\]]+)\]\(([^)]+)\)/g;
  let m: RegExpExecArray | null;
  while ((m = regex.exec(doc)) !== null) {
    capecs.push({ id: `CAPEC-${m[1]}`, title: m[2].trim(), link: m[3].trim() });
  }
  if (capecs.length === 0) return null;

  const linhas = capecs.map(c => `- ${c.id}: ${c.title} — ${c.link}`);
  return `✅ Encontrado na base:\n${linhas.join('\n')}`;
}


