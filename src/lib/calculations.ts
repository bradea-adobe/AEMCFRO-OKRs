// FR-002: Status and Trend calculation logic

import { Status, StatusInfo, TrendInfo } from '@/types/okr';

/**
 * Calculate status based on actual vs target
 * FR-002: Green >= 75%, Orange >= 50%, Red < 50%
 * For inverse metrics (where lower is better): inverts the calculation
 */
export const calculateStatus = (
  actual: number,
  target: number,
  isInverseMetric: boolean = false
): StatusInfo => {
  if (target <= 0) {
    return {
      status: 'not-set',
      completionPercentage: 0,
    };
  }

  let completionPercentage: number;
  let status: Status;

  if (isInverseMetric) {
    // For inverse metrics (lower is better)
    if (actual <= target) {
      // Under target is good - show how much under (higher % = better)
      completionPercentage = (target / actual) * 100;
      status = 'green';
    } else {
      // Over target is bad - show overage percentage
      const overagePercentage = ((actual - target) / target) * 100;
      completionPercentage = overagePercentage;
      
      // Status based on overage:
      // <= 50% over target = Orange
      // > 50% over target = Red
      if (overagePercentage <= 50) {
        status = 'orange';
      } else {
        status = 'red';
      }
    }
  } else {
    // Normal metrics (higher is better)
    completionPercentage = (actual / target) * 100;
    
    // Determine status based on completion percentage
    if (completionPercentage >= 75) {
      status = 'green';
    } else if (completionPercentage >= 50) {
      status = 'orange';
    } else {
      status = 'red';
    }
  }

  return {
    status,
    completionPercentage,
  };
};

/**
 * Calculate trend between current and previous month
 * FR-002: Returns direction and percentage change
 */
export const calculateTrend = (
  currentActual: number,
  previousActual: number | null
): TrendInfo => {
  if (
    previousActual === null ||
    previousActual === 0 ||
    previousActual === undefined
  ) {
    return {
      direction: 'unchanged',
      percentage: 0,
      display: 'N/A',
    };
  }

  const trendPercentage =
    ((currentActual - previousActual) / previousActual) * 100;

  let direction: 'up' | 'down' | 'unchanged';
  if (trendPercentage > 0) {
    direction = 'up';
  } else if (trendPercentage < 0) {
    direction = 'down';
  } else {
    direction = 'unchanged';
  }

  const arrow = direction === 'up' ? '↑' : direction === 'down' ? '↓' : '→';
  const display = `${arrow} ${Math.abs(trendPercentage).toFixed(1)}%`;

  return {
    direction,
    percentage: trendPercentage,
    display,
  };
};

/**
 * Get CSS class for status badge
 */
export const getStatusColor = (status: Status): string => {
  const colors: Record<Status, string> = {
    green: 'bg-status-green text-white',
    orange: 'bg-status-orange text-white',
    red: 'bg-status-red text-white',
    'not-set': 'bg-gray-300 text-gray-700',
  };
  return colors[status];
};

/**
 * Get CSS class for trend indicator
 * For inverse metrics, down is good (green) and up is bad (red)
 */
export const getTrendColor = (
  direction: 'up' | 'down' | 'unchanged',
  isInverseMetric: boolean = false
): string => {
  if (isInverseMetric) {
    // Inverted colors for inverse metrics
    const colors = {
      up: 'text-red-600',      // Going up is bad for inverse metrics
      down: 'text-green-600',  // Going down is good for inverse metrics
      unchanged: 'text-gray-500',
    };
    return colors[direction];
  }
  
  // Normal colors
  const colors = {
    up: 'text-green-600',
    down: 'text-red-600',
    unchanged: 'text-gray-500',
  };
  return colors[direction];
};

