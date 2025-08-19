import { config } from 'dotenv';
import { LanceDB as LanceDBStore } from '@langchain/community/vectorstores/lancedb';
import { connect } from 'vectordb';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Ollama } from '@langchain/community/llms/ollama';
import { OLLAMA_BASE_URL, OLLAMA_MODEL, OLLAMA_EMBEDDINGS_MODEL, LANCEDB_DIR, LANCEDB_TABLE_NAME } from '../config';

config();

const promptTemplate = `Você é um assistente de IA que responde perguntas com base em uma base de conhecimento.
Sua tarefa é usar os trechos da base de conhecimento fornecidos para responder à pergunta do usuário.
Responda de forma concisa e em português do Brasil.
Após sua resposta, cite as fontes que você usou. Cada fonte deve ser listada em uma nova linha no formato: [FONTE: nome_da_fonte]
O nome da fonte para cada trecho é fornecido no formato [INÍCIO DO TRECHO, FONTE: nome_da_fonte].
Se a informação não estiver nos trechos fornecidos, responda: "Não encontrei informações suficientes na base para responder a esta pergunta."

Base de Conhecimento:
{base_conhecimento}

Pergunta:
{pergunta}

Resposta e Fontes:
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

  const embeddingFunction = new OllamaEmbeddings({
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_EMBEDDINGS_MODEL
  });

  const dbDir = LANCEDB_DIR;
  const ldb = await connect(dbDir);
  const table = await ldb.openTable(LANCEDB_TABLE_NAME);
  const db = new LanceDBStore(embeddingFunction, { table });

  const searchResults = await db.similaritySearchWithScore(pergunta, 12);
  const documents = searchResults.map((r: [any, number]) => r[0]);

  const knowledgeBase = documents.map(doc => {
    const sourceName = doc.metadata?.category || doc.metadata?.id || 'desconhecida';
    return `[INÍCIO DO TRECHO, FONTE: ${sourceName}]\n${doc.pageContent}\n[FIM DO TRECHO]`;
  }).join('\n\n---\n\n');

  const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
  const formattedPrompt = await prompt.format({ pergunta, base_conhecimento: knowledgeBase });

  const modelo = new Ollama({
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_MODEL
  });

  const llmResponse = await modelo.invoke(formattedPrompt);
  const rawAnswer = String(llmResponse);

  const sourceRegex = /\n\[FONTE: ([^\]]+)\]/g;
  let match;
  const citedSourceNames = new Set<string>();
  while ((match = sourceRegex.exec(rawAnswer)) !== null) {
    citedSourceNames.add(match[1].trim());
  }

  const finalAnswer = rawAnswer.replace(sourceRegex, '').trim();

  const citedSources = documents.filter(doc => {
    const sourceName = doc.metadata?.category || doc.metadata?.id || 'desconhecida';
    return citedSourceNames.has(sourceName);
  });

  // Se nenhuma fonte for citada mas a resposta não for a padrão de "não encontrado", retorne os documentos originais
  if (citedSources.length === 0 && finalAnswer.indexOf('Não encontrei informações suficientes') === -1) {
    const result = { answer: finalAnswer, sources: documents };
    cache.set(pergunta, result);
    return result;
  }

  const result = { answer: finalAnswer, sources: citedSources };
  cache.set(pergunta, result);
  return result;
}