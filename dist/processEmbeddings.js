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
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const dotenv_1 = require("dotenv");
const documentProcessor_1 = require("./utils/documentProcessor");
const embeddingService_1 = require("./services/embeddingService");
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
async function processEmbeddings() {
    try {
        console.log('🚀 Iniciando processamento de embeddings CAPEC...');
        // Testa conexão com Ollama
        const embeddingService = new embeddingService_1.EmbeddingService();
        console.log('🔍 Testando conexão com Ollama...');
        const isConnected = await embeddingService.testConnection();
        if (!isConnected) {
            console.error('❌ Falha na conexão com Ollama');
            return;
        }
        console.log('✅ Conexão com Ollama estabelecida');
        // Lê o arquivo JSON
        const jsonPath = path.join(__dirname, '..', 'capec-stride-mapping.json');
        const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
        const capecData = JSON.parse(jsonContent);
        console.log('✅ Arquivo JSON carregado com sucesso');
        // Processa os documentos
        const processor = new documentProcessor_1.DocumentProcessor();
        const chunks = processor.processCAPECData(capecData);
        const stats = processor.getStats();
        console.log(`📊 Estatísticas do processamento:`);
        console.log(`   - Total de chunks: ${stats.totalChunks}`);
        console.log(`   - Categorias: ${stats.categories}`);
        console.log(`   - Ataques: ${stats.attacks}`);
        // Gera embeddings em lotes
        console.log('\n🔢 Gerando embeddings...');
        const batchSize = 20;
        const allEmbeddings = [];
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchTexts = batch.map(chunk => chunk.content);
            console.log(`📝 Processando lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}...`);
            const batchEmbeddings = await embeddingService.generateEmbeddings(batchTexts);
            allEmbeddings.push(...batchEmbeddings);
            console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} concluído (${batchEmbeddings.length} embeddings)`);
        }
        // Salva os embeddings em arquivo
        const embeddingsPath = path.join(__dirname, '..', 'embeddings.json');
        const embeddingsData = {
            chunks: chunks,
            embeddings: allEmbeddings,
            stats: stats,
            timestamp: new Date().toISOString()
        };
        fs.writeFileSync(embeddingsPath, JSON.stringify(embeddingsData, null, 2));
        console.log(`✅ Processamento concluído!`);
        console.log(`📁 Embeddings salvos em: ${embeddingsPath}`);
        console.log(`📈 Total de embeddings gerados: ${allEmbeddings.length}`);
        console.log(`🔢 Dimensões por embedding: ${allEmbeddings[0]?.length || 0}`);
    }
    catch (error) {
        console.error('❌ Erro durante o processamento:', error);
        process.exit(1);
    }
}
// Executa o script se chamado diretamente
if (require.main === module) {
    processEmbeddings();
}
//# sourceMappingURL=processEmbeddings.js.map