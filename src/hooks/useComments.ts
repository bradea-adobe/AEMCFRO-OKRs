// Custom hook for Comment operations

import { useCallback } from 'react';
import { useDatabase } from '@/context/DatabaseContext';
import { updateComment, getCommentByMonth } from '@/lib/queries';
import { ObjectiveComment } from '@/types/okr';

export const useComments = () => {
  const { db, saveToIndexedDB } = useDatabase();

  const update = useCallback(
    async (objectiveId: number, month: string, comment: string) => {
      if (!db) throw new Error('Database not initialized');
      try {
        updateComment(db, objectiveId, month, comment);
        await saveToIndexedDB();
      } catch (err) {
        throw new Error(
          err instanceof Error ? err.message : 'Failed to update comment'
        );
      }
    },
    [db, saveToIndexedDB]
  );

  const getByMonth = useCallback(
    (objectiveId: number, month: string): ObjectiveComment | null => {
      if (!db) return null;
      try {
        return getCommentByMonth(db, objectiveId, month);
      } catch (err) {
        console.error('Failed to get comment:', err);
        return null;
      }
    },
    [db]
  );

  return {
    update,
    getByMonth,
  };
};

