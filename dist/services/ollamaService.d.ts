export declare class OllamaService {
    private llm;
    private embeddings;
    constructor();
    /**
     * Gera uma resposta usando o modelo Mistral
     */
    generateResponse(prompt: string): Promise<string>;
    /**
     * Gera embeddings para um texto
     */
    generateEmbedding(text: string): Promise<number[]>;
    /**
     * Gera embeddings para múltiplos textos
     */
    generateEmbeddings(texts: string[]): Promise<number[][]>;
    /**
     * Testa a conexão com o Ollama
     */
    testConnection(): Promise<boolean>;
}
//# sourceMappingURL=ollamaService.d.ts.map