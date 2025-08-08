"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = require("dotenv");
const ollamaService_1 = require("./services/ollamaService");
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
async function testOllama() {
    console.log('🔍 Testando conexão com Ollama...');
    try {
        const ollamaService = new ollamaService_1.OllamaService();
        // Testa a conexão
        console.log('📡 Testando conexão...');
        const isConnected = await ollamaService.testConnection();
        if (isConnected) {
            console.log('✅ Conexão com Ollama estabelecida com sucesso!');
            // Testa geração de resposta
            console.log('🤖 Testando geração de resposta...');
            const response = await ollamaService.generateResponse('Olá! Como você está?');
            console.log(`Resposta: ${response}`);
            // Testa geração de embedding
            console.log('🔢 Testando geração de embedding...');
            const embedding = await ollamaService.generateEmbedding('Teste de embedding');
            console.log(`Embedding gerado com ${embedding.length} dimensões`);
            console.log('✅ Todos os testes passaram!');
        }
        else {
            console.log('❌ Falha na conexão com Ollama');
            console.log('Verifique se:');
            console.log('1. O Ollama está rodando');
            console.log('2. A URL está correta no arquivo .env');
            console.log('3. O modelo mistral está disponível');
        }
    }
    catch (error) {
        console.error('❌ Erro durante o teste:', error);
    }
}
// Executa o teste se chamado diretamente
if (require.main === module) {
    testOllama();
}
//# sourceMappingURL=testOllama.js.map