// Custom hook for Key Result CRUD operations

import { useCallback } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import {
  createKeyResult,
  updateKeyResult,
  deleteKeyResult,
} from '@/lib/queries';
import { KeyResultFormData } from '@/lib/validation';

export const useKeyResults = () => {
  const { db, saveToIndexedDB } = useDatabase();

  const create = useCallback(
    async (data: KeyResultFormData) => {
      if (!db) throw new Error('Database not initialized');
      try {
        // Convert inverse_metric to number if it's boolean
        const inverseMetric = typeof data.inverse_metric === 'boolean' 
          ? (data.inverse_metric ? 1 : 0)
          : (data.inverse_metric || 0);
        
        const id = createKeyResult(db, {
          ...data,
          inverse_metric: inverseMetric,
        });
        await saveToIndexedDB();
        return id;
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to create key result'
        );
      }
    },
    [db, saveToIndexedDB]
  );

  const update = useCallback(
    async (
      id: number,
      data: Omit<KeyResultFormData, 'objective_id'>
    ) => {
      if (!db) throw new Error('Database not initialized');
      try {
        console.log('useKeyResults.update called with:', { id, data });
        
        // Convert inverse_metric to number if it's boolean
        const inverseMetric = typeof data.inverse_metric === 'boolean' 
          ? (data.inverse_metric ? 1 : 0)
          : (data.inverse_metric ?? 0);
        
        console.log('Converted inverseMetric:', inverseMetric);
        
        updateKeyResult(db, id, {
          title: data.title,
          metric: data.metric,
          unit: data.unit,
          inverse_metric: inverseMetric,
        });
        
        console.log('updateKeyResult completed, saving to IndexedDB...');
        await saveToIndexedDB();
        console.log('Saved to IndexedDB successfully');
      } catch (err) {
        console.error('Error in useKeyResults.update:', err);
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update key result'
        );
      }
    },
    [db, saveToIndexedDB]
  );

  const remove = useCallback(
    async (id: number) => {
      if (!db) throw new Error('Database not initialized');
      try {
        deleteKeyResult(db, id);
        await saveToIndexedDB();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to delete key result'
        );
      }
    },
    [db, saveToIndexedDB]
  );

  return {
    create,
    update,
    remove,
  };
};

