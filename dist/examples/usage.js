"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.demonstrateUsage = demonstrateUsage;
const dotenv_1 = require("dotenv");
const chatService_1 = require("../services/chatService");
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
async function demonstrateUsage() {
    console.log('🔐 Demonstração do Sistema RAG CAPEC');
    console.log('='.repeat(50));
    try {
        const chatService = new chatService_1.ChatService();
        await chatService.initialize();
        console.log('✅ Sistema inicializado!\n');
        // Exemplo 1: Pergunta geral
        console.log('📝 Exemplo 1: Pergunta geral sobre ataques');
        const question1 = "O que são ataques de Information Disclosure?";
        console.log(`Pergunta: ${question1}`);
        const response1 = await chatService.processQuestion(question1);
        console.log(`Resposta: ${response1}\n`);
        // Exemplo 2: Busca por categoria
        console.log('📝 Exemplo 2: Busca por categoria específica');
        const category = "Interception";
        console.log(`Categoria: ${category}`);
        const response2 = await chatService.getCategoryInfo(category);
        console.log(`Resposta: ${response2}\n`);
        // Exemplo 3: Busca por ataque específico
        console.log('📝 Exemplo 3: Busca por ataque específico');
        const attackId = "CAPEC-129";
        console.log(`Ataque: ${attackId}`);
        const response3 = await chatService.getAttackInfo(attackId);
        console.log(`Resposta: ${response3}\n`);
        console.log('✅ Demonstração concluída!');
    }
    catch (error) {
        console.error('❌ Erro durante a demonstração:', error);
    }
}
// Executa a demonstração se chamado diretamente
if (require.main === module) {
    demonstrateUsage();
}
//# sourceMappingURL=usage.js.map