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
exports.askQuestion = askQuestion;
exports.processQuestion = processQuestion;
const dotenv_1 = require("dotenv");
const chroma_1 = require("@langchain/community/vectorstores/chroma");
const ollama_1 = require("@langchain/community/embeddings/ollama");
const prompts_1 = require("@langchain/core/prompts");
const ollama_2 = require("@langchain/community/llms/ollama");
const readline = __importStar(require("readline"));
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
const DB_PATH = "db";
const promptTemplate = `
Responda a pergunta do usuário:
{pergunta} 

com base nessas informações abaixo:

{base_conhecimento}`;
async function askQuestion() {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    try {
        console.log('🔐 Chat CAPEC - Sistema de Perguntas e Respostas');
        console.log('='.repeat(50));
        console.log('💡 Digite "sair" para encerrar\n');
        while (true) {
            const pergunta = await new Promise((resolve) => {
                rl.question('Escreva sua pergunta: ', resolve);
            });
            if (pergunta.toLowerCase() === 'sair') {
                console.log('👋 Até logo!');
                break;
            }
            await processQuestion(pergunta);
            console.log('\n' + '-'.repeat(50) + '\n');
        }
    }
    catch (error) {
        console.error('❌ Erro:', error);
    }
    finally {
        rl.close();
    }
}
async function processQuestion(pergunta) {
    try {
        console.log('🔍 Buscando informações relevantes...');
        // Carrega o banco de dados
        const embeddingFunction = new ollama_1.OllamaEmbeddings({
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'mistral:latest'
        });
        const db = await chroma_1.Chroma.fromExistingCollection(embeddingFunction, {
            collectionName: 'capec_attacks'
        });
        // Compara a pergunta do usuário com o banco de dados
        const resultados = await db.similaritySearchWithScore(pergunta, 4);
        if (resultados.length === 0 || resultados[0][1] > 0.7) {
            console.log("❌ Não conseguiu encontrar alguma informação relevante na base");
            return;
        }
        const textosResultado = resultados.map(resultado => resultado[0].pageContent);
        const baseConhecimento = textosResultado.join("\n\n----\n\n");
        // Cria o prompt
        const prompt = prompts_1.ChatPromptTemplate.fromTemplate(promptTemplate);
        const formattedPrompt = await prompt.format({
            pergunta: pergunta,
            base_conhecimento: baseConhecimento
        });
        // Gera a resposta
        const modelo = new ollama_2.Ollama({
            baseUrl: process.env.OLLAMA_BASE_URL || 'http://localhost:11434',
            model: process.env.OLLAMA_MODEL || 'mistral:latest'
        });
        const resposta = await modelo.invoke(formattedPrompt);
        console.log("🤖 Resposta da IA:", resposta);
    }
    catch (error) {
        console.error('❌ Erro ao processar pergunta:', error);
        console.log('💡 Verifique se o banco de dados foi criado: npm run create-db');
    }
}
// Executa se chamado diretamente
if (require.main === module) {
    askQuestion();
}
//# sourceMappingURL=chat.js.map