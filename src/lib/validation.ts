// FR-003, FR-004: Zod validation schemas

import { z } from 'zod';

// FR-003: Objective validation
export const objectiveSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  description: z.string().optional(),
  driver: z.string().min(1, 'Driver is required'),
});

export type ObjectiveFormData = z.infer<typeof objectiveSchema>;

// FR-003: Key Result validation
export const keyResultSchema = z.object({
  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must be 200 characters or less'),
  metric: z
    .string()
    .min(1, 'Metric is required')
    .max(100, 'Metric must be 100 characters or less'),
  unit: z.string().optional(),
  inverse_metric: z.union([z.boolean(), z.number()]).optional(),
  objective_id: z.number().int().positive(),
});

export type KeyResultFormData = z.infer<typeof keyResultSchema>;

// FR-003, FR-004: Monthly data validation
export const monthlyDataSchema = z.object({
  target: z
    .number()
    .nonnegative('Target must be 0 or greater')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
  actual: z
    .number()
    .nonnegative('Actual must be 0 or greater')
    .or(z.string().regex(/^\d+(\.\d+)?$/).transform(Number)),
});

export type MonthlyDataFormData = z.infer<typeof monthlyDataSchema>;

// FR-004: Comment validation
export const commentSchema = z.object({
  comment: z
    .string()
    .max(2000, 'Comment must be 2000 characters or less')
    .optional(),
});

export type CommentFormData = z.infer<typeof commentSchema>;

// FR-009: Export data validation
export const exportDataSchema = z.object({
  version: z.string(),
  exported_at: z.string(),
  data: z.object({
    objectives: z.array(z.any()),
    key_results: z.array(z.any()),
    monthly_data: z.array(z.any()),
    objective_comments: z.array(z.any()),
  }),
});

export type ExportData = z.infer<typeof exportDataSchema>;

