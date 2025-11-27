// FR-003: Objective Form Component

import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { objectiveSchema, ObjectiveFormData } from '@/lib/validation';
import { useObjectives } from '@/hooks/useObjectives';
import { Objective } from '@/types/okr';
import { Button } from '@/components/shared/Button';
import { Input } from '@/components/shared/Input';
import { toast } from 'sonner';

interface ObjectiveFormProps {
  objective?: Objective;
  onSuccess: () => void;
  onCancel: () => void;
}

export const ObjectiveForm: React.FC<ObjectiveFormProps> = ({
  objective,
  onSuccess,
  onCancel,
}) => {
  const { create, update, remove } = useObjectives();
  const [isDeleting, setIsDeleting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ObjectiveFormData>({
    resolver: zodResolver(objectiveSchema),
    defaultValues: objective
      ? {
          title: objective.title,
          description: objective.description,
          driver: objective.driver,
        }
      : undefined,
  });

  const onSubmit = async (data: ObjectiveFormData) => {
    try {
      if (objective) {
        await update(objective.id, data);
        toast.success('Objective updated successfully');
      } else {
        await create(data);
        toast.success('Objective created successfully');
      }
      onSuccess();
    } catch (error) {
      toast.error(
        objective ? 'Failed to update objective' : 'Failed to create objective'
      );
    }
  };

  const handleDelete = async () => {
    if (!objective) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete this objective? This will delete all associated Key Results and data.'
    );

    if (!confirmed) return;

    setIsDeleting(true);
    try {
      await remove(objective.id);
      toast.success('Objective deleted successfully');
      onSuccess();
    } catch (error) {
      toast.error('Failed to delete objective');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <Input
        label="Title *"
        {...register('title')}
        error={errors.title?.message}
        maxLength={200}
      />

      <div>
        <label htmlFor="description" className="label">
          Description
        </label>
        <textarea
          id="description"
          {...register('description')}
          rows={3}
          className="input"
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
        )}
      </div>

      <Input
        label="Driver *"
        {...register('driver')}
        error={errors.driver?.message}
      />

      <div className="flex gap-3 pt-4">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? 'Saving...' : objective ? 'Update' : 'Create'}
        </Button>
        <Button type="button" variant="secondary" onClick={onCancel}>
          Cancel
        </Button>
        {objective && (
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

