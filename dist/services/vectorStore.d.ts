import { DocumentChunk } from '../types';
export declare class VectorStoreService {
    private client;
    private collection;
    private embeddings;
    private embeddingFunction;
    private useOllama;
    constructor();
    /**
     * Inicializa ou conecta à coleção do ChromaDB
     */
    initializeCollection(collectionName?: string): Promise<void>;
    /**
     * Adiciona chunks ao banco vetorial
     */
    addChunks(chunks: DocumentChunk[]): Promise<void>;
    /**
     * Busca documentos similares
     */
    searchSimilar(query: string, limit?: number): Promise<any[]>;
    /**
     * Busca por categoria específica
     */
    searchByCategory(category: string, limit?: number): Promise<any[]>;
    /**
     * Busca por ataque específico
     */
    searchByAttack(attackId: string): Promise<any[]>;
    /**
     * Obtém estatísticas da coleção
     */
    getCollectionStats(): Promise<{
        count: number;
    }>;
}
//# sourceMappingURL=vectorStore.d.ts.map