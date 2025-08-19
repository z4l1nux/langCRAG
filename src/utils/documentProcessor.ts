import { CAPECMapping, DocumentChunk } from '../types';
import { parse as csvParse } from 'csv-parse/sync';
import * as mammoth from 'mammoth';
import pdfParse from 'pdf-parse';
import * as xml2js from 'xml2js';

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

  async processFile(fileContent: Buffer, extension: string): Promise<DocumentChunk[]> {
    switch (extension) {
      case '.json':
        return this.processCAPECData(JSON.parse(fileContent.toString('utf-8')));
      case '.csv':
        return this.processCSV(fileContent.toString('utf-8'));
      case '.md':
        return this.processMD(fileContent.toString('utf-8'));
      case '.xml':
        return await this.processXML(fileContent.toString('utf-8'));
      case '.docx':
        return await this.processDOCX(fileContent);
      case '.pdf':
        return await this.processPDF(fileContent);
      default:
        console.warn(`⚠️ Extensão de arquivo não suportada: ${extension}`);
        return [];
    }
  }

  private processCSV(content: string): DocumentChunk[] {
    const records = csvParse(content, { columns: true });
    return records.map((record: any, index: number) => ({
      id: `csv-${index}`,
      content: JSON.stringify(record),
      metadata: { filetype: '.csv', category: '', attack: '', level: 0 }
    }));
  }

  private processMD(content: string): DocumentChunk[] {
    const chunks: DocumentChunk[] = [];
    
    // Process the CAPEC markdown structure properly
    // First extract the main title
    const titleMatch = content.match(/^# \[([^\]]+)\]/);
    const mainTitle = titleMatch ? titleMatch[1] : 'CAPEC S.T.R.I.D.E. Mapping';
    
    // Extract all categories (##) and their content
    const categoryRegex = /^## ([^\n]+)\n([\s\S]*?)(?=^## |\Z)/gm;
    let categoryMatch: RegExpExecArray | null;
    
    while ((categoryMatch = categoryRegex.exec(content)) !== null) {
      const categoryName = categoryMatch[1].trim();
      const categoryContent = categoryMatch[2].trim();
      
      // Create a chunk for the category
      chunks.push({
        id: `md-category-${categoryName.toLowerCase().replace(/\s+/g, '-')}`,
        content: `CATEGORIA: ${categoryName}\n\n${categoryContent}`,
        metadata: { 
          filetype: '.md', 
          category: categoryName, 
          attack: '', 
          level: 1 
        }
      });
      
      // Extract CAPEC attacks from this category
      const capecRegex = /^###?\s+\[([^\]]+)\]\(([^)]+)\)/gm;
      let capecMatch: RegExpExecArray | null;
      
      while ((capecMatch = capecRegex.exec(categoryContent)) !== null) {
        const attackTitle = capecMatch[1].trim();
        const attackLink = capecMatch[2].trim();
        
        // Create a chunk for each CAPEC attack
        chunks.push({
          id: `md-${attackTitle.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')}`,
          content: `ATAQUE: ${attackTitle}\nCATEGORIA: ${categoryName}\nLINK: ${attackLink}\n\nEste é um ataque de segurança documentado no CAPEC (Common Attack Pattern Enumeration and Classification).`,
          metadata: { 
            filetype: '.md', 
            category: categoryName, 
            attack: attackTitle, 
            link: attackLink,
            level: 2 
          }
        });
      }
    }
    
    // If no categories found, return the entire content as one chunk
    if (chunks.length === 0) {
      chunks.push({
        id: 'md-main',
        content: content,
        metadata: { filetype: '.md', category: mainTitle, attack: '', level: 0 }
      });
    }
    
    return chunks;
  }

  private async processXML(content: string): Promise<DocumentChunk[]> {
    const parser = new xml2js.Parser();
    const result = await parser.parseStringPromise(content);
    return [{
      id: 'xml-1',
      content: JSON.stringify(result),
      metadata: { filetype: '.xml', category: '', attack: '', level: 0 }
    }];
  }

  private async processDOCX(content: Buffer): Promise<DocumentChunk[]> {
    const result = await mammoth.extractRawText({ buffer: content });
    return [{
      id: 'docx-1',
      content: result.value,
      metadata: { filetype: '.docx', category: '', attack: '', level: 0 }
    }];
  }

  private async processPDF(content: Buffer): Promise<DocumentChunk[]> {
    const result = await pdfParse(content);
    return [{
      id: 'pdf-1',
      content: result.text,
      metadata: { filetype: '.pdf', category: '', attack: '', level: 0 }
    }];
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

        // Se o nó possui uma lista de itens (ex.: markdown com bullets), preserve como campo adicional
        if (typeof (node as any).items === 'string' && (node as any).items.trim().length > 0) {
          const itemsChunk: DocumentChunk = {
            id: `${key}-items`,
            content: (node as any).items,
            metadata: {
              category: key,
              attack: '',
              link: node.link || '',
              level
            }
          };
          this.chunks.push(itemsChunk);
        }
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