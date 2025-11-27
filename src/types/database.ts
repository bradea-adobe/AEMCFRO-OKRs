// Database-related types

import initSqlJs, { Database } from 'sql.js';

export type SqlJs = Awaited<ReturnType<typeof initSqlJs>>;

export interface DatabaseContextValue {
  db: Database | null;
  isInitialized: boolean;
  error: string | null;
  saveToIndexedDB: () => Promise<void>;
}

export interface ExportData {
  version: string;
  exported_at: string;
  data: {
    objectives: unknown[];
    key_results: unknown[];
    monthly_data: unknown[];
    objective_comments: unknown[];
  };
}

