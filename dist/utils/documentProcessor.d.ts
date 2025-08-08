import { CAPECMapping, DocumentChunk } from '../types';
export declare class DocumentProcessor {
    private chunks;
    /**
     * Processa o arquivo JSON do CAPEC e extrai chunks de texto
     */
    processCAPECData(data: CAPECMapping): DocumentChunk[];
    /**
     * Processa recursivamente os nós da árvore CAPEC
     */
    private processNode;
    /**
     * Gera conteúdo descritivo para um ataque CAPEC
     */
    private generateCAPECContent;
    /**
     * Gera conteúdo descritivo para uma categoria
     */
    private generateCategoryContent;
    /**
     * Retorna estatísticas sobre os chunks processados
     */
    getStats(): {
        totalChunks: number;
        categories: number;
        attacks: number;
    };
}
//# sourceMappingURL=documentProcessor.d.ts.map