// FR-003: Key Result Form Component

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { keyResultSchema, KeyResultFormData } from '@/lib/validation';
import { useKeyResults } from '@/hooks/useKeyResults';
import { useObjectives } from '@/hooks/useObjectives';
import { KeyResult } from '@/types/okr';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { toast } from 'sonner';
import { shouldDefaultToInverseMetric } from '@/lib/config';

interface KeyResultFormProps {
  objectiveId: number;
  keyResult?: KeyResult;
  onSuccess: () => void;
  onCancel: () => void;
}

export const KeyResultForm: React.FC<KeyResultFormProps> = ({
  objectiveId,
  keyResult,
  onSuccess,
  onCancel,
}) => {
  const { create, update, remove } = useKeyResults();
  const { objectives, refresh } = useObjectives();
  const [isDeleting, setIsDeleting] = React.useState(false);

  // Find the objective to check if it should default to inverse metrics
  const objective = objectives.find(o => o.id === objectiveId);
  const defaultInverseMetric = objective ? shouldDefaultToInverseMetric(objective.title) : false;

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<KeyResultFormData>({
    resolver: zodResolver(keyResultSchema),
    defaultValues: {
      objective_id: objectiveId,
      inverse_metric: defaultInverseMetric,
    },
  });

  // Update form values when keyResult or objective changes
  React.useEffect(() => {
    if (keyResult) {
      console.log('KeyResultForm - RAW keyResult.inverse_metric:', keyResult.inverse_metric, 'type:', typeof keyResult.inverse_metric);
    }
    
    const formValues = keyResult
      ? {
          title: keyResult.title,
          metric: keyResult.metric,
          unit: keyResult.unit,
          // Convert number (1/0) to boolean
          inverse_metric: keyResult.inverse_metric === 1,
          objective_id: keyResult.objective_id,
        }
      : {
          objective_id: objectiveId,
          title: '',
          metric: '',
          unit: '',
          inverse_metric: defaultInverseMetric,
        };

    console.log('KeyResultForm - objective:', objective?.title);
    console.log('KeyResultForm - defaultInverseMetric:', defaultInverseMetric);
    console.log('KeyResultForm - resetting form with keyResult:', keyResult);
    console.log('KeyResultForm - formValues:', formValues);
    console.log('KeyResultForm - inverse_metric value:', formValues.inverse_metric);

    reset(formValues);
  }, [keyResult, objectiveId, objective, defaultInverseMetric, reset]);

  const onSubmit = async (data: KeyResultFormData) => {
    try {
      console.log('KeyResultForm onSubmit - form data:', data);
      console.log('KeyResultForm onSubmit - inverse_metric value:', data.inverse_metric, 'type:', typeof data.inverse_metric);
      
      if (keyResult) {
        const updateData = {
          title: data.title,
          metric: data.metric,
          unit: data.unit,
          inverse_metric: data.inverse_metric ? 1 : 0,
        };
        console.log('KeyResultForm onSubmit - update data:', updateData);
        await update(keyResult.id, updateData);
        toast.success('Key Result updated successfully');
      } else {
        const createData = {
          ...data,
          inverse_metric: data.inverse_metric ? 1 : 0,
        };
        console.log('KeyResultForm onSubmit - create data:', createData);
        await create(createData);
        toast.success('Key Result created successfully');
      }
      refresh();
      onSuccess();
    } catch (error) {
      console.error('Key Result operation failed:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      toast.error(
        keyResult 
          ? `Failed to update key result: ${errorMessage}` 
          : `Failed to create key result: ${errorMessage}`
      );
    }
  };

  const handleDelete = async () => {
    if (!keyResult) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this key result? This will delete all monthly data for this KR.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await remove(keyResult.id);
      toast.success('Key Result deleted successfully');
      refresh();
      onSuccess();
    } catch (error) {
      toast.error('Failed to delete key result');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      {/* Key Result Form */}
      <Input
        label="Title *"
        {...register('title')}
        error={errors.title?.message}
        maxLength={200}
      />

      <Input
        label="Metric Description *"
        {...register('metric')}
        error={errors.metric?.message}
        maxLength={100}
        placeholder="e.g., Number of deployments, Percentage of uptime"
      />

      <Input
        label="Unit"
        {...register('unit')}
        error={errors.unit?.message}
        placeholder="e.g., %, deployments, hours"
      />

      <div className="space-y-1">
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            id="inverse_metric"
            {...register('inverse_metric', {
              setValueAs: (v) => {
                // Ensure proper boolean handling for checkboxes
                return typeof v === 'boolean' ? v : v === 'true' || v === true;
              }
            })}
            className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
          />
          <label htmlFor="inverse_metric" className="text-sm text-gray-700">
            Inverse metric (lower is better) - for metrics like Open Tickets, Paused Customers, etc.
          </label>
        </div>
        {!keyResult && defaultInverseMetric && (
          <p className="text-xs text-blue-600 ml-6">
            ℹ️ Auto-detected based on objective "{objective?.title}"
          </p>
        )}
      </div>

      <input type="hidden" {...register('objective_id')} />

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : keyResult ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        {keyResult && (
          <Button
            type="button"
            variant="danger"
            onClick={handleDelete}
            disabled={isDeleting}
            className="ml-auto"
          >
            {isDeleting ? 'Deleting...' : 'Delete'}
          </Button>
        )}
      </div>
    </form>
  );
};

