// FR-001, FR-003, FR-004: SQL CRUD operations

import { Database } from 'sql.js';
import {
  Objective,
  KeyResult,
  MonthlyData,
  ObjectiveComment,
  ObjectiveWithDetails,
} from '@/types/okr';
import { initializeMonthlyData, initializeObjectiveComments } from './initialization';

// ===== OBJECTIVES =====

export const getAllObjectives = (db: Database): Objective[] => {
  const result = db.exec('SELECT id, title, description, driver, created_date, modified_date FROM objectives ORDER BY id');
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    driver: row[3] as string,
    created_date: row[4] as string,
    modified_date: row[5] as string,
  }));
};

export const getObjectiveById = (db: Database, id: number): Objective | null => {
  const result = db.exec('SELECT id, title, description, driver, created_date, modified_date FROM objectives WHERE id = ?', [id]);
  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  return {
    id: row[0] as number,
    title: row[1] as string,
    description: row[2] as string,
    driver: row[3] as string,
    created_date: row[4] as string,
    modified_date: row[5] as string,
  };
};

export const createObjective = (
  db: Database,
  data: { title: string; description?: string; driver: string }
): number => {
  const stmt = db.prepare(
    'INSERT INTO objectives (title, description, driver) VALUES (?, ?, ?)'
  );
  stmt.run([data.title, data.description || '', data.driver]);
  stmt.free();

  // Get the inserted ID
  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;

  // Initialize comment slots (FR-006)
  initializeObjectiveComments(db, id);

  return id;
};

export const updateObjective = (
  db: Database,
  id: number,
  data: { title: string; description?: string; driver: string }
): void => {
  const stmt = db.prepare(
    'UPDATE objectives SET title = ?, description = ?, driver = ?, modified_date = CURRENT_TIMESTAMP WHERE id = ?'
  );
  stmt.run([data.title, data.description || '', data.driver, id]);
  stmt.free();
};

export const deleteObjective = (db: Database, id: number): void => {
  const stmt = db.prepare('DELETE FROM objectives WHERE id = ?');
  stmt.run([id]);
  stmt.free();
};

// ===== KEY RESULTS =====

export const getKeyResultsByObjectiveId = (
  db: Database,
  objectiveId: number
): KeyResult[] => {
  const result = db.exec(
    'SELECT id, objective_id, title, metric, unit, inverse_metric, created_date, modified_date FROM key_results WHERE objective_id = ? ORDER BY id',
    [objectiveId]
  );
  if (result.length === 0) return [];

  const keyResults = result[0].values.map((row) => ({
    id: row[0] as number,
    objective_id: row[1] as number,
    title: row[2] as string,
    metric: row[3] as string,
    unit: row[4] as string,
    inverse_metric: row[5] as number,
    created_date: row[6] as string,
    modified_date: row[7] as string,
  }));
  
  console.log(`📖 Read ${keyResults.length} Key Results for objective ${objectiveId}:`, 
    keyResults.map(kr => ({ id: kr.id, title: kr.title, inverse_metric: kr.inverse_metric }))
  );
  
  return keyResults;
};

export const getAllKeyResults = (db: Database): KeyResult[] => {
  const result = db.exec('SELECT id, objective_id, title, metric, unit, inverse_metric, created_date, modified_date FROM key_results ORDER BY objective_id, id');
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    objective_id: row[1] as number,
    title: row[2] as string,
    metric: row[3] as string,
    unit: row[4] as string,
    inverse_metric: row[5] as number,
    created_date: row[6] as string,
    modified_date: row[7] as string,
  }));
};

export const createKeyResult = (
  db: Database,
  data: {
    objective_id: number;
    title: string;
    metric: string;
    unit?: string;
    inverse_metric?: number;
  }
): number => {
  const stmt = db.prepare(
    'INSERT INTO key_results (objective_id, title, metric, unit, inverse_metric) VALUES (?, ?, ?, ?, ?)'
  );
  stmt.run([
    data.objective_id,
    data.title,
    data.metric,
    data.unit || '',
    data.inverse_metric || 0,
  ]);
  stmt.free();

  // Get the inserted ID
  const result = db.exec('SELECT last_insert_rowid()');
  const id = result[0].values[0][0] as number;

  // Initialize monthly data for all months (FR-006)
  initializeMonthlyData(db, id);

  return id;
};

