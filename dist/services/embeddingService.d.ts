export declare class EmbeddingService {
    private embeddings;
    constructor();
    /**
     * Gera embeddings para um texto
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Gera embeddings para múltiplos textos em lotes
     */
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Testa a conexão com o Ollama
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=embeddingService.d.ts.map