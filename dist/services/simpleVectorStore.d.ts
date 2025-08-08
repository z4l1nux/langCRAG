import { DocumentChunk, SearchResult } from '../types';
export declare class SimpleVectorStore {
    private embeddingService;
    private documents;
    private documentEmbeddings;
    constructor();
    /**
     * Adiciona chunks ao banco vetorial
     */
    addChunks(chunks: DocumentChunk[]): Promise<void>;
    /**
     * Busca documentos similares
     */
    searchSimilar(query: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Busca por categoria específica
     */
    searchByCategory(category: string, limit?: number): Promise<SearchResult[]>;
    /**
     * Busca por ataque específico
     */
    searchByAttack(attackId: string): Promise<SearchResult[]>;
    /**
     * Calcula similaridade de cosseno entre dois vetores
     */
    private cosineSimilarity;
    /**
     * Obtém estatísticas da coleção
     */
    getStats(): {
        count: number;
    };
}
//# sourceMappingURL=simpleVectorStore.d.ts.map