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
const simpleChatService_1 = require("./services/simpleChatService");
const documentProcessor_1 = require("./utils/documentProcessor");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
class SimpleChatInterface {
    constructor() {
        this.isInitialized = false;
        this.chatService = new simpleChatService_1.SimpleChatService();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    async initialize() {
        console.log('🔐 Inicializando sistema RAG CAPEC com Ollama...');
        try {
            // Carrega e processa os dados CAPEC
            console.log('📖 Carregando dados CAPEC...');
            const jsonPath = path.join(__dirname, '..', 'capec-stride-mapping.json');
            const jsonContent = fs.readFileSync(jsonPath, 'utf-8');
            const capecData = JSON.parse(jsonContent);
            const processor = new documentProcessor_1.DocumentProcessor();
            const chunks = processor.processCAPECData(capecData);
            console.log(`📊 Processados ${chunks.length} chunks`);
            // Inicializa o serviço
            await this.chatService.initialize();
            // Adiciona chunks em lotes menores para evitar timeout
            const batchSize = 10;
            for (let i = 0; i < chunks.length; i += batchSize) {
                const batch = chunks.slice(i, i + batchSize);
                await this.chatService.addChunks(batch);
                console.log(`✅ Processado lote ${Math.floor(i / batchSize) + 1}/${Math.ceil(chunks.length / batchSize)}`);
            }
            this.isInitialized = true;
            console.log('✅ Sistema inicializado com sucesso!');
            console.log('\n🤖 Assistente CAPEC pronto para uso!');
            console.log('💡 Digite "sair" para encerrar o chat');
            console.log('💡 Digite "ajuda" para ver comandos disponíveis\n');
        }
        catch (error) {
            console.error('❌ Erro ao inicializar:', error);
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
        const response = await this.chatService.processQuestion(question);
        console.log(`\n🤖 Assistente: ${response}\n`);
    }
    async handleCategoryQuery(category) {
        if (!this.isInitialized) {
            console.log('⏳ Sistema ainda inicializando...');
            return;
        }
        console.log(`🔍 Buscando informações sobre a categoria: ${category}`);
        const response = await this.chatService.getCategoryInfo(category);
        console.log(`\n🤖 Assistente: ${response}\n`);
    }
    async handleAttackQuery(attackId) {
        if (!this.isInitialized) {
            console.log('⏳ Sistema ainda inicializando...');
            return;
        }
        console.log(`🔍 Buscando informações sobre o ataque: ${attackId}`);
        const response = await this.chatService.getAttackInfo(attackId);
        console.log(`\n🤖 Assistente: ${response}\n`);
    }
}
// Executa o chat se chamado diretamente
if (require.main === module) {
    const chat = new SimpleChatInterface();
    chat.start().catch(error => {
        console.error('❌ Erro ao inicializar o chat:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=simpleChat.js.map