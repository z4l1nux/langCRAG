"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.VectorStoreService = void 0;
const chromadb_1 = require("chromadb");
const openai_1 = require("@langchain/openai");
const ollama_1 = require("@langchain/community/embeddings/ollama");
// Wrapper para compatibilidade com ChromaDB
class OpenAIEmbeddingFunction {
    constructor(embeddings) {
        this.embeddings = embeddings;
    }
    async generate(texts) {
        return await this.embeddings.embedDocuments(texts);
    }
}
// Wrapper para Ollama embeddings
class OllamaEmbeddingFunction {
    constructor(embeddings) {
        this.embeddings = embeddings;
    }
    async generate(texts) {
        return await this.embeddings.embedDocuments(texts);
    }
}
class VectorStoreService {
    constructor() {
        this.collection = null;
        this.client = new chromadb_1.ChromaClient();
        this.useOllama = !process.env.OPENAI_API_KEY && !!process.env.OLLAMA_BASE_URL;
        if (this.useOllama) {
            const baseUrl = process.env.OLLAMA_BASE_URL || 'http://192.168.1.57:11434';
            const model = process.env.OLLAMA_MODEL || 'mistral:latest';
            this.embeddings = new ollama_1.OllamaEmbeddings({
                baseUrl,
                model
            });
            this.embeddingFunction = new OllamaEmbeddingFunction(this.embeddings);
        }
        else {
            this.embeddings = new openai_1.OpenAIEmbeddings({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: process.env.EMBEDDING_MODEL || 'text-embedding-ada-002'
            });
            this.embeddingFunction = new OpenAIEmbeddingFunction(this.embeddings);
        }
    }
    /**
     * Inicializa ou conecta à coleção do ChromaDB
     */
    async initializeCollection(collectionName = 'capec_attacks') {
        try {
            // Tenta obter a coleção existente
            this.collection = await this.client.getCollection({
                name: collectionName,
                embeddingFunction: this.embeddingFunction
            });
            console.log(`✅ Conectado à coleção existente: ${collectionName}`);
        }
        catch (error) {
            // Cria uma nova coleção se não existir
            this.collection = await this.client.createCollection({
                name: collectionName,
                metadata: {
                    description: 'Base de conhecimento de ataques CAPEC'
                },
                embeddingFunction: this.embeddingFunction
            });
            console.log(`✅ Nova coleção criada: ${collectionName}`);
        }
    }
    /**
     * Adiciona chunks ao banco vetorial
     */
    async addChunks(chunks) {
        if (!this.collection) {
            throw new Error('Coleção não inicializada');
        }
        console.log(`📝 Adicionando ${chunks.length} chunks ao banco vetorial...`);
        const documents = [];
        const metadatas = [];
        const ids = [];
        for (const chunk of chunks) {
            documents.push(chunk.content);
            metadatas.push({
                category: chunk.metadata.category,
                attack: chunk.metadata.attack,
                link: chunk.metadata.link,
                level: chunk.metadata.level
            });
            ids.push(chunk.id);
        }
        // Gera embeddings em lotes para evitar rate limits
        const batchSize = 10;
        for (let i = 0; i < documents.length; i += batchSize) {
            const batch = documents.slice(i, i + batchSize);
            const batchIds = ids.slice(i, i + batchSize);
            const batchMetadatas = metadatas.slice(i, i + batchSize);
            const embeddings = await this.embeddings.embedDocuments(batch);
            await this.collection.add({
                ids: batchIds,
                embeddings: embeddings,
                documents: batch,
                metadatas: batchMetadatas
            });
            console.log(`✅ Lote ${Math.floor(i / batchSize) + 1} processado`);
        }
        console.log(`✅ Todos os ${chunks.length} chunks foram adicionados com sucesso!`);
    }
    /**
     * Busca documentos similares
     */
    async searchSimilar(query, limit = 5) {
        if (!this.collection) {
            throw new Error('Coleção não inicializada');
        }
        const queryEmbedding = await this.embeddings.embedQuery(query);
        const results = await this.collection.query({
            queryEmbeddings: [queryEmbedding],
            nResults: limit
        });
        return results.documents?.[0]?.map((doc, index) => ({
            content: doc,
            metadata: results.metadatas?.[0]?.[index] || {},
            score: results.distances?.[0]?.[index] || 0
        })) || [];
    }
    /**
     * Busca por categoria específica
     */
    async searchByCategory(category, limit = 10) {
        if (!this.collection) {
            throw new Error('Coleção não inicializada');
        }
        const results = await this.collection.query({
            queryTexts: [category],
            nResults: limit,
            where: {
                category: category
            }
        });
        return results.documents?.[0]?.map((doc, index) => ({
            content: doc,
            metadata: results.metadatas?.[0]?.[index] || {},
            score: results.distances?.[0]?.[index] || 0
        })) || [];
    }
    /**
     * Busca por ataque específico
     */
    async searchByAttack(attackId) {
        if (!this.collection) {
            throw new Error('Coleção não inicializada');
        }
        const results = await this.collection.query({
            queryTexts: [attackId],
            nResults: 1,
            where: {
                attack: attackId
            }
        });
        return results.documents?.[0]?.map((doc, index) => ({
            content: doc,
            metadata: results.metadatas?.[0]?.[index] || {},
            score: results.distances?.[0]?.[index] || 0
        })) || [];
    }
    /**
     * Obtém estatísticas da coleção
     */
    async getCollectionStats() {
        if (!this.collection) {
            throw new Error('Coleção não inicializada');
        }
        const count = await this.collection.count();
        return { count };
    }
}
exports.VectorStoreService = VectorStoreService;
//# sourceMappingURL=vectorStore.js.map