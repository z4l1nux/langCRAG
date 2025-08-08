"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const readline = __importStar(require("readline"));
const dotenv_1 = require("dotenv");
const ollama_1 = require("@langchain/community/llms/ollama");
const embeddingService_1 = require("./services/embeddingService");
const embeddingStore_1 = require("./services/embeddingStore");
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
class OptimizedChatInterface {
    constructor() {
        this.isInitialized = false;
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'mistral:latest';
        this.llm = new ollama_1.Ollama({
            baseUrl,
            model,
            temperature: 0.7
        });
        this.embeddingService = new embeddingService_1.EmbeddingService();
        this.embeddingStore = new embeddingStore_1.EmbeddingStore();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    async initialize() {
        console.log('🔐 Inicializando sistema RAG CAPEC otimizado...');
        try {
            // Carrega embeddings pré-processados
            console.log('📖 Carregando embeddings pré-processados...');
            await this.embeddingStore.loadEmbeddings();
            this.isInitialized = true;
            console.log('✅ Sistema inicializado com sucesso!');
            console.log('\n🤖 Assistente CAPEC pronto para uso!');
            console.log('💡 Digite "sair" para encerrar o chat');
            console.log('💡 Digite "ajuda" para ver comandos disponíveis\n');
        }
        catch (error) {
            console.error('❌ Erro ao inicializar:', error);
            console.log('\n💡 Para resolver, execute primeiro:');
            console.log('   npm run process-embeddings');
            process.exit(1);
        }
    }
    async start() {
        await this.initialize();
        this.showHelp();
        this.promptUser();
    }
    showHelp() {
        console.log('📋 COMANDOS DISPONÍVEIS:');
        console.log('  - Digite qualquer pergunta sobre ataques CAPEC');
        console.log('  - "categoria [nome]" - Busca informações sobre uma categoria');
        console.log('  - "ataque [CAPEC-ID]" - Busca informações sobre um ataque específico');
        console.log('  - "ajuda" - Mostra esta ajuda');
        console.log('  - "sair" - Encerra o chat\n');
    }
    promptUser() {
        this.rl.question('👤 Você: ', async (input) => {
            const userInput = input.trim();
            if (userInput.toLowerCase() === 'sair') {
                console.log('👋 Até logo!');
                this.rl.close();
                return;
            }
            if (userInput.toLowerCase() === 'ajuda') {
                this.showHelp();
                this.promptUser();
                return;
            }
            if (userInput.toLowerCase().startsWith('categoria ')) {
                const category = userInput.substring(10);
                await this.handleCategoryQuery(category);
            }
            else if (userInput.toLowerCase().startsWith('ataque ')) {
                const attackId = userInput.substring(7);
                await this.handleAttackQuery(attackId);
            }
            else {
                await this.handleGeneralQuery(userInput);
            }
            this.promptUser();
        });
    }
    async handleGeneralQuery(question) {
        if (!this.isInitialized) {
            console.log('⏳ Sistema ainda inicializando...');
            return;
        }
        console.log('🤖 Processando sua pergunta...');
        try {
            // Gera embedding da pergunta
            const queryEmbedding = await this.embeddingService.generateEmbedding(question);
            // Busca documentos similares
            const relevantDocs = await this.embeddingStore.searchSimilar(queryEmbedding, 3);
            if (relevantDocs.length === 0) {
                console.log('\n🤖 Assistente: Desculpe, não encontrei informações relevantes sobre sua pergunta na base de conhecimento CAPEC.\n');
                return;
            }
            // Constrói o contexto
            const context = this.buildContext(relevantDocs);
            const prompt = this.createPrompt(question, context);
            // Gera resposta
            const response = await this.llm.invoke(prompt);
            console.log(`\n🤖 Assistente: ${response}\n`);
        }
        catch (error) {
            console.error('Erro ao processar pergunta:', error);
            console.log('\n🤖 Assistente: Desculpe, ocorreu um erro ao processar sua pergunta. Tente novamente.\n');
        }
    }
    async handleCategoryQuery(category) {
        if (!this.isInitialized) {
            console.log('⏳ Sistema ainda inicializando...');
            return;
        }
        console.log(`🔍 Buscando informações sobre a categoria: ${category}`);
        try {
            const docs = await this.embeddingStore.searchByCategory(category, 5);
            if (docs.length === 0) {
                console.log(`\n🤖 Assistente: Não encontrei informações sobre a categoria "${category}" na base de conhecimento.\n`);
                return;
            }
            const context = this.buildContext(docs);
            const prompt = this.createCategoryPrompt(category, context);
            const response = await this.llm.invoke(prompt);
            console.log(`\n🤖 Assistente: ${response}\n`);
        }
        catch (error) {
            console.error('Erro ao buscar informações da categoria:', error);
            console.log('\n🤖 Assistente: Desculpe, ocorreu um erro ao buscar informações sobre esta categoria.\n');
        }
    }
    async handleAttackQuery(attackId) {
        if (!this.isInitialized) {
            console.log('⏳ Sistema ainda inicializando...');
            return;
        }
        console.log(`🔍 Buscando informações sobre o ataque: ${attackId}`);
        try {
            const docs = await this.embeddingStore.searchByAttack(attackId);
            if (docs.length === 0) {
                console.log(`\n🤖 Assistente: Não encontrei informações sobre o ataque "${attackId}" na base de conhecimento.\n`);
                return;
            }
            const context = this.buildContext(docs);
            const prompt = this.createAttackPrompt(attackId, context);
            const response = await this.llm.invoke(prompt);
            console.log(`\n🤖 Assistente: ${response}\n`);
        }
        catch (error) {
            console.error('Erro ao buscar informações do ataque:', error);
            console.log('\n🤖 Assistente: Desculpe, ocorreu um erro ao buscar informações sobre este ataque.\n');
        }
    }
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
    createCategoryPrompt(category, context) {
        return `
Você é um especialista em segurança da informação. Forneça informações detalhadas sobre a categoria de ataques "${category}" baseado nas informações abaixo:

${context}

Responda em português brasileiro, explicando:
1. O que é esta categoria de ataques
2. Quais são os principais tipos de ataques incluídos
3. Como os atacantes podem usar estas técnicas
4. Medidas de proteção recomendadas
    `.trim();
    }
    createAttackPrompt(attackId, context) {
        return `
Você é um especialista em segurança da informação. Forneça informações detalhadas sobre o ataque "${attackId}" baseado nas informações abaixo:

${context}

Responda em português brasileiro, explicando:
1. O que é este ataque
2. Como funciona
3. Quais são os vetores de ataque
4. Como detectar e prevenir este tipo de ataque
5. Impacto potencial na segurança
    `.trim();
    }
}
// Executa o chat se chamado diretamente
if (require.main === module) {
    const chat = new OptimizedChatInterface();
    chat.start().catch(error => {
        console.error('❌ Erro ao inicializar o chat:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=optimizedChat.js.map