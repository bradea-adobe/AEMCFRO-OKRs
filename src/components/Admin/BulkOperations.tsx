// Bulk Operations Component for Admin Panel

import React, { useState, useRef } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { copyTargetValuesToMonths } from '@/lib/queries';
import { generateMonthRange } from '@/lib/utils';
import { exportDatabase, importDatabase, saveDBToIndexedDB } from '@/lib/database';
import { Button } from '@/components/shared/Button';

export const BulkOperations: React.FC = () => {
  const { db } = useDatabase();
  const [isProcessing, setIsProcessing] = useState(false);
  const [result, setResult] = useState<{
    success: boolean;
    message: string;
    details?: string[];
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCopyNovemberTargets = async () => {
    if (!db) {
      setResult({
        success: false,
        message: 'Database not available',
      });
      return;
    }

    if (
      !confirm(
        'This will copy all target values from November 2025 to December 2025 through December 2026. Continue?'
      )
    ) {
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      // Generate months from December 2025 to December 2026
      const targetMonths = generateMonthRange('2025-12', '2026-12');

      const { updated, errors } = copyTargetValuesToMonths(
        db,
        '2025-11',
        targetMonths
      );

      setResult({
        success: errors.length === 0,
        message: `Successfully updated ${updated} monthly target values`,
        details: errors.length > 0 ? errors : undefined,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Error: ${error}`,
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleExportDatabase = () => {
    if (!db) {
      setResult({
        success: false,
        message: 'Database not available',
      });
      return;
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0];
      const filename = `okr-database-${timestamp}.db`;
      exportDatabase(db, filename);
      
      setResult({
        success: true,
        message: `Database exported successfully as ${filename}`,
      });
    } catch (error) {
      setResult({
        success: false,
        message: `Export failed: ${error}`,
      });
    }
  };

  const handleImportDatabase = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!confirm(
      'This will replace all current data with the imported database. Make sure you have exported a backup first. Continue?'
    )) {
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      return;
    }

    setIsProcessing(true);
    setResult(null);

    try {
      const importedDb = await importDatabase(file);
      
      // Save the imported database to IndexedDB
      await saveDBToIndexedDB(importedDb);
      
      setResult({
        success: true,
        message: 'Database imported successfully! Please refresh the page to see the changes.',
      });
      
      // Auto-refresh after 2 seconds
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (error) {
      setResult({
        success: false,
        message: `Import failed: ${error instanceof Error ? error.message : String(error)}`,
      });
    } finally {
      setIsProcessing(false);
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6 mb-6">
      <h2 className="text-xl font-bold text-gray-800 mb-4">Bulk Operations</h2>

      <div className="space-y-4">
        {/* Export/Import Database */}
        <div className="border-l-4 border-green-500 pl-4">
          <h3 className="font-semibold text-gray-800 mb-2">
            Backup & Restore
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Export your database to a file or import from a backup. Use this to transfer data between browsers or create backups.
          </p>
          <div className="flex gap-3">
            <Button
              onClick={handleExportDatabase}
              disabled={isProcessing || !db}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              📥 Export Database
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".db,.sqlite,.sqlite3"
              onChange={handleImportDatabase}
              className="hidden"
              id="import-file"
            />
            <Button
              onClick={() => fileInputRef.current?.click()}
              disabled={isProcessing}
              className="bg-purple-600 hover:bg-purple-700 text-white"
            >
              📤 Import Database
            </Button>
          </div>
        </div>

        {/* Copy November Targets Operation */}
        <div className="border-l-4 border-blue-500 pl-4">
          <h3 className="font-semibold text-gray-800 mb-2">
            Copy November 2025 Targets
          </h3>
          <p className="text-sm text-gray-600 mb-3">
            Copy all target values from November 2025 to December 2025 through
            December 2026 for all Key Results.
          </p>
          <Button
            onClick={handleCopyNovemberTargets}
            disabled={isProcessing}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isProcessing ? 'Processing...' : 'Copy Nov 2025 Targets →'}
          </Button>
        </div>

        {/* Result Display */}
        {result && (
          <div
            className={`p-4 rounded-md ${
              result.success
                ? 'bg-green-50 border border-green-200'
                : 'bg-red-50 border border-red-200'
            }`}
          >
            <p
              className={`font-semibold ${
                result.success ? 'text-green-800' : 'text-red-800'
              }`}
            >
              {result.success ? '✅ ' : '❌ '}
              {result.message}
            </p>
            {result.details && result.details.length > 0 && (
              <div className="mt-2">
                <p className="text-sm font-semibold text-gray-700 mb-1">
                  Warnings:
                </p>
                <ul className="text-sm text-gray-600 list-disc list-inside">
                  {result.details.map((detail, idx) => (
                    <li key={idx}>{detail}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* Information Box */}
        <div className="bg-blue-50 border border-blue-200 p-4 rounded-md">
          <p className="text-sm text-blue-800">
            <strong>ℹ️ Note:</strong> Your data is stored in your browser's IndexedDB. 
            Export regularly to backup your data and to transfer it between browsers or devices.
          </p>
        </div>
      </div>
    </div>
  );
};

