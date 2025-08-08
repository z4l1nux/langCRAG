export interface CAPECNode {
  link: string;
  children: Record<string, CAPECNode>;
}

export interface CAPECMapping {
  "CAPEC S.T.R.I.D.E. Mapping": {
    link: string;
    children: Record<string, CAPECNode>;
  };
}

export interface DocumentChunk {
  id: string;
  content: string;
  metadata: {
    category: string;
    attack: string;
    link?: string;
    level: number;
  };
}

export interface ChatMessage {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export interface SearchResult {
  content: string;
  metadata: {
    category: string;
    attack: string;
    link?: string;
    level: number;
  };
  score: number;
} 