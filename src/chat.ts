import { config } from 'dotenv';
import { LanceDB as LanceDBStore } from '@langchain/community/vectorstores/lancedb';
import { connect } from 'vectordb';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Ollama } from '@langchain/community/llms/ollama';
import * as readline from 'readline';
import * as path from 'path';
import * as util from 'util';
import { answerQuestion } from './services/qaService';
import { OLLAMA_BASE_URL, OLLAMA_EMBEDDINGS_MODEL, LANCEDB_DIR } from './config';

// Carrega as variáveis de ambiente
config();

// Removido: DB_PATH (Chroma) não é usado. Usamos LanceDB.

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

async function askQuestion() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  try {
    console.log('🔐 Chat CAPEC - Sistema de Perguntas e Respostas');
    console.log('=' .repeat(50));
    console.log('💡 Digite "sair" para encerrar\n');

    while (true) {
      const pergunta = await new Promise<string>((resolve) => {
        rl.question('Escreva sua pergunta: ', resolve);
      });

      if (pergunta.toLowerCase() === 'sair') {
        console.log('👋 Até logo!');
        break;
      }

      await processQuestion(pergunta);
      console.log('\n' + '-'.repeat(50) + '\n');
    }
  } catch (error) {
    console.error('❌ Erro:', error);
  } finally {
    rl.close();
  }
}

async function processQuestion(pergunta: string) {
  try {
    console.log('🔍 Buscando informações relevantes...');

    // Carrega o banco de dados (LanceDB)
    const embeddingFunction = new OllamaEmbeddings({
      baseUrl: OLLAMA_BASE_URL,
      model: OLLAMA_EMBEDDINGS_MODEL
    });

    const dbDir = LANCEDB_DIR;
    const ldb = await connect(dbDir);
    const table = await ldb.openTable('capec_attacks');
    const db = new LanceDBStore(embeddingFunction, { table });

    // Compara a pergunta do usuário com o banco de dados
    const resultados = await db.similaritySearchWithScore(pergunta, 6);
    if (resultados.length === 0) {
      console.log("❌ Não conseguiu encontrar alguma informação relevante na base");
      return;
    }

    // Usa serviço compartilhado (aplica filtro STRIDE + resposta direta quando aplicável)
    const result = await answerQuestion(pergunta);
    console.log("🤖 Resposta da IA:", result.answer);

  } catch (error) {
    console.error('❌ Erro ao processar pergunta:', error);
    console.log('💡 Verifique se o banco de dados foi criado: npm run create-db');
  }
}

// Executa se chamado diretamente
if (require.main === module) {
  askQuestion();
}

export { askQuestion, processQuestion }; 

function tryDirectCategoryAnswer(pergunta: string, contents: string[]): string | null {
  const categoryMatch = (pergunta.toLowerCase().match(/de\s+([a-zA-Z \-]+)/) || [])[1]?.trim();
  const candidate = categoryMatch || pergunta.toLowerCase();

  // Procura um documento de categoria correspondente
  const doc = contents.find(c => /CATEGORIA:\s*/i.test(c) && c.toLowerCase().includes(candidate));
  if (!doc) return null;

  // Extrai entradas CAPEC (id, título, link) do markdown
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