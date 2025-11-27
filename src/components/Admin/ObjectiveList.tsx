// FR-003: Objective List Component

import React from 'react';
import { ObjectiveWithDetails } from '@/types/okr';
import { Button } from '@/components/shared/Button';

interface ObjectiveListProps {
  objectives: ObjectiveWithDetails[];
  selectedObjectiveId: number | null;
  onSelectObjective: (id: number) => void;
  onEditObjective: (id: number) => void;
  onCreateKeyResult: (objectiveId: number) => void;
}

export const ObjectiveList: React.FC<ObjectiveListProps> = ({
  objectives,
  selectedObjectiveId,
  onSelectObjective,
  onEditObjective,
  onCreateKeyResult,
}) => {
  if (objectives.length === 0) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">No objectives yet. Create your first one!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {objectives.map((objective) => (
        <div
          key={objective.id}
          className={`card cursor-pointer transition-all ${
            selectedObjectiveId === objective.id
              ? 'ring-2 ring-blue-500 bg-blue-50'
              : 'hover:bg-gray-50'
          }`}
          onClick={() => onSelectObjective(objective.id)}
        >
          <h3 className="font-semibold text-gray-900">{objective.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {objective.key_results.length} Key Result{objective.key_results.length !== 1 ? 's' : ''}
          </p>
          <p className="text-xs text-gray-500 mt-1">Driver: {objective.driver}</p>

          {selectedObjectiveId === objective.id && (
            <div className="mt-3 pt-3 border-t border-gray-200 flex gap-2">
              <Button
                variant="secondary"
                onClick={(e) => {
                  e.stopPropagation();
                  onEditObjective(objective.id);
                }}
                className="text-xs px-2 py-1"
              >
                Edit
              </Button>
              <Button
                variant="primary"
                onClick={(e) => {
                  e.stopPropagation();
                  onCreateKeyResult(objective.id);
                }}
                className="text-xs px-2 py-1"
              >
                + KR
              </Button>
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

