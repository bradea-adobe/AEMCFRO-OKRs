// FR-007: Database Context - Provides database instance to all components

import React, { createContext, useContext, useEffect, useState } from 'react';
import { Database } from 'sql.js';
import { initDB, saveDBToIndexedDB } from '@/lib/database';
import { DatabaseContextValue } from '@/types/database';

const DatabaseContext = createContext<DatabaseContextValue | undefined>(
  undefined
);

export const DatabaseProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [db, setDb] = useState<Database | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const initialize = async () => {
      console.log('🚀 Starting DatabaseContext initialization...');
      try {
        const database = await initDB();
        console.log('✅ Database ready, updating context...');
        setDb(database);
        setIsInitialized(true);
        console.log('✅ DatabaseContext initialized successfully');

        // Set up periodic auto-backup every 5 minutes
        const intervalId = setInterval(async () => {
          if (database) {
            try {
              await saveDBToIndexedDB(database);
              console.log('Auto-backup completed');
            } catch (err) {
              console.error('Auto-backup failed:', err);
            }
          }
        }, 5 * 60 * 1000); // 5 minutes

        return () => clearInterval(intervalId);
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to initialize database';
        setError(message);
        console.error('Database initialization error:', err);
      }
    };

    initialize();
  }, []);

  const saveToIndexedDB = async () => {
    if (!db) {
      throw new Error('Database not initialized');
    }
    await saveDBToIndexedDB(db);
  };

  const value: DatabaseContextValue = {
    db,
    isInitialized,
    error,
    saveToIndexedDB,
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-red-50">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md">
          <h2 className="text-2xl font-bold text-red-600 mb-4">
            Database Error
          </h2>
          <p className="text-gray-700 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="w-full bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
          >
            Reload Page
          </button>
        </div>
      </div>
    );
  }

  if (!isInitialized) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-lg">Loading OKR Tracker...</p>
        </div>
      </div>
    );
  }

  return (
    <DatabaseContext.Provider value={value}>
      {children}
    </DatabaseContext.Provider>
  );
};

export const useDatabase = (): DatabaseContextValue => {
  const context = useContext(DatabaseContext);
  if (!context) {
    throw new Error('useDatabase must be used within DatabaseProvider');
  }
  return context;
};

