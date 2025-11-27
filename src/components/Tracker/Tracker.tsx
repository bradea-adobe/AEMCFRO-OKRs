// FR-004: Tracker Page (Monthly Data Entry)

import React, { useState } from 'react';
import { useObjectives } from '@/hooks/useObjectives';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { ObjectiveSection } from './ObjectiveSection';
import { getCurrentMonth } from '@/lib/utils';
import { isTimelineEnded } from '@/lib/config';

export const Tracker: React.FC = () => {
  const { objectives, loading, error, refresh } = useObjectives();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [showAllMonths, setShowAllMonths] = useState(false);
  const timelineEnded = isTimelineEnded();

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
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Monthly Tracker</h1>
        <p className="mt-2 text-gray-600">
          Update monthly actuals and comments for your OKRs
        </p>
      </div>

      {/* Timeline End Warning */}
      {timelineEnded && (
        <div className="bg-orange-50 border-l-4 border-orange-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-orange-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-orange-700">
                <strong>OKR period ended.</strong> Tracker is in read-only mode.
                To extend the timeline, update the .env configuration.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Month Selector and View Toggle */}
      <div className="card space-y-4">
        {/* View Toggle */}
        <div className="flex items-center justify-between">
          <div>
            <label className="text-sm font-medium text-gray-700 mr-4">
              View Mode:
            </label>
            <button
              onClick={() => setShowAllMonths(false)}
              className={`px-4 py-2 text-sm font-medium rounded-l-lg border ${
                !showAllMonths
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              Single Month
            </button>
            <button
              onClick={() => setShowAllMonths(true)}
              className={`px-4 py-2 text-sm font-medium rounded-r-lg border-t border-r border-b ${
                showAllMonths
                  ? 'bg-blue-600 text-white border-blue-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50'
              }`}
            >
              All Months
            </button>
          </div>
        </div>

        {/* Month Selector (only shown in single month mode) */}
        {!showAllMonths && (
          <MonthSelector
            selectedMonth={selectedMonth}
            onMonthChange={setSelectedMonth}
          />
        )}
      </div>

      {/* Objectives List */}
      {objectives.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            No objectives found. Create your first objective in the Admin page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {objectives.map((objective) => (
            <ObjectiveSection
              key={objective.id}
              objective={objective}
              selectedMonth={selectedMonth}
              showAllMonths={showAllMonths}
              disabled={timelineEnded}
              onUpdate={refresh}
            />
          ))}
        </div>
      )}
    </div>
  );
};

