// FR-001: Data Model - Objectives and Key Results

export interface Objective {
  id: number;
  title: string;
  description: string;
  driver: string;
  created_date: string;
  modified_date: string;
}

export interface KeyResult {
  id: number;
  objective_id: number;
  title: string;
  metric: string;
  unit: string;
  inverse_metric: number; // 0 = normal (higher is better), 1 = inverse (lower is better)
  created_date: string;
  modified_date: string;
}

export interface MonthlyData {
  id: number;
  key_result_id: number;
  month: string; // Format: YYYY-MM
  target: number;
  actual: number;
  last_updated: string;
}

export interface ObjectiveComment {
  id: number;
  objective_id: number;
  month: string; // Format: YYYY-MM
  comment: string;
  last_updated: string;
}

// Extended types for UI
export interface KeyResultWithData extends KeyResult {
  monthly_data: MonthlyData[];
}

export interface ObjectiveWithDetails extends Objective {
  key_results: KeyResultWithData[];
  comments: ObjectiveComment[];
}

// Status types (FR-002)
export type Status = 'green' | 'orange' | 'red' | 'not-set';

export interface StatusInfo {
  status: Status;
  completionPercentage: number;
}

export interface TrendInfo {
  direction: 'up' | 'down' | 'unchanged';
  percentage: number;
  display: string;
}

// Filter types
export interface DashboardFilters {
  status?: Status[];
  driver?: string[];
  hideUnconfigured?: boolean;
}

