"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.OllamaService = void 0;
const ollama_1 = require("@langchain/community/llms/ollama");
const ollama_2 = require("@langchain/community/embeddings/ollama");
class OllamaService {
    constructor() {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'mistral:latest';
        this.llm = new ollama_1.Ollama({
            baseUrl,
            model,
            temperature: 0.7
        });
        this.embeddings = new ollama_2.OllamaEmbeddings({
            baseUrl,
            model
        });
    }
    /**
     * Gera uma resposta usando o modelo Mistral
     */
    async generateResponse(prompt) {
        try {
            const response = await this.llm.invoke(prompt);
            return response;
        }
        catch (error) {
            console.error('Erro ao gerar resposta com Ollama:', error);
            throw error;
        }
    }
    /**
     * Gera embeddings para um texto
     */
    async generateEmbedding(text) {
        try {
            const embedding = await this.embeddings.embedQuery(text);
            return embedding;
        }
        catch (error) {
            console.error('Erro ao gerar embedding com Ollama:', error);
            throw error;
        }
    }
    /**
     * Gera embeddings para múltiplos textos
     */
    async generateEmbeddings(texts) {
        try {
            const embeddings = await this.embeddings.embedDocuments(texts);
            return embeddings;
        }
        catch (error) {
            console.error('Erro ao gerar embeddings com Ollama:', error);
            throw error;
        }
    }
    /**
     * Testa a conexão com o Ollama
     */
    async testConnection() {
        try {
            const response = await this.llm.invoke('Teste de conexão');
            return response.length > 0;
        }
        catch (error) {
            console.error('Erro ao testar conexão com Ollama:', error);
            return false;
        }
    }
}
exports.OllamaService = OllamaService;
//# sourceMappingURL=ollamaService.js.map