// Custom hook for Monthly Data operations

import { useCallback } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { updateMonthlyData, getMonthlyDataByMonth } from '@/lib/queries';
import { MonthlyData } from '@/types/okr';

export const useMonthlyData = () => {
  const { db, saveToIndexedDB } = useDatabase();

  const updateTarget = useCallback(
    async (keyResultId: number, month: string, target: number) => {
      if (!db) throw new Error('Database not initialized');
      try {
        updateMonthlyData(db, keyResultId, month, { target });
        await saveToIndexedDB();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update target'
        );
      }
    },
    [db, saveToIndexedDB]
  );

  const updateActual = useCallback(
    async (keyResultId: number, month: string, actual: number) => {
      if (!db) throw new Error('Database not initialized');
      try {
        updateMonthlyData(db, keyResultId, month, { actual });
        await saveToIndexedDB();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update actual'
        );
      }
    },
    [db, saveToIndexedDB]
  );

  const getByMonth = useCallback(
    (month: string): MonthlyData[] => {
      if (!db) return [];
      try {
        return getMonthlyDataByMonth(db, month);
      } catch (err) {
        console.error('Failed to get monthly data:', err);
        return [];
      }
    },
    [db]
  );

  return {
    updateTarget,
    updateActual,
    getByMonth,
  };
};

