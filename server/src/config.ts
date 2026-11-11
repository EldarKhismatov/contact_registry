import path from 'node:path';
import { fileURLToPath } from 'node:url';

const currentDir = path.dirname(fileURLToPath(import.meta.url));
const serverRoot = path.resolve(currentDir, '..');

export type StorageKind = 'json' | 'memory';

export interface AppConfig {
  port: number;
  storage: StorageKind;
  /** Файл с данными (используется при storage = json). */
  dataFile: string;
  /** Origins, которым разрешён доступ к API. */
  allowedOrigins: string[];
}

function parseStorage(value: string | undefined): StorageKind {
  return value === 'memory' ? 'memory' : 'json';
}

export const config: AppConfig = {
  port: Number(process.env.PORT ?? 3000),
  storage: parseStorage(process.env.STORAGE),
  dataFile: process.env.DATA_FILE ?? path.join(serverRoot, 'data', 'contacts.json'),
  allowedOrigins: (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173,http://127.0.0.1:5173').split(
    ',',
  ),
};