export const updateKeyResult = (
  db: Database,
  id: number,
  data: { title: string; metric: string; unit?: string; inverse_metric?: number }
): void => {
  try {
    const inverseMetric = data.inverse_metric !== undefined ? data.inverse_metric : 0;
    console.log('Updating key result:', { id, data, inverseMetric });
    
    const stmt = db.prepare(
      'UPDATE key_results SET title = ?, metric = ?, unit = ?, inverse_metric = ?, modified_date = CURRENT_TIMESTAMP WHERE id = ?'
    );
    
    const params = [
      data.title,
      data.metric,
      data.unit || '',
      inverseMetric,
      id,
    ];
    
    console.log('SQL params:', params);
    stmt.run(params);
    stmt.free();
    
    // Verify the update
    const verifyResult = db.exec('SELECT id, title, inverse_metric FROM key_results WHERE id = ?', [id]);
    if (verifyResult.length > 0) {
      console.log('✅ Verified in DB after update:', verifyResult[0].values[0]);
    }
    console.log('Key result updated successfully');
  } catch (error) {
    console.error('Error in updateKeyResult:', error);
    throw new Error(`Failed to update key result in database: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
};

export const deleteKeyResult = (db: Database, id: number): void => {
  const stmt = db.prepare('DELETE FROM key_results WHERE id = ?');
  stmt.run([id]);
  stmt.free();
};

// ===== MONTHLY DATA =====

export const getMonthlyDataByKeyResultId = (
  db: Database,
  keyResultId: number
): MonthlyData[] => {
  const result = db.exec(
    'SELECT id, key_result_id, month, target, actual, last_updated FROM monthly_data WHERE key_result_id = ? ORDER BY month',
    [keyResultId]
  );
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    key_result_id: row[1] as number,
    month: row[2] as string,
    target: row[3] as number,
    actual: row[4] as number,
    last_updated: row[5] as string,
  }));
};

export const getMonthlyDataByMonth = (
  db: Database,
  month: string
): MonthlyData[] => {
  const result = db.exec('SELECT id, key_result_id, month, target, actual, last_updated FROM monthly_data WHERE month = ?', [month]);
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    key_result_id: row[1] as number,
    month: row[2] as string,
    target: row[3] as number,
    actual: row[4] as number,
    last_updated: row[5] as string,
  }));
};

export const updateMonthlyData = (
  db: Database,
  keyResultId: number,
  month: string,
  data: { target?: number; actual?: number }
): void => {
  const updates: string[] = [];
  const values: (number | string)[] = [];

  if (data.target !== undefined) {
    updates.push('target = ?');
    values.push(data.target);
  }
  if (data.actual !== undefined) {
    updates.push('actual = ?');
    values.push(data.actual);
  }

  if (updates.length === 0) return;

  updates.push('last_updated = CURRENT_TIMESTAMP');
  values.push(keyResultId, month);

  const stmt = db.prepare(
    `UPDATE monthly_data SET ${updates.join(', ')} WHERE key_result_id = ? AND month = ?`
  );
  stmt.run(values);
  stmt.free();
};

// ===== COMMENTS =====

export const getCommentsByObjectiveId = (
  db: Database,
  objectiveId: number
): ObjectiveComment[] => {
  const result = db.exec(
    'SELECT id, objective_id, month, comment, last_updated FROM objective_comments WHERE objective_id = ? ORDER BY month',
    [objectiveId]
  );
  if (result.length === 0) return [];

  return result[0].values.map((row) => ({
    id: row[0] as number,
    objective_id: row[1] as number,
    month: row[2] as string,
    comment: row[3] as string,
    last_updated: row[4] as string,
  }));
};

export const getCommentByMonth = (
  db: Database,
  objectiveId: number,
  month: string
): ObjectiveComment | null => {
  const result = db.exec(
    'SELECT id, objective_id, month, comment, last_updated FROM objective_comments WHERE objective_id = ? AND month = ?',
    [objectiveId, month]
  );
  if (result.length === 0 || result[0].values.length === 0) return null;

  const row = result[0].values[0];
  return {
    id: row[0] as number,
    objective_id: row[1] as number,
    month: row[2] as string,
    comment: row[3] as string,
    last_updated: row[4] as string,
  };
};

export const updateComment = (
  db: Database,
  objectiveId: number,
  month: string,
  comment: string
): void => {
  const stmt = db.prepare(
    `INSERT INTO objective_comments (objective_id, month, comment, last_updated)
     VALUES (?, ?, ?, CURRENT_TIMESTAMP)
     ON CONFLICT(objective_id, month) DO UPDATE SET
       comment = excluded.comment,
       last_updated = excluded.last_updated`
  );
  stmt.run([objectiveId, month, comment]);
  stmt.free();
};

// ===== COMPOSITE QUERIES =====

export const getAllObjectivesWithDetails = (
  db: Database
): ObjectiveWithDetails[] => {
  const objectives = getAllObjectives(db);
  const allKeyResults = getAllKeyResults(db);

  return objectives.map((objective) => {
    const keyResults = allKeyResults
      .filter((kr) => kr.objective_id === objective.id)
      .map((kr) => ({
        ...kr,
        monthly_data: getMonthlyDataByKeyResultId(db, kr.id),
      }));

    const comments = getCommentsByObjectiveId(db, objective.id);

    return {
      ...objective,
      key_results: keyResults,
      comments,
    };
  });
};

export const getObjectiveWithDetails = (
  db: Database,
  id: number
): ObjectiveWithDetails | null => {
  const objective = getObjectiveById(db, id);
  if (!objective) return null;

  const keyResults = getKeyResultsByObjectiveId(db, id).map((kr) => ({
    ...kr,
    monthly_data: getMonthlyDataByKeyResultId(db, kr.id),
  }));

  const comments = getCommentsByObjectiveId(db, id);

  return {
    ...objective,
    key_results: keyResults,
    comments,
  };
};

// ===== BULK OPERATIONS =====

/**
 * Copy target values from a source month to multiple destination months
 * for all Key Results
 */
export const copyTargetValuesToMonths = (
  db: Database,
  sourceMonth: string,
  targetMonths: string[]
): { updated: number; errors: string[] } => {
  const errors: string[] = [];
  let updated = 0;

  const allKeyResults = getAllKeyResults(db);

  for (const kr of allKeyResults) {
    try {
      // Get the source month data
      const monthlyData = getMonthlyDataByKeyResultId(db, kr.id);
      const sourceData = monthlyData.find((md) => md.month === sourceMonth);

      if (!sourceData) {
        errors.push(
          `No data found for KR ${kr.id} (${kr.title}) in month ${sourceMonth}`
        );
        continue;
      }

      const targetValue = sourceData.target;

      // Copy to all target months
      for (const month of targetMonths) {
        updateMonthlyData(db, kr.id, month, { target: targetValue });
        updated++;
      }
    } catch (error) {
      errors.push(
        `Error copying target for KR ${kr.id} (${kr.title}): ${error}`
      );
    }
  }

  return { updated, errors };
};

