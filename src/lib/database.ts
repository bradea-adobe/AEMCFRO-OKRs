// FR-007: Data Persistence and Loading with sql.js and IndexedDB

// Using any type to avoid TypeScript issues with CDN import
type Database = any;
type SqlJsStatic = any;

const DB_NAME = 'okr_database';
const DB_STORE_NAME = 'sqljs';
const DB_KEY = 'db';

/**
 * Load sql.js from CDN
 */
const loadSqlJs = async (): Promise<SqlJsStatic> => {
  console.log('📦 Loading sql.js from CDN...');
  
  // Load the script dynamically
  const script = document.createElement('script');
  script.src = 'https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/sql-wasm.min.js';
  
  return new Promise((resolve, reject) => {
    script.onload = () => {
      console.log('✅ sql.js script loaded');
      // @ts-ignore - initSqlJs is added to window by the script
      const initSqlJs = window.initSqlJs;
      if (typeof initSqlJs === 'function') {
        console.log('✅ initSqlJs function found on window');
        resolve(initSqlJs);
      } else {
        reject(new Error('initSqlJs not found on window object'));
      }
    };
    script.onerror = () => reject(new Error('Failed to load sql.js script'));
    document.head.appendChild(script);
  });
};

/**
 * Initialize the database with schema
 */
