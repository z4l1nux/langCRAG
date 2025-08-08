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
const threatAnalysisService_1 = require("./services/threatAnalysisService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
class ThreatAnalysisChat {
    constructor() {
        this.threatService = new threatAnalysisService_1.ThreatAnalysisService();
        this.rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
    }
    async start() {
        console.log('🔐 Sistema de Análise de Ameaças CAPEC');
        console.log('='.repeat(50));
        console.log('💡 Digite a descrição completa do sistema para análise');
        console.log('💡 Digite "sair" para encerrar');
        console.log('💡 Digite "ajuda" para ver comandos disponíveis\n');
        this.promptUser();
    }
    promptUser() {
        this.rl.question('👤 Descreva o sistema para análise: ', async (input) => {
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
            if (userInput.length < 10) {
                console.log('❌ Por favor, forneça uma descrição mais detalhada do sistema.\n');
                this.promptUser();
                return;
            }
            await this.analyzeSystem(userInput);
            this.promptUser();
        });
    }
    showHelp() {
        console.log('\n📋 COMANDOS DISPONÍVEIS:');
        console.log('  - Digite a descrição completa do sistema');
        console.log('  - "ajuda" - Mostra esta ajuda');
        console.log('  - "sair" - Encerra o chat\n');
        console.log('💡 Exemplo de descrição:');
        console.log('   "Sistema web de e-commerce com API REST, banco PostgreSQL,');
        console.log('    autenticação JWT, frontend React, pagamentos via gateway,');
        console.log('    upload de arquivos, notificações por email..."\n');
    }
    async analyzeSystem(systemDescription) {
        try {
            console.log('\n🔍 Iniciando análise de ameaças...');
            console.log('📊 Identificando componentes do sistema...');
            const report = await this.threatService.analyzeThreats(systemDescription);
            console.log('✅ Análise concluída!');
            console.log(`📈 Componentes analisados: ${report.components.length}`);
            // Gera relatório em tabela
            const tableReport = this.threatService.generateTableReport(report);
            // Salva o relatório em arquivo
            const reportPath = path.join(__dirname, '..', `threat-report-${Date.now()}.md`);
            fs.writeFileSync(reportPath, tableReport);
            // Exibe o relatório
            console.log('\n' + '='.repeat(80));
            console.log('📋 RELATÓRIO DE ANÁLISE DE AMEAÇAS');
            console.log('='.repeat(80));
            console.log(tableReport);
            console.log('\n' + '='.repeat(80));
            console.log(`📁 Relatório salvo em: ${reportPath}`);
            console.log('='.repeat(80) + '\n');
        }
        catch (error) {
            console.error('❌ Erro durante a análise:', error);
            console.log('💡 Verifique se os embeddings foram processados: npm run process-embeddings\n');
        }
    }
}
// Executa o chat se chamado diretamente
if (require.main === module) {
    const chat = new ThreatAnalysisChat();
    chat.start().catch(error => {
        console.error('❌ Erro ao inicializar o chat:', error);
        process.exit(1);
    });
}
//# sourceMappingURL=threatAnalysisChat.js.map