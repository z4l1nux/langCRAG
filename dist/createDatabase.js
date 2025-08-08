"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.createDatabase = createDatabase;
const dotenv_1 = require("dotenv");
const ollama_1 = require("@langchain/community/embeddings/ollama");
const chroma_1 = require("@langchain/community/vectorstores/chroma");
const documentProcessor_1 = require("./utils/documentProcessor");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
const BASE_PATH = "base";
async function createDatabase() {
    try {
        console.log('🚀 Criando banco de dados vetorial...');
        const documents = await loadDocuments();
        const chunks = splitChunks(documents);
        await vectorizeChunks(chunks);
        console.log('✅ Banco de dados criado com sucesso!');
    }
    catch (error) {
        console.error('❌ Erro ao criar banco de dados:', error);
    }
}
async function loadDocuments() {
    console.log('📖 Carregando documentos CAPEC...');
    // Lê o arquivo JSON CAPEC
    const jsonPath = path.join(__dirname, '..', 'capec-stride-mapping.json');
    const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
    const capecData = JSON.parse(jsonContent);
    // Processa os documentos usando o DocumentProcessor
    const processor = new documentProcessor_1.DocumentProcessor();
    const chunks = processor.processCAPECData(capecData);
    // Converte para formato Document do LangChain
    const documents = chunks.map(chunk => ({
        pageContent: chunk.content,
        metadata: chunk.metadata
    }));
    console.log(`✅ ${documents.length} documentos carregados`);
    return documents;
}
function splitChunks(documents) {
    console.log('✂️ Dividindo documentos em chunks...');
    // Implementação simples de divisão de chunks
    // Em uma versão mais avançada, usaríamos RecursiveCharacterTextSplitter
    const chunks = [];
    const chunkSize = 2000;
    const chunkOverlap = 500;
    for (const doc of documents) {
        const content = doc.pageContent;
        if (content.length <= chunkSize) {
            chunks.push(doc);
        }
        else {
            // Divide o conteúdo em chunks menores
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
async function vectorizeChunks(chunks) {
    console.log('🔢 Vetorizando chunks...');
    const embeddings = new ollama_1.OllamaEmbeddings({
        baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
        model: process.env.OLLAMA_MODEL || 'mistral:latest'
    });
    // Cria o banco vetorial Chroma
    const db = await chroma_1.Chroma.fromDocuments(chunks, embeddings, {
        collectionName: 'capec_attacks',
        collectionMetadata: {
            description: 'Base de conhecimento de ataques CAPEC'
        }
    });
    console.log('✅ Chunks vetorizados e armazenados no ChromaDB');
    return db;
}
// Executa se chamado diretamente
if (require.main === module) {
    createDatabase();
}
//# sourceMappingURL=createDatabase.js.map