export const initDB = async (): Promise<Database> => {
  try {
    console.log('🔧 Initializing database...');
    
    // Load sql.js from CDN
    const initSqlJs = await loadSqlJs();
    
    console.log('📦 Initializing sql.js WASM...');
    const SQL = await initSqlJs({
      locateFile: (file: string) => {
        console.log('📂 Locating file:', file);
        return `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`;
      },
    });
    console.log('✅ sql.js loaded successfully');

    // Try to load existing database from IndexedDB
    console.log('💾 Checking for existing database in IndexedDB...');
    const savedDb = await loadDBFromIndexedDB();
    let db: Database;

    if (savedDb) {
      console.log('✅ Found existing database, loading...');
      db = new SQL.Database(savedDb);
      // Run migrations on existing database
      console.log('🔄 Checking for schema updates...');
      const needsSave = migrateDatabase(db);
      if (needsSave) {
        console.log('💾 Saving migrated database...');
        await saveDBToIndexedDB(db);
        console.log('✅ Database saved after migration');
      }
    } else {
      console.log('🆕 No existing database, creating new one...');
      db = new SQL.Database();
      createSchema(db);
      console.log('✅ Schema created');
    }

    console.log('🎉 Database initialized successfully');
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
};

/**
 * Create database schema (FR-001)
 * Current schema version: 3
 * - v1: Initial schema
 * - v2: Added inverse_metric column to key_results
 * - v3: Added driver column to objectives
 */
const createSchema = (db: Database): void => {
  // Objectives table
  db.run(`
    CREATE TABLE IF NOT EXISTS objectives (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL CHECK(length(title) <= 200),
      description TEXT,
      driver TEXT NOT NULL,
      created_date TEXT DEFAULT CURRENT_TIMESTAMP,
      modified_date TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Key Results table
  db.run(`
    CREATE TABLE IF NOT EXISTS key_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objective_id INTEGER NOT NULL,
      title TEXT NOT NULL CHECK(length(title) <= 200),
      metric TEXT NOT NULL CHECK(length(metric) <= 100),
      unit TEXT,
      inverse_metric INTEGER DEFAULT 0 CHECK(inverse_metric IN (0, 1)),
      created_date TEXT DEFAULT CURRENT_TIMESTAMP,
      modified_date TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE
    )
  `);

  // Monthly Data table
  db.run(`
    CREATE TABLE IF NOT EXISTS monthly_data (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      key_result_id INTEGER NOT NULL,
      month TEXT NOT NULL CHECK(length(month) = 7),
      target REAL NOT NULL DEFAULT 0 CHECK(target >= 0),
      actual REAL NOT NULL DEFAULT 0 CHECK(actual >= 0),
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (key_result_id) REFERENCES key_results(id) ON DELETE CASCADE,
      UNIQUE(key_result_id, month)
    )
  `);

  // Objective Comments table
  db.run(`
    CREATE TABLE IF NOT EXISTS objective_comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      objective_id INTEGER NOT NULL,
      month TEXT NOT NULL CHECK(length(month) = 7),
      comment TEXT CHECK(length(comment) <= 2000),
      last_updated TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (objective_id) REFERENCES objectives(id) ON DELETE CASCADE,
      UNIQUE(objective_id, month)
    )
  `);

  // Schema version tracking
  db.run(`
    CREATE TABLE IF NOT EXISTS schema_version (
      version INTEGER PRIMARY KEY,
      applied_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.run(`INSERT OR IGNORE INTO schema_version (version) VALUES (1)`);
  
  // Run migrations (on new database, this will complete version 2 setup)
  migrateDatabase(db);
};

/**
 * Run database migrations
 * @returns true if migrations were applied, false if already up to date
 */
const migrateDatabase = (db: Database): boolean => {
  try {
    let migrationApplied = false;
    
    // Ensure schema_version table exists
    db.run(`
      CREATE TABLE IF NOT EXISTS schema_version (
        version INTEGER PRIMARY KEY,
        applied_at TEXT DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // Check current schema version
    const result = db.exec('SELECT MAX(version) as version FROM schema_version');
    const currentVersion = result[0]?.values[0]?.[0] || 0;
    
    console.log(`📊 Current schema version: ${currentVersion}`);
    
    // Migration to version 1: Initial schema (mark as completed if tables exist)
    if (currentVersion < 1) {
      const tables = db.exec("SELECT name FROM sqlite_master WHERE type='table' AND name='objectives'");
      if (tables.length > 0) {
        db.run(`INSERT OR IGNORE INTO schema_version (version) VALUES (1)`);
        console.log('✅ Marked initial schema as version 1');
        migrationApplied = true;
      }
    }
    
    // Migration to version 2: Add inverse_metric column
    if (currentVersion < 2) {
      console.log('📦 Running migration to version 2: Adding inverse_metric column...');
      
      // Check if column exists (for safety)
      const tableInfo = db.exec("PRAGMA table_info(key_results)");
      const columns = tableInfo[0]?.values.map((row: any) => row[1]) || [];
      
      if (!columns.includes('inverse_metric')) {
        db.run(`
          ALTER TABLE key_results 
          ADD COLUMN inverse_metric INTEGER DEFAULT 0 CHECK(inverse_metric IN (0, 1))
        `);
        console.log('✅ Added inverse_metric column');
        migrationApplied = true;
      } else {
        console.log('ℹ️ inverse_metric column already exists');
      }
      
      db.run(`INSERT INTO schema_version (version) VALUES (2)`);
      console.log('✅ Migration to version 2 complete');
      migrationApplied = true;
    }
    
    // Migration to version 3: Add driver column to objectives
    if (currentVersion < 3) {
      console.log('📦 Running migration to version 3: Adding driver column...');
      
      // Check if column exists (for safety)
      const tableInfo = db.exec("PRAGMA table_info(objectives)");
      const columns = tableInfo[0]?.values.map((row: any) => row[1]) || [];
      
      if (!columns.includes('driver')) {
        db.run(`
          ALTER TABLE objectives 
          ADD COLUMN driver TEXT NOT NULL DEFAULT ''
        `);
        console.log('✅ Added driver column');
        migrationApplied = true;
      } else {
        console.log('ℹ️ driver column already exists');
      }
      
      db.run(`INSERT INTO schema_version (version) VALUES (3)`);
      console.log('✅ Migration to version 3 complete');
      migrationApplied = true;
    }
    
    if (!migrationApplied) {
      console.log('✅ Database is up to date (version 3)');
    }
    
    return migrationApplied;
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
};

/**
 * Save database to IndexedDB (FR-007)
 */
export const saveDBToIndexedDB = async (db: Database): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const dbHandle = request.result;
      const transaction = dbHandle.transaction([DB_STORE_NAME], 'readwrite');
      const store = transaction.objectStore(DB_STORE_NAME);

      // Export database as Uint8Array
      const data = db.export();
      store.put(data, DB_KEY);

      transaction.oncomplete = () => {
        dbHandle.close();
        resolve();
      };
      transaction.onerror = () => reject(transaction.error);
    };

    request.onupgradeneeded = () => {
      const dbHandle = request.result;
      if (!dbHandle.objectStoreNames.contains(DB_STORE_NAME)) {
        dbHandle.createObjectStore(DB_STORE_NAME);
      }
    };
  });
};

/**
 * Load database from IndexedDB (FR-007)
 */
export const loadDBFromIndexedDB = async (): Promise<Uint8Array | null> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const dbHandle = request.result;

      if (!dbHandle.objectStoreNames.contains(DB_STORE_NAME)) {
        dbHandle.close();
        resolve(null);
        return;
      }

      const transaction = dbHandle.transaction([DB_STORE_NAME], 'readonly');
      const store = transaction.objectStore(DB_STORE_NAME);
      const getRequest = store.get(DB_KEY);

      getRequest.onsuccess = () => {
        dbHandle.close();
        resolve(getRequest.result || null);
      };
      getRequest.onerror = () => {
        dbHandle.close();
        reject(getRequest.error);
      };
    };

    request.onupgradeneeded = () => {
      const dbHandle = request.result;
      if (!dbHandle.objectStoreNames.contains(DB_STORE_NAME)) {
        dbHandle.createObjectStore(DB_STORE_NAME);
      }
    };
  });
};

/**
 * Clear all data from IndexedDB
 */
export const clearIndexedDB = async (): Promise<void> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.deleteDatabase(DB_NAME);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
};

/**
 * Export database to a downloadable file
 */
export const exportDatabase = (db: Database, filename: string = 'okr-database.db'): void => {
  try {
    // Export database as Uint8Array
    const data = db.export();
    
    // Create a blob from the data
    const blob = new Blob([data], { type: 'application/x-sqlite3' });
    
    // Create download link
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    
    // Trigger download
    document.body.appendChild(link);
    link.click();
    
    // Cleanup
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    
    console.log('✅ Database exported successfully');
  } catch (error) {
    console.error('❌ Database export failed:', error);
    throw error;
  }
};

/**
 * Import database from a file
 */
export const importDatabase = async (file: File): Promise<Database> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = async () => {
      try {
        console.log('📥 Loading database from file...');
        
        // Load sql.js
        const initSqlJs = await loadSqlJs();
        const SQL = await initSqlJs({
          locateFile: (file: string) => {
            return `https://cdnjs.cloudflare.com/ajax/libs/sql.js/1.10.3/${file}`;
          },
        });
        
        // Create database from imported data
        const data = new Uint8Array(reader.result as ArrayBuffer);
        const db = new SQL.Database(data);
        
        // Verify it's a valid OKR database by checking for our tables
        const tables = db.exec(`
          SELECT name FROM sqlite_master 
          WHERE type='table' AND name IN ('objectives', 'key_results', 'monthly_data')
        `);
        
        if (!tables[0] || tables[0].values.length < 3) {
          throw new Error('Invalid database file: missing required tables');
        }
        
        console.log('✅ Database imported and validated successfully');
        resolve(db);
      } catch (error) {
        console.error('❌ Database import failed:', error);
        reject(error);
      }
    };
    
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsArrayBuffer(file);
  });
};

/**
 * Get database instance singleton
 */
let dbInstance: Database | null = null;

export const getDB = async (): Promise<Database> => {
  if (!dbInstance) {
    dbInstance = await initDB();
  }
  return dbInstance;
};

export const closeDB = (): void => {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
  }
};

