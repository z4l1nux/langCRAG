import { config } from 'dotenv';
import { LanceDB as LanceDBStore } from '@langchain/community/vectorstores/lancedb';
import { connect } from 'vectordb';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { ChatPromptTemplate } from '@langchain/core/prompts';
import { Ollama } from '@langchain/community/llms/ollama';
import * as readline from 'readline';
import * as path from 'path';

// Carrega as variáveis de ambiente
config();

const DB_PATH = path.join(__dirname, '..', 'chroma_db');

const promptTemplate = `
Responda a pergunta do usuário:
{pergunta} 

com base nessas informações abaixo:

{base_conhecimento}`;

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
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://192.168.1.57:11434',
      model: process.env.OLLAMA_EMBEDDINGS_MODEL || process.env.OLLAMA_MODEL || 'mistral:latest'
    });

    const dbDir = process.env.LANCEDB_DIR || path.join(__dirname, '..', 'lancedb');
    const ldb = await connect(dbDir);
    const table = await ldb.openTable('capec_attacks');
    const db = new LanceDBStore(embeddingFunction, { table });

    // Compara a pergunta do usuário com o banco de dados
    const resultados = await db.similaritySearchWithScore(pergunta, 6);
    if (resultados.length === 0) {
      console.log("❌ Não conseguiu encontrar alguma informação relevante na base");
      return;
    }

    const textosResultado = resultados.map(resultado => resultado[0].pageContent);
    const baseConhecimento = textosResultado.join("\n\n----\n\n");

    // Cria o prompt
    const prompt = ChatPromptTemplate.fromTemplate(promptTemplate);
    const formattedPrompt = await prompt.format({
      pergunta: pergunta,
      base_conhecimento: baseConhecimento
    });

    // Gera a resposta
    const modelo = new Ollama({
      baseUrl: process.env.OLLAMA_BASE_URL || 'http://192.168.1.57:11434',
      model: process.env.OLLAMA_MODEL || 'mistral:latest'
    });

    const resposta = await modelo.invoke(formattedPrompt);
    console.log("🤖 Resposta da IA:", resposta);

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