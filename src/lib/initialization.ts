// FR-006: Data Initialization - Auto-generate monthly data

import { Database } from 'sql.js';
import { generateMonthRange } from './utils';
import { getConfig } from './config';

/**
 * Initialize monthly data for a new Key Result
 * Creates records for all months from START_DATE to END_DATE
 */
export const initializeMonthlyData = (
  db: Database,
  keyResultId: number
): void => {
  const config = getConfig();
  const months = generateMonthRange(config.startDate, config.endDate);

  const stmt = db.prepare(`
    INSERT INTO monthly_data (key_result_id, month, target, actual)
    VALUES (?, ?, 0, 0)
  `);

  try {
    months.forEach((month) => {
      stmt.run([keyResultId, month]);
    });
  } finally {
    stmt.free();
  }
};

/**
 * Initialize monthly comment slots for a new Objective
 */
export const initializeObjectiveComments = (
  db: Database,
  objectiveId: number
): void => {
  const config = getConfig();
  const months = generateMonthRange(config.startDate, config.endDate);

  const stmt = db.prepare(`
    INSERT INTO objective_comments (objective_id, month, comment)
    VALUES (?, ?, '')
  `);

  try {
    months.forEach((month) => {
      stmt.run([objectiveId, month]);
    });
  } finally {
    stmt.free();
  }
};

