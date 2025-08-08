"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const chatService_1 = require("./services/chatService");
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
async function main() {
    console.log('🔐 Sistema RAG CAPEC - Assistente de Segurança da Informação');
    console.log('='.repeat(60));
    try {
        const chatService = new chatService_1.ChatService();
        await chatService.initialize();
        console.log('✅ Sistema inicializado com sucesso!');
        console.log('\n📋 Exemplos de perguntas que você pode fazer:');
        console.log('  - "O que é Information Disclosure?"');
        console.log('  - "Explique sobre ataques de interceptação"');
        console.log('  - "Como funcionam ataques de sniffing?"');
        console.log('  - "Quais são os ataques CAPEC-129?"');
        console.log('  - "Me fale sobre ataques de eavesdropping"');
        console.log('\n🚀 Para usar o chat interativo, execute:');
        console.log('   npm run chat');
        console.log('\n📊 Para recriar a base de conhecimento, execute:');
        console.log('   npm run create-embeddings');
    }
    catch (error) {
        console.error('❌ Erro ao inicializar o sistema:', error);
        process.exit(1);
    }
}
// Executa o programa principal
if (require.main === module) {
    main();
}
//# sourceMappingURL=index.js.map