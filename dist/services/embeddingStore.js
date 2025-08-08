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
exports.EmbeddingStore = void 0;
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
class EmbeddingStore {
    constructor() {
        this.chunks = [];
        this.embeddings = [];
        this.isLoaded = false;
    }
    /**
     * Carrega embeddings do arquivo
     */
    async loadEmbeddings() {
        try {
            const embeddingsPath = path.join(__dirname, '..', '..', 'embeddings.json');
            if (!fs.existsSync(embeddingsPath)) {
                throw new Error('Arquivo embeddings.json não encontrado. Execute primeiro: npm run process-embeddings');
            }
            const embeddingsData = JSON.parse(fs.readFileSync(embeddingsPath, 'utf-8'));
            this.chunks = embeddingsData.chunks;
            this.embeddings = embeddingsData.embeddings;
            this.isLoaded = true;
            console.log(`✅ Embeddings carregados: ${this.chunks.length} chunks`);
            console.log(`📊 Estatísticas: ${embeddingsData.stats.categories} categorias, ${embeddingsData.stats.attacks} ataques`);
        }
        catch (error) {
            console.error('Erro ao carregar embeddings:', error);
            throw error;
        }
    }
    /**
     * Busca documentos similares
     */
    async searchSimilar(queryEmbedding, limit = 5) {
        if (!this.isLoaded) {
            throw new Error('Embeddings não foram carregados');
        }
        // Calcula similaridade de cosseno
        const similarities = this.embeddings.map((docEmbedding, index) => {
            const similarity = this.cosineSimilarity(queryEmbedding, docEmbedding);
            return {
                index,
                similarity
            };
        });
        // Ordena por similaridade
        similarities.sort((a, b) => b.similarity - a.similarity);
        // Retorna os top resultados
        return similarities.slice(0, limit).map(item => ({
            content: this.chunks[item.index].content,
            metadata: this.chunks[item.index].metadata,
            score: item.similarity
        }));
    }
    /**
     * Busca por categoria específica
     */
    async searchByCategory(category, limit = 10) {
        if (!this.isLoaded) {
            throw new Error('Embeddings não foram carregados');
        }
        const results = this.chunks
            .filter(doc => doc.metadata.category.toLowerCase().includes(category.toLowerCase()))
            .slice(0, limit)
            .map(doc => ({
            content: doc.content,
            metadata: doc.metadata,
            score: 1.0
        }));
        return results;
    }
    /**
     * Busca por ataque específico
     */
    async searchByAttack(attackId) {
        if (!this.isLoaded) {
            throw new Error('Embeddings não foram carregados');
        }
        const results = this.chunks
            .filter(doc => doc.metadata.attack.includes(attackId))
            .map(doc => ({
            content: doc.content,
            metadata: doc.metadata,
            score: 1.0
        }));
        return results;
    }
    /**
     * Calcula similaridade de cosseno entre dois vetores
     */
    cosineSimilarity(vecA, vecB) {
        const dotProduct = vecA.reduce((sum, a, i) => sum + a * vecB[i], 0);
        const magnitudeA = Math.sqrt(vecA.reduce((sum, a) => sum + a * a, 0));
        const magnitudeB = Math.sqrt(vecB.reduce((sum, b) => sum + b * b, 0));
        return dotProduct / (magnitudeA * magnitudeB);
    }
    /**
     * Obtém estatísticas da coleção
     */
    getStats() {
        return { count: this.chunks.length };
    }
    /**
     * Verifica se os embeddings foram carregados
     */
    isEmbeddingsLoaded() {
        return this.isLoaded;
    }
}
exports.EmbeddingStore = EmbeddingStore;
//# sourceMappingURL=embeddingStore.js.map