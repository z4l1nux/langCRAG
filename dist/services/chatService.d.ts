export declare class ChatService {
    private llm;
    private vectorStore;
    private useOllama;
    constructor();
    /**
     * Inicializa o serviço de chat
     */
    initialize(): Promise<void>;
    /**
     * Processa uma pergunta do usuário e retorna uma resposta
     */
    processQuestion(question: string): Promise<string>;
    /**
     * Constrói o contexto a partir dos documentos relevantes
     */
    private buildContext;
    /**
     * Cria o prompt para o LLM
     */
    private createPrompt;
    /**
     * Busca informações sobre uma categoria específica
     */
    getCategoryInfo(category: string): Promise<string>;
    /**
     * Busca informações sobre um ataque específico
     */
    getAttackInfo(attackId: string): Promise<string>;
}
//# sourceMappingURL=chatService.d.ts.map