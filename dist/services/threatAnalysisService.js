"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.ThreatAnalysisService = void 0;
const ollama_1 = require("@langchain/community/llms/ollama");
const embeddingService_1 = require("./embeddingService");
const embeddingStore_1 = require("./embeddingStore");
class ThreatAnalysisService {
    constructor() {
        const baseUrl = process.env.OLLAMA_BASE_URL || 'http://localhost:11434';
        const model = process.env.OLLAMA_MODEL || 'mistral:latest';
        this.llm = new ollama_1.Ollama({
            baseUrl,
            model,
            temperature: 0.7
        });
        this.embeddingService = new embeddingService_1.EmbeddingService();
        this.embeddingStore = new embeddingStore_1.EmbeddingStore();
    }
    /**
     * Analisa ameaças baseado na descrição do sistema
     */
    async analyzeThreats(systemDescription) {
        try {
            // Carrega embeddings se necessário
            if (!this.embeddingStore.isEmbeddingsLoaded()) {
                await this.embeddingStore.loadEmbeddings();
            }
            // Gera embedding da descrição do sistema
            const systemEmbedding = await this.embeddingService.generateEmbedding(systemDescription);
            // Busca ataques CAPEC relevantes
            const relevantAttacks = await this.embeddingStore.searchSimilar(systemEmbedding, 10);
            // Analisa componentes do sistema
            const components = await this.identifyComponents(systemDescription);
            // Gera análise de ameaças para cada componente
            const threatComponents = [];
            for (const component of components) {
                const threatComponent = await this.analyzeComponentThreats(component, systemDescription, relevantAttacks);
                threatComponents.push(threatComponent);
            }
            // Gera resumo executivo
            const summary = await this.generateExecutiveSummary(threatComponents, systemDescription);
            return {
                components: threatComponents,
                summary,
                timestamp: new Date().toISOString()
            };
        }
        catch (error) {
            console.error('Erro na análise de ameaças:', error);
            throw error;
        }
    }
    /**
     * Identifica componentes do sistema
     */
    async identifyComponents(systemDescription) {
        const prompt = `
Analise a seguinte descrição de sistema e identifique os principais componentes de segurança:

DESCRIÇÃO DO SISTEMA:
${systemDescription}

Identifique os componentes principais que podem ser alvos de ataques, como:
- APIs e endpoints
- Bancos de dados
- Autenticação e autorização
- Armazenamento de dados
- Comunicação entre serviços
- Interface do usuário
- Backend e frontend
- Microserviços
- Gateways e proxies

Responda apenas com uma lista de componentes, um por linha, sem numeração.
    `.trim();
        const response = await this.llm.invoke(prompt);
        const components = response.split('\n').filter(line => line.trim().length > 0);
        return components;
    }
    /**
     * Analisa ameaças para um componente específico
     */
    async analyzeComponentThreats(component, systemDescription, relevantAttacks) {
        const context = relevantAttacks.map(doc => doc.content).join('\n\n');
        const prompt = `
Analise o componente "${component}" do seguinte sistema e identifique ameaças específicas:

DESCRIÇÃO DO SISTEMA:
${systemDescription}

COMPONENTE ANALISADO:
${component}

ATAQUES CAPEC RELEVANTES:
${context}

Para este componente, identifique:

1. STRIDE (Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, Elevation of Privilege)
2. Ameaça específica
3. Códigos CAPEC relevantes
4. Cenário de ameaça detalhado
5. Recomendação de mitigação
6. Mapeamento para OWASP Top 10

Responda em formato JSON:
{
  "stride": ["S", "T", "I"],
  "threat": "Descrição da ameaça",
  "capec": ["CAPEC-123", "CAPEC-456"],
  "threatScenario": "Cenário detalhado",
  "mitigationRecommendation": "Recomendação",
  "owaspTop10": ["A01", "A03"]
}
    `.trim();
        const response = await this.llm.invoke(prompt);
        try {
            const analysis = JSON.parse(response);
            return {
                component,
                stride: analysis.stride || [],
                threat: analysis.threat || '',
                capec: analysis.capec || [],
                threatScenario: analysis.threatScenario || '',
                mitigationRecommendation: analysis.mitigationRecommendation || '',
                owaspTop10: analysis.owaspTop10 || []
            };
        }
        catch (error) {
            // Fallback se o JSON não for válido
            return {
                component,
                stride: ['I', 'T'],
                threat: 'Ameaça genérica identificada',
                capec: ['CAPEC-100'],
                threatScenario: 'Cenário de ameaça para ' + component,
                mitigationRecommendation: 'Implementar controles de segurança',
                owaspTop10: ['A01']
            };
        }
    }
    /**
     * Gera resumo executivo
     */
    async generateExecutiveSummary(threatComponents, systemDescription) {
        const totalThreats = threatComponents.length;
        const totalCAPEC = threatComponents.reduce((sum, comp) => sum + comp.capec.length, 0);
        const strideCounts = threatComponents.reduce((counts, comp) => {
            comp.stride.forEach(s => counts[s] = (counts[s] || 0) + 1);
            return counts;
        }, {});
        const prompt = `
Gere um resumo executivo da análise de ameaças para o seguinte sistema:

DESCRIÇÃO DO SISTEMA:
${systemDescription}

RESULTADOS DA ANÁLISE:
- Componentes analisados: ${totalThreats}
- Total de ataques CAPEC identificados: ${totalCAPEC}
- Distribuição STRIDE: ${Object.entries(strideCounts).map(([k, v]) => `${k}: ${v}`).join(', ')}

COMPONENTES E AMEAÇAS:
${threatComponents.map(comp => `- ${comp.component}: ${comp.threat} (CAPEC: ${comp.capec.join(', ')})`).join('\n')}

Gere um resumo executivo em português brasileiro com:
1. Visão geral dos riscos identificados
2. Principais vulnerabilidades
3. Recomendações prioritárias
4. Nível de risco geral
    `.trim();
        const response = await this.llm.invoke(prompt);
        return response;
    }
    /**
     * Gera relatório em formato de tabela
     */
    generateTableReport(report) {
        let table = `
# Relatório de Análise de Ameaças

**Sistema Analisado:** ${report.timestamp}
**Data da Análise:** ${new Date(report.timestamp).toLocaleDateString('pt-BR')}

## Resumo Executivo

${report.summary}

## Tabela de Ameaças por Componente

| Componente | STRIDE | Ameaça | CAPEC | Cenário de Ameaça | Recomendação de Mitigação | OWASP Top 10 |
|------------|--------|--------|-------|-------------------|---------------------------|---------------|
`;
        report.components.forEach(comp => {
            table += `| ${comp.component} | ${comp.stride.join(', ')} | ${comp.threat} | ${comp.capec.join(', ')} | ${comp.threatScenario} | ${comp.mitigationRecommendation} | ${comp.owaspTop10.join(', ')} |\n`;
        });
        table += `
## Legenda

**STRIDE:**
- S: Spoofing (Falsificação)
- T: Tampering (Manipulação)
- R: Repudiation (Repúdio)
- I: Information Disclosure (Divulgação de Informação)
- D: Denial of Service (Negação de Serviço)
- E: Elevation of Privilege (Elevação de Privilégio)

**OWASP Top 10:**
- A01: Broken Access Control
- A02: Cryptographic Failures
- A03: Injection
- A04: Insecure Design
- A05: Security Misconfiguration
- A06: Vulnerable Components
- A07: Authentication Failures
- A08: Software and Data Integrity Failures
- A09: Security Logging Failures
- A10: Server-Side Request Forgery
`;
        return table;
    }
}
exports.ThreatAnalysisService = ThreatAnalysisService;
//# sourceMappingURL=threatAnalysisService.js.map