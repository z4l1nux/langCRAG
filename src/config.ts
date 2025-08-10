import { config as loadEnv } from 'dotenv';
import * as path from 'path';

loadEnv();

export const OLLAMA_BASE_URL: string = process.env.OLLAMA_BASE_URL || 'http://127.0.0.1:11434';
export const OLLAMA_MODEL: string = process.env.OLLAMA_MODEL || 'gpt-oss:20b';
export const OLLAMA_EMBEDDINGS_MODEL: string = process.env.OLLAMA_EMBEDDINGS_MODEL || 'nomic-embed-text:latest';
export const LANCEDB_DIR: string = process.env.LANCEDB_DIR || path.join(__dirname, '..', 'lancedb');
export const LANCEDB_BATCH_SIZE: number = Number(process.env.LANCEDB_BATCH_SIZE || 100);


