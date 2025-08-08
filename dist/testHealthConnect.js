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
const dotenv_1 = require("dotenv");
const threatAnalysisService_1 = require("./services/threatAnalysisService");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
// Carrega as variáveis de ambiente
(0, dotenv_1.config)();
async function testHealthConnectAnalysis() {
    console.log('🔐 Testando Análise de Ameaças - HealthConnect');
    console.log('='.repeat(60));
    const systemDescription = `
HealthConnect

Objetivo: Plataforma de telemedicina para agendamento e realização de consultas online, com gerenciamento de prontuários eletrônicos (PEP) e prescrições digitais.

Componentes Chave:

Frontends: Portal do Paciente (Web/Móvel) e Portal do Médico (Web).
Backends: API Central, serviços de Agendamento, Teleconsulta (WebRTC), PEP e Prescrição Digital.
Dados: Bancos de Dados de perfil de usuário (MongoDB) e Clínico confidencial (PostgreSQL).
Integrações: Gateways de pagamento, SMS/E-mail e serviços de assinatura digital.

Dados Críticos:

Dados Pessoais de Saúde (DPH): Prontuários, histórico médico, resultados de exames e prescrições.
Dados Sensíveis: Informações de identificação do paciente (CPF, nome), credenciais e tokens de pagamento.

Tecnologias e Infraestrutura:

Tecnologias: Vue.js, Flutter, Python, Golang, WebRTC, Kafka.
Infraestrutura: Containers (Docker), Orquestração (Kubernetes) no Azure.
Segurança: TLS 1.3, criptografia de ponta a ponta e assinaturas digitais (X.509).

Fluxos de Usuário:

Paciente: Agenda, participa de consultas e acessa dados de saúde.
Médico: Gerencia agenda, acessa prontuários e emite prescrições.
Administrador: Gerencia usuários e monitora o sistema.
  `.trim();
    try {
        console.log('🚀 Iniciando análise do sistema HealthConnect...');
        const threatService = new threatAnalysisService_1.ThreatAnalysisService();
        console.log('📊 Analisando componentes e ameaças...');
        const report = await threatService.analyzeThreats(systemDescription);
        console.log('✅ Análise concluída!');
        console.log(`📈 Componentes analisados: ${report.components.length}`);
        // Gera relatório em tabela
        const tableReport = threatService.generateTableReport(report);
        // Salva o relatório
        const reportPath = path.join(__dirname, '..', 'healthconnect-threat-report.md');
        fs.writeFileSync(reportPath, tableReport);
        // Exibe o relatório
        console.log('\n' + '='.repeat(80));
        console.log('📋 RELATÓRIO DE ANÁLISE DE AMEAÇAS - HEALTHCONNECT');
        console.log('='.repeat(80));
        console.log(tableReport);
        console.log('\n' + '='.repeat(80));
        console.log(`📁 Relatório salvo em: ${reportPath}`);
        console.log('='.repeat(80));
    }
    catch (error) {
        console.error('❌ Erro durante a análise:', error);
        console.log('💡 Verifique se os embeddings foram processados: npm run process-embeddings');
    }
}
// Executa o teste se chamado diretamente
if (require.main === module) {
    testHealthConnectAnalysis();
}
//# sourceMappingURL=testHealthConnect.js.map