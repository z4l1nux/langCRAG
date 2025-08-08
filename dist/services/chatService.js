"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ChatService = void 0;
const openai_1 = require("@langchain/openai");
const ollama_1 = require("@langchain/community/llms/ollama");
const vectorStore_1 = require("./vectorStore");
class ChatService {
    constructor() {
        this.useOllama = !process.env.OPENAI_API_KEY && !!process.env.OLLAMA_BASE_URL;
        if (this.useOllama) {
            const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
            const model = process.env.OLLAMA_MODEL || 'mistral:latest';
            this.llm = new ollama_1.Ollama({
                baseUrl,
                model,
                temperature: 0.7
            });
        }
        else {
            this.llm = new openai_1.ChatOpenAI({
                openAIApiKey: process.env.OPENAI_API_KEY,
                modelName: process.env.OPENAI_MODEL || 'gpt-3.5-turbo',
                temperature: 0.7
            });
        }
        this.vectorStore = new vectorStore_1.VectorStoreService();
    }
    /**
     * Inicializa o serviço de chat
     */
    async initialize() {
        await this.vectorStore.initializeCollection();
    }
    /**
     * Processa uma pergunta do usuário e retorna uma resposta
     */
    async processQuestion(question) {
        try {
            // Busca documentos relevantes
            const relevantDocs = await this.vectorStore.searchSimilar(question, 3);
            if (relevantDocs.length === 0) {
                return "Desculpe, não encontrei informações relevantes sobre sua pergunta na base de conhecimento CAPEC.";
            }
            // Constrói o contexto com os documentos encontrados
            const context = this.buildContext(relevantDocs);
            // Cria o prompt para o LLM
            const prompt = this.createPrompt(question, context);
            // Gera a resposta
            const response = await this.llm.invoke(prompt);
            // Ollama retorna string diretamente, OpenAI retorna objeto com content
            return typeof response === 'string' ? response : response.content;
        }
        catch (error) {
            console.error('Erro ao processar pergunta:', error);
            return "Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.";
        }
    }
    /**
     * Constrói o contexto a partir dos documentos relevantes
     */
    buildContext(docs) {
        let context = "INFORMAÇÕES RELEVANTES DA BASE CAPEC:\n\n";
        docs.forEach((doc, index) => {
            context += `--- Documento ${index + 1} ---\n`;
            context += doc.content + "\n\n";
            if (doc.metadata.link) {
                context += `Link para mais informações: ${doc.metadata.link}\n`;
            }
            context += "---\n\n";
        });
        return context;
    }
    /**
     * Cria o prompt para o LLM
     */
    createPrompt(question, context) {
        return `
Você é um assistente especializado em segurança da informação e ataques CAPEC (Common Attack Pattern Enumeration and Classification).

Baseado nas informações fornecidas abaixo, responda à pergunta do usuário de forma clara e detalhada.

PERGUNTA DO USUÁRIO: ${question}

${context}

INSTRUÇÕES:
1. Responda em português brasileiro
2. Seja específico e técnico quando apropriado
3. Mencione os códigos CAPEC relevantes
4. Forneça links para mais informações quando disponíveis
5. Se a pergunta não estiver relacionada a ataques de segurança, informe educadamente que você é especializado em CAPEC

RESPOSTA:
    `.trim();
    }
    /**
     * Busca informações sobre uma categoria específica
     */
    async getCategoryInfo(category) {
        try {
            const docs = await this.vectorStore.searchByCategory(category, 5);
            if (docs.length === 0) {
                return `Não encontrei informações sobre a categoria "${category}" na base de conhecimento.`;
            }
            const context = this.buildContext(docs);
            const prompt = `
Você é um especialista em segurança da informação. Forneça informações detalhadas sobre a categoria de ataques "${category}" baseado nas informações abaixo:

${context}

Responda em português brasileiro, explicando:
1. O que é esta categoria de ataques
2. Quais são os principais tipos de ataques incluídos
3. Como os atacantes podem usar estas técnicas
4. Medidas de proteção recomendadas
      `.trim();
            const response = await this.llm.invoke(prompt);
            return typeof response === 'string' ? response : response.content;
        }
        catch (error) {
            console.error('Erro ao buscar informações da categoria:', error);
            return "Desculpe, ocorreu um erro ao buscar informações sobre esta categoria.";
        }
    }
    /**
     * Busca informações sobre um ataque específico
     */
    async getAttackInfo(attackId) {
        try {
            const docs = await this.vectorStore.searchByAttack(attackId);
            if (docs.length === 0) {
                return `Não encontrei informações sobre o ataque "${attackId}" na base de conhecimento.`;
            }
            const context = this.buildContext(docs);
            const prompt = `
Você é um especialista em segurança da informação. Forneça informações detalhadas sobre o ataque "${attackId}" baseado nas informações abaixo:

${context}

Responda em português brasileiro, explicando:
1. O que é este ataque
2. Como funciona
3. Quais são os vetores de ataque
4. Como detectar e prevenir este tipo de ataque
5. Impacto potencial na segurança
      `.trim();
            const response = await this.llm.invoke(prompt);
            return typeof response === 'string' ? response : response.content;
        }
        catch (error) {
            console.error('Erro ao buscar informações do ataque:', error);
            return "Desculpe, ocorreu um erro ao buscar informações sobre este ataque.";
        }
    }
}
exports.ChatService = ChatService;
//# sourceMappingURL=chatService.js.map