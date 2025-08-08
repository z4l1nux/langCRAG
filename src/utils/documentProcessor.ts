import { CAPECMapping, DocumentChunk } from '../types';

export class DocumentProcessor {
  private chunks: DocumentChunk[] = [];

  /**
   * Processa o arquivo JSON do CAPEC e extrai chunks de texto
   */
  processCAPECData(data: CAPECMapping): DocumentChunk[] {
    this.chunks = [];
    const root = data["CAPEC S.T.R.I.D.E. Mapping"];
    
    this.processNode(root.children, "CAPEC S.T.R.I.D.E. Mapping", 0);
    
    return this.chunks;
  }

  /**
   * Processa recursivamente os nós da árvore CAPEC
   */
  private processNode(
    children: Record<string, any>, 
    category: string, 
    level: number
  ): void {
    for (const [key, node] of Object.entries(children)) {
      const isCAPEC = key.includes('CAPEC-');
      
      if (isCAPEC) {
        // É um ataque CAPEC específico
        const content = this.generateCAPECContent(key, node, category);
        const chunk: DocumentChunk = {
          id: key,
          content,
          metadata: {
            category,
            attack: key,
            link: node.link || '',
            level
          }
        };
        this.chunks.push(chunk);
      } else {
        // É uma categoria
        const content = this.generateCategoryContent(key, node);
        const chunk: DocumentChunk = {
          id: key,
          content,
          metadata: {
            category: key,
            attack: '',
            link: node.link || '',
            level
          }
        };
        this.chunks.push(chunk);
      }

      // Processa recursivamente os filhos
      if (node.children && Object.keys(node.children).length > 0) {
        this.processNode(node.children, key, level + 1);
      }
    }
  }

  /**
   * Gera conteúdo descritivo para um ataque CAPEC
   */
  private generateCAPECContent(attackName: string, node: any, category: string): string {
    const attackId = attackName.split(':')[0];
    const attackDescription = attackName.split(':')[1] || attackName;
    
    return `
ATAQUE CAPEC: ${attackId}
DESCRIÇÃO: ${attackDescription}
CATEGORIA: ${category}
LINK: ${node.link || 'N/A'}

Este é um ataque de segurança documentado no CAPEC (Common Attack Pattern Enumeration and Classification).
O ataque ${attackDescription} pertence à categoria ${category} e pode ser usado por atacantes para comprometer sistemas de informação.

Para mais informações técnicas sobre este ataque, consulte: ${node.link || 'N/A'}
    `.trim();
  }

  /**
   * Gera conteúdo descritivo para uma categoria
   */
  private generateCategoryContent(categoryName: string, node: any): string {
    return `
CATEGORIA DE ATAQUE: ${categoryName}
LINK: ${node.link || 'N/A'}

Esta categoria contém diversos ataques relacionados a ${categoryName.toLowerCase()}.
Os ataques nesta categoria compartilham características similares e podem ser usados em conjunto ou isoladamente.

Para mais informações sobre esta categoria de ataques, consulte: ${node.link || 'N/A'}
    `.trim();
  }

  /**
   * Retorna estatísticas sobre os chunks processados
   */
  getStats(): { totalChunks: number; categories: number; attacks: number } {
    const categories = this.chunks.filter(chunk => !chunk.metadata.attack.includes('CAPEC-')).length;
    const attacks = this.chunks.filter(chunk => chunk.metadata.attack.includes('CAPEC-')).length;
    
    return {
      totalChunks: this.chunks.length,
      categories,
      attacks
    };
  }
} 