"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SimpleVectorStore = void 0;
const embeddingService_1 = require("./embeddingService");
class SimpleVectorStore {
    constructor() {
        this.documents = [];
        this.documentEmbeddings = [];
        this.embeddingService = new embeddingService_1.EmbeddingService();
    }
    /**
     * Adiciona chunks ao banco vetorial
     */
    async addChunks(chunks) {
        console.log(`📝 Adicionando ${chunks.length} chunks ao banco vetorial...`);
        this.documents = chunks;
        // Gera embeddings em lotes
        const batchSize = 10;
        for (let i = 0; i < chunks.length; i += batchSize) {
            const batch = chunks.slice(i, i + batchSize);
            const batchTexts = batch.map(chunk => chunk.content);
            const batchEmbeddings = await this.embeddingService.generateEmbeddings(batchTexts);
            this.documentEmbeddings.push(...batchEmbeddings);
            console.log(`✅ Lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)} processado`);
        }
        console.log(`✅ Todos os ${chunks.length} chunks foram adicionados com sucesso!`);
    }
    /**
     * Busca documentos similares
     */
    async searchSimilar(query, limit = 5) {
        const queryEmbedding = await this.embeddingService.generateEmbedding(query);
        // Calcula similaridade de cosseno
        const similarities = this.documentEmbeddings.map((docEmbedding, index) => {
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
            content: this.documents[item.index].content,
            metadata: this.documents[item.index].metadata,
            score: item.similarity
        }));
    }
    /**
     * Busca por categoria específica
     */
    async searchByCategory(category, limit = 10) {
        const results = this.documents
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
        const results = this.documents
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
        return { count: this.documents.length };
    }
}
exports.SimpleVectorStore = SimpleVectorStore;
//# sourceMappingURL=simpleVectorStore.js.map