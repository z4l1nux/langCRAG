"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EmbeddingService = void 0;
const ollama_1 = require("@langchain/community/embeddings/ollama");
class EmbeddingService {
    constructor() {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'mistral:latest';
        this.embeddings = new ollama_1.OllamaEmbeddings({
            baseUrl,
            model
        });
    }
    /**
     * Gera embeddings para um texto
     */
    async generateEmbedding(text) {
        try {
            return await this.embeddings.embedQuery(text);
        }
        catch (error) {
            console.error('Erro ao gerar embedding:', error);
            throw error;
        }
    }
    /**
     * Gera embeddings para múltiplos textos em lotes
     */
    async generateEmbeddings(texts) {
        try {
            return await this.embeddings.embedDocuments(texts);
        }
        catch (error) {
            console.error('Erro ao gerar embeddings:', error);
            throw error;
        }
    }
    /**
     * Testa a conexão com o Ollama
     */
    async testConnection() {
        try {
            const testEmbedding = await this.generateEmbedding('teste');
            return testEmbedding.length > 0;
        }
        catch (error) {
            console.error('Erro ao testar conexão:', error);
            return false;
        }
    }
}
exports.EmbeddingService = EmbeddingService;
//# sourceMappingURL=embeddingService.js.map