import { config } from 'dotenv';
import { OllamaEmbeddings } from '@langchain/community/embeddings/ollama';
import { LanceDB as LanceDBStore } from '@langchain/community/vectorstores/lancedb';
import { connect } from 'vectordb';
import { DocumentProcessor } from './utils/documentProcessor';
import * as fs from 'fs';
import * as path from 'path';
import * as crypto from 'crypto';
import { OLLAMA_BASE_URL, OLLAMA_EMBEDDINGS_MODEL, LANCEDB_DIR, LANCEDB_BATCH_SIZE, LANCEDB_TABLE_NAME } from './config';

// Carrega as variáveis de ambiente
config();

// File to store processed file hashes
const HASH_FILE = path.join(LANCEDB_DIR, 'processed_files.json');

interface ProcessedFile {
  filename: string;
  hash: string;
  processedAt: string;
}

async function updateDatabase() {
  try {
    console.log('🔍 Verificando novos arquivos para adicionar ao banco de dados...');

    // Load previously processed files
    let processedFiles: ProcessedFile[] = [];
    if (fs.existsSync(HASH_FILE)) {
      processedFiles = JSON.parse(fs.readFileSync(HASH_FILE, 'utf-8'));
    }

    const dataDir = path.join(__dirname, '..', 'data');
    const files = fs.readdirSync(dataDir);
    const processor = new DocumentProcessor();
    let allChunks: any[] = [];
    let newFilesProcessed = 0;

    for (const file of files) {
      const filePath = path.join(dataDir, file);
      const fileContent = fs.readFileSync(filePath);
      const extension = path.extname(file).toLowerCase();
      
      // Calculate file hash
      const hash = crypto.createHash('md5').update(fileContent).digest('hex');
      
      // Check if file was already processed
      const existingFile = processedFiles.find(f => f.filename === file);
      if (existingFile && existingFile.hash === hash) {
        console.log(`✅ Arquivo ${file} já processado e não modificado`);
        continue;
      }

      console.log(`🆕 Processando arquivo novo ou modificado: ${file}`);
      
      const chunks = await processor.processFile(fileContent, extension);
      if (chunks.length > 0) {
        const documents = chunks.map(chunk => ({
          pageContent: chunk.content,
          metadata: {
            category: String(chunk.metadata?.category ?? ''),
            attack: String(chunk.metadata?.attack ?? ''),
            link: String(chunk.metadata?.link ?? ''),
            level: Number(chunk.metadata?.level ?? 0)
          }
        }));
        
        allChunks = allChunks.concat(documents);
        newFilesProcessed++;
        
        // Update processed files record
        if (existingFile) {
          existingFile.hash = hash;
          existingFile.processedAt = new Date().toISOString();
        } else {
          processedFiles.push({
            filename: file,
            hash,
            processedAt: new Date().toISOString()
          });
        }
      }
    }

    if (newFilesProcessed === 0) {
      console.log('✅ Nenhum arquivo novo ou modificado encontrado');
      return;
    }

    console.log(`✅ ${newFilesProcessed} arquivos novos ou modificados encontrados`);
    await vectorizeChunks(allChunks);

    // Save processed files record
    if (!fs.existsSync(LANCEDB_DIR)) {
      fs.mkdirSync(LANCEDB_DIR, { recursive: true });
    }
    fs.writeFileSync(HASH_FILE, JSON.stringify(processedFiles, null, 2));

    console.log('✅ Banco de dados atualizado com sucesso!');
  } catch (error) {
    console.error('❌ Erro ao atualizar banco de dados:', error);
  }
}

async function vectorizeChunks(chunks: any[]) {
  console.log(`🔢 Vetorizando ${chunks.length} chunks (LanceDB)...`);

  const embeddings = new OllamaEmbeddings({
    baseUrl: OLLAMA_BASE_URL,
    model: OLLAMA_EMBEDDINGS_MODEL
  });

  const dbDir = LANCEDB_DIR;
  const ldb = await connect(dbDir);
  const tableName = LANCEDB_TABLE_NAME;

  let table;
  try {
    table = await ldb.openTable(tableName);
  } catch {
    // Table doesn't exist, create it
    const probe = await embeddings.embedQuery('probe');
    const dim = probe.length;
    await ldb.createTable(tableName, [
      { vector: new Array(dim).fill(0), text: '', category: '', attack: '', link: '', level: '', startIndex: 0 }
    ]);
    table = await ldb.openTable(tableName);
  }

  const store = new LanceDBStore(embeddings, { table });
  const batchSize = LANCEDB_BATCH_SIZE;
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
  updateDatabase();
}

export { updateDatabase };