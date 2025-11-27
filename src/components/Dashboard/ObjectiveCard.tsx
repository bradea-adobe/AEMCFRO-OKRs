// FR-002: Objective Card Component for Dashboard

import React from 'react';
import { ObjectiveWithDetails } from '@/types/okr';
import { KeyResultRow } from './KeyResultRow';

interface ObjectiveCardProps {
  objective: ObjectiveWithDetails;
  selectedMonth: string;
  hideUnconfigured?: boolean;
}

export const ObjectiveCard: React.FC<ObjectiveCardProps> = ({
  objective,
  selectedMonth,
  hideUnconfigured = false,
}) => {
  // Get comment for selected month
  const monthComment = objective.comments.find(
    (c) => c.month === selectedMonth
  );

  // Filter KRs based on hideUnconfigured setting
  const filteredKeyResults = hideUnconfigured
    ? objective.key_results.filter((kr) => {
        const monthData = kr.monthly_data.find((md) => md.month === selectedMonth);
        // Hide KRs where target = 0
        return monthData && monthData.target !== 0;
      })
    : objective.key_results;

  return (
    <div className="card">
      {/* Objective Header */}
      <div className="mb-4 border-b border-gray-200 pb-4">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              {objective.title}
            </h2>
            {objective.description && (
              <p className="mt-1 text-gray-600">{objective.description}</p>
            )}
          </div>
          <div className="text-base text-gray-600 flex items-center gap-4 bg-gray-50 px-4 py-3 rounded-md">
            <span className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Owner:</span>
              <span className="text-gray-900">Razvan</span>
            </span>
            <span className="text-gray-400">•</span>
            <span className="flex items-center gap-2">
              <span className="font-semibold text-gray-700">Driver:</span>
              <span className="text-gray-900">{objective.driver}</span>
            </span>
          </div>
        </div>

        {/* Monthly Comment */}
        {monthComment && monthComment.comment && (
          <div className="mt-3 bg-blue-50 border border-blue-200 rounded-md p-3">
            <p className="text-sm text-blue-900">{monthComment.comment}</p>
          </div>
        )}
      </div>

      {/* Key Results */}
      <div className="space-y-3">
        {filteredKeyResults.length === 0 ? (
          <p className="text-gray-500 text-center py-4">
            {hideUnconfigured && objective.key_results.length > 0
              ? 'All key results are hidden (unconfigured).'
              : 'No key results defined for this objective.'}
          </p>
        ) : (
          filteredKeyResults.map((kr) => (
            <KeyResultRow
              key={kr.id}
              keyResult={kr}
              selectedMonth={selectedMonth}
            />
          ))
        )}
      </div>
    </div>
  );
};

