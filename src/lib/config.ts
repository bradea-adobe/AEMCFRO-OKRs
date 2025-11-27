// FR-013: Timeline Configuration & End-of-Period Handling

export interface AppConfig {
  startDate: string; // YYYY-MM format
  endDate: string; // YYYY-MM format
}

export const getConfig = (): AppConfig => {
  const startDate = import.meta.env.VITE_START_DATE || '2025-10';
  const endDate = import.meta.env.VITE_END_DATE || '2026-12';

  // Validate date format
  const datePattern = /^\d{4}-(0[1-9]|1[0-2])$/;
  if (!datePattern.test(startDate) || !datePattern.test(endDate)) {
    throw new Error(
      'Invalid date format in environment variables. Expected YYYY-MM format.'
    );
  }

  return {
    startDate,
    endDate,
  };
};

export const isTimelineEnded = (): boolean => {
  const config = getConfig();
  const now = new Date();
  const currentMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  return currentMonth > config.endDate;
};

export const getCurrentMonth = (): string => {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
};

/**
 * Configuration for objectives that should default to inverse metrics
 * (lower is better) for their key results.
 * 
 * Examples: tickets, incidents, defects, errors, complaints
 */
export const INVERSE_METRIC_OBJECTIVES: string[] = [
  'P2E tickets',
  'P2E Tickets',
  'p2e tickets',
];

/**
 * Check if an objective should default to inverse metrics based on its title
 */
export const shouldDefaultToInverseMetric = (objectiveTitle: string): boolean => {
  // Exact match check
  if (INVERSE_METRIC_OBJECTIVES.some(
    pattern => pattern.toLowerCase() === objectiveTitle.toLowerCase()
  )) {
    return true;
  }
  
  // Pattern matching for common inverse metric indicators
  const lowerTitle = objectiveTitle.toLowerCase();
  const inversePatterns = [
    'ticket',
    'incident',
    'defect',
    'error',
    'bug',
    'issue',
    'complaint',
    'problem',
    'failure',
    'downtime',
  ];
  
  return inversePatterns.some(pattern => lowerTitle.includes(pattern));
};

