export interface ThreatReport {
    components: ThreatComponent[];
    summary: string;
    timestamp: string;
}
export interface ThreatComponent {
    component: string;
    stride: string[];
    threat: string;
    capec: string[];
    threatScenario: string;
    mitigationRecommendation: string;
    owaspTop10: string[];
}
export declare class ThreatAnalysisService {
    private llm;
    private embeddingService;
    private embeddingStore;
    constructor();
    /**
     * Analisa ameaças baseado na descrição do sistema
     */
    analyzeThreats(systemDescription: string): Promise<ThreatReport>;
    /**
     * Identifica componentes do sistema
     */
    private identifyComponents;
    /**
     * Analisa ameaças para um componente específico
     */
    private analyzeComponentThreats;
    /**
     * Gera resumo executivo
     */
    private generateExecutiveSummary;
    /**
     * Gera relatório em formato de tabela
     */
    generateTableReport(report: ThreatReport): string;
}
//# sourceMappingURL=threatAnalysisService.d.ts.map