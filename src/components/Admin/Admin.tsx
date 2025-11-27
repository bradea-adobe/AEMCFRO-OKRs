// FR-003: Admin Page (OKR Structure Management)

import React, { useState, useEffect } from 'react';
import { useObjectives } from '@/hooks/useObjectives';
import { ObjectiveList } from './ObjectiveList';
import { ObjectiveForm } from './ObjectiveForm';
import { KeyResultForm } from './KeyResultForm';
import { BulkOperations } from './BulkOperations';
import { Button } from '@/components/shared/Button';

type ViewMode = 'list' | 'create-objective' | 'edit-objective' | 'create-kr' | 'edit-kr';

export const Admin: React.FC = () => {
  const { objectives, loading, error } = useObjectives();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [selectedObjectiveId, setSelectedObjectiveId] = useState<number | null>(null);
  const [selectedKeyResultId, setSelectedKeyResultId] = useState<number | null>(null);

  const selectedObjective = selectedObjectiveId
    ? objectives.find((o) => o.id === selectedObjectiveId)
    : null;

  const selectedKeyResult = selectedKeyResultId && selectedObjective
    ? selectedObjective.key_results.find((kr) => kr.id === selectedKeyResultId)
    : null;

  // Debug logging for selected key result
  useEffect(() => {
    if (selectedKeyResult) {
      console.log('🔍 Admin - selectedKeyResult loaded:', {
        id: selectedKeyResult.id,
        title: selectedKeyResult.title,
        inverse_metric: selectedKeyResult.inverse_metric,
        inverse_metric_type: typeof selectedKeyResult.inverse_metric,
      });
    }
  }, [selectedKeyResult]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <p className="text-red-800">Error: {error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Admin</h1>
          <p className="mt-2 text-gray-600">
            Manage objectives, key results, and targets
          </p>
        </div>
        {viewMode === 'list' && (
          <Button onClick={() => setViewMode('create-objective')}>
            + New Objective
          </Button>
        )}
      </div>

      {/* Bulk Operations */}
      <BulkOperations />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Panel: Objective List */}
        <div className="lg:col-span-1">
          <ObjectiveList
            objectives={objectives}
            selectedObjectiveId={selectedObjectiveId}
            onSelectObjective={(id) => {
              setSelectedObjectiveId(id);
              setViewMode('list');
            }}
            onEditObjective={(id) => {
              setSelectedObjectiveId(id);
              setViewMode('edit-objective');
            }}
            onCreateKeyResult={(objectiveId) => {
              setSelectedObjectiveId(objectiveId);
              setViewMode('create-kr');
            }}
          />
        </div>

        {/* Right Panel: Forms */}
        <div className="lg:col-span-2">
          {viewMode === 'create-objective' && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Create New Objective</h2>
              <ObjectiveForm
                onSuccess={() => {
                  setViewMode('list');
                }}
                onCancel={() => setViewMode('list')}
              />
            </div>
          )}

          {viewMode === 'edit-objective' && selectedObjective && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Edit Objective</h2>
              <ObjectiveForm
                objective={selectedObjective}
                onSuccess={() => {
                  setViewMode('list');
                }}
                onCancel={() => setViewMode('list')}
              />
            </div>
          )}

          {viewMode === 'create-kr' && selectedObjectiveId && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Create New Key Result</h2>
              <KeyResultForm
                objectiveId={selectedObjectiveId}
                onSuccess={() => {
                  setViewMode('list');
                }}
                onCancel={() => setViewMode('list')}
              />
            </div>
          )}

          {viewMode === 'edit-kr' && selectedObjectiveId && selectedKeyResult && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Edit Key Result</h2>
              <KeyResultForm
                objectiveId={selectedObjectiveId}
                keyResult={selectedKeyResult}
                onSuccess={() => {
                  setViewMode('list');
                  setSelectedKeyResultId(null);
                }}
                onCancel={() => {
                  setViewMode('list');
                  setSelectedKeyResultId(null);
                }}
              />
            </div>
          )}

          {viewMode === 'list' && selectedObjective && (
            <div className="card">
              <h2 className="text-xl font-bold mb-4">Objective Details</h2>
              <div className="space-y-4">
                <div>
                  <p className="text-sm text-gray-500">Title</p>
                  <p className="text-lg font-medium">{selectedObjective.title}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Description</p>
                  <p className="text-gray-900">{selectedObjective.description || 'No description'}</p>
                </div>
                <div className="flex items-center gap-3 text-base py-1">
                  <span className="text-gray-600 font-semibold">Owner:</span>
                  <span className="text-gray-900">Razvan</span>
                  <span className="text-gray-400 mx-1">•</span>
                  <span className="text-gray-600 font-semibold">Driver:</span>
                  <span className="text-gray-900">{selectedObjective.driver}</span>
                </div>
                
                {/* Key Results List */}
                <div className="pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center mb-3">
                    <p className="text-sm font-medium text-gray-700">
                      Key Results ({selectedObjective.key_results.length})
                    </p>
                  </div>
                  
                  {selectedObjective.key_results.length === 0 ? (
                    <p className="text-sm text-gray-500 italic">
                      No key results yet. Click "+ KR" to add one.
                    </p>
                  ) : (
                    <div className="space-y-2">
                      {selectedObjective.key_results.map((kr) => (
                        <div
                          key={kr.id}
                          className="flex items-start justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
                        >
                          <div className="flex-1 min-w-0">
                            <p className="font-medium text-gray-900 text-sm">
                              {kr.title}
                            </p>
                            <p className="text-xs text-gray-600 mt-1">
                              {kr.metric} {kr.unit && `(${kr.unit})`}
                            </p>
                          </div>
                          <Button
                            variant="secondary"
                            onClick={() => {
                              setSelectedKeyResultId(kr.id);
                              setViewMode('edit-kr');
                            }}
                            className="ml-3 text-xs px-3 py-1"
                          >
                            Edit
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'list' && !selectedObjective && (
            <div className="card text-center py-12">
              <p className="text-gray-500">
                Select an objective from the list or create a new one
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

