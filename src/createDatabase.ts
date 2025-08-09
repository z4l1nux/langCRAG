import { config } from 'dotenv';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { LanceDB as LanceDBStore } from '@langchain/community/vectorstores/lancedb';
import { connect } from 'vectordb';
import { DocumentProcessor } from './utils/documentProcessor';
import { CAPECMapping } from './types';
import * as fs from 'fs';
import * as path from 'path';

// Carrega as variáveis de ambiente
config();

async function createDatabase() {
  try {
    console.log('🚀 Criando banco de dados vetorial...');

    const documents = await loadDocuments();
    const chunks = splitChunks(documents);
    await vectorizeChunks(chunks);

    console.log('✅ Banco de dados criado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao criar banco de dados:', error);
  }
}

async function loadDocuments() {
  console.log('📖 Carregando documentos...');
  const dataDir = path.join(__dirname, '..', 'data');
  const files = fs.readdirSync(dataDir);
  const processor = new DocumentProcessor();
  let allChunks: any[] = [];

  for (const file of files) {
    const filePath = path.join(dataDir, file);
    const fileContent = fs.readFileSync(filePath);
    const extension = path.extname(file).toLowerCase();

    const chunks = await processor.processFile(fileContent, extension);
    allChunks = allChunks.concat(chunks);
  }

  const documents = allChunks.map(chunk => ({
    pageContent: chunk.content,
    metadata: {
      category: String(chunk.metadata?.category ?? ''),
      attack: String(chunk.metadata?.attack ?? ''),
      link: String(chunk.metadata?.link ?? ''),
      level: Number(chunk.metadata?.level ?? 0)
    }
  }));

  console.log(`✅ ${documents.length} documentos carregados`);
  return documents;
}

function splitChunks(documents: any[]) {
  console.log('✂️ Dividindo documentos em chunks...');

  const chunks = [];
  const chunkSize = 2000;
  const chunkOverlap = 500;

  for (const doc of documents) {
    const content = doc.pageContent;

    if (content.length <= chunkSize) {
      chunks.push(doc);
    } else {
      for (let i = 0; i < content.length; i += chunkSize - chunkOverlap) {
        const chunkContent = content.slice(i, i + chunkSize);
        chunks.push({
          pageContent: chunkContent,
          metadata: {
            ...doc.metadata,
            startIndex: i
          }
        });
      }
    }
  }

  console.log(`✅ ${chunks.length} chunks criados`);
  return chunks;
}

async function vectorizeChunks(chunks: any[]) {
  console.log('🔢 Vetorizando chunks (LanceDB)...');

  const embeddings = new OllamaEmbeddings({
    baseUrl: process.env.OLLAMA_BASE_URL || 'http://192.168.1.57:11434',
    model: process.env.OLLAMA_EMBEDDINGS_MODEL || 'nomic-embed-text:latest'
  });

  const dbDir = process.env.LANCEDB_DIR || path.join(__dirname, '..', 'lancedb');
  const ldb = await connect(dbDir);
  const tableName = 'capec_attacks';

  let table;
  try {
    table = await ldb.openTable(tableName);
  } catch {
    const probe = await embeddings.embedQuery('probe');
    const dim = probe.length;
    await ldb.createTable(tableName, [
      { vector: new Array(dim).fill(0), text: '', category: '', attack: '', link: '', level: '', startIndex: 0 }
    ]);
    table = await ldb.openTable(tableName);
  }

  const store = new LanceDBStore(embeddings, { table });
  const batchSize = Number(process.env.LANCEDB_BATCH_SIZE || 100);
  for (let i = 0; i < chunks.length; i += batchSize) {
    const batch = chunks.slice(i, i + batchSize).map((doc: any) => ({
      pageContent: String(doc.pageContent ?? ''),
      metadata: {
        category: doc.metadata?.category ? String(doc.metadata.category) : '',
        attack: doc.metadata?.attack ? String(doc.metadata.attack) : '',
        link: doc.metadata?.link ? String(doc.metadata.link) : '',
        level: doc.metadata?.level !== undefined && doc.metadata?.level !== null ? String(doc.metadata.level) : '',
        startIndex: Number(doc.metadata?.startIndex ?? 0)
      }
    }));
    await store.addDocuments(batch as any);
    console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} enviado (${batch.length} itens)`);
  }

  console.log('✅ Todos os chunks foram vetorizados e armazenados no LanceDB');
  return store;
}

// Executa se chamado diretamente
if (require.main === module) {
  createDatabase();
}

export { createDatabase }; 