import { SearchResult } from '../types';
export declare class EmbeddingStore {
    private chunks;
    private embeddings;
    private isLoaded;
    /**
     * Carrega embeddings do arquivo
     */
    loadEmbeddings(): Promise<void>;
    /**
     * Busca documentos similares
     */
    searchSimilar(queryEmbedding: number[], limit?: number): Promise<SearchResult[]>;
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
    /**
     * Verifica se os embeddings foram carregados
     */
    isEmbeddingsLoaded(): boolean;
}
//# sourceMappingURL=embeddingStore.d.ts.map