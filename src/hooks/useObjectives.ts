// Custom hook for Objective CRUD operations

import { useState, useEffect, useCallback } from 'react';
import { flushSync } from 'react-dom';
import { useDatabase } from '@/context/DatabaseContext';
import { ObjectiveWithDetails } from '@/types/okr';
import {
  getAllObjectivesWithDetails,
  getObjectiveWithDetails,
  createObjective,
  updateObjective,
  deleteObjective,
} from '@/lib/queries';
import { ObjectiveFormData } from '@/lib/validation';

export const useObjectives = () => {
  const { db, saveToIndexedDB } = useDatabase();
  const [objectives, setObjectives] = useState<ObjectiveWithDetails[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadObjectives = useCallback(() => {
    if (!db) return;
    try {
      const data = getAllObjectivesWithDetails(db);
      setObjectives(data);
      setError(null);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Failed to load objectives';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [db]);

  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  const create = useCallback(
    async (data: ObjectiveFormData) => {
      if (!db) throw new Error('Database not initialized');
      try {
        createObjective(db, data);
        await saveToIndexedDB();
        // Force synchronous state update
        flushSync(() => {
          loadObjectives();
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to create objective';
        setError(message);
        throw err;
      }
    },
    [db, saveToIndexedDB, loadObjectives]
  );

  const update = useCallback(
    async (id: number, data: ObjectiveFormData) => {
      if (!db) throw new Error('Database not initialized');
      try {
        updateObjective(db, id, data);
        await saveToIndexedDB();
        // Force synchronous state update
        flushSync(() => {
          loadObjectives();
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to update objective';
        setError(message);
        throw err;
      }
    },
    [db, saveToIndexedDB, loadObjectives]
  );

  const remove = useCallback(
    async (id: number) => {
      if (!db) throw new Error('Database not initialized');
      try {
        deleteObjective(db, id);
        await saveToIndexedDB();
        // Force synchronous state update
        flushSync(() => {
          loadObjectives();
        });
      } catch (err) {
        const message =
          err instanceof Error ? err.message : 'Failed to delete objective';
        setError(message);
        throw err;
      }
    },
    [db, saveToIndexedDB, loadObjectives]
  );

  const getById = useCallback(
    (id: number): ObjectiveWithDetails | null => {
      if (!db) return null;
      return getObjectiveWithDetails(db, id);
    },
    [db]
  );

  const refresh = useCallback(() => {
    // Force synchronous state update
    flushSync(() => {
      loadObjectives();
    });
  }, [loadObjectives]);

  return {
    objectives,
    loading,
    error,
    create,
    update,
    remove,
    getById,
    refresh,
  };
};

