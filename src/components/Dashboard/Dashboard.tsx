// FR-002: Dashboard View (Main Screen)

import React, { useState, useMemo } from 'react';
import { useObjectives } from '@/hooks/useObjectives';
import { MonthSelector } from '@/components/shared/MonthSelector';
import { ObjectiveCard } from './ObjectiveCard';
import { StatusDistributionChart } from './StatusDistributionChart';
import { getCurrentMonth } from '@/lib/utils';
import { DashboardFilters } from '@/types/okr';
import { exportDashboardToPDF } from '@/lib/pdfExport';
import { Button } from '@/components/shared/Button';

export const Dashboard: React.FC = () => {
  const { objectives, loading, error } = useObjectives();
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonth());
  const [filters, setFilters] = useState<DashboardFilters>({
    hideUnconfigured: false,
  });

  const filteredObjectives = useMemo(() => {
    return objectives.filter((objective) => {
      // Filter by driver if specified
      if (filters.driver && filters.driver.length > 0) {
        if (!filters.driver.includes(objective.driver)) return false;
      }

      return true;
    });
  }, [objectives, filters]);

  const handleExportToPDF = () => {
    exportDashboardToPDF({
      objectives: filteredObjectives,
      selectedMonth,
    });
  };

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
      {/* Header with Status Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">OKR Dashboard</h1>
              <p className="mt-2 text-gray-600">
                View objectives, key results, and track progress
              </p>
            </div>
            <Button
              onClick={handleExportToPDF}
              className="bg-blue-600 hover:bg-blue-700 text-white flex items-center gap-2"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
              Export PDF
            </Button>
          </div>
          
          {/* Month Selector and Filters */}
          <div className="card mt-6 flex flex-wrap gap-4 items-end">
            <MonthSelector
              selectedMonth={selectedMonth}
              onMonthChange={setSelectedMonth}
            />

            <div className="flex items-center">
              <input
                id="hide-unconfigured"
                type="checkbox"
                checked={filters.hideUnconfigured}
                onChange={(e) =>
                  setFilters({ ...filters, hideUnconfigured: e.target.checked })
                }
                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              />
              <label
                htmlFor="hide-unconfigured"
                className="ml-2 text-sm text-gray-700"
              >
                Hide unconfigured KRs
              </label>
            </div>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="lg:col-span-1">
          <StatusDistributionChart
            objectives={filteredObjectives}
            selectedMonth={selectedMonth}
            hideUnconfigured={filters.hideUnconfigured}
          />
        </div>
      </div>

      {/* Objectives List */}
      {filteredObjectives.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-500 text-lg">
            No objectives found. Create your first objective in the Admin page.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {filteredObjectives.map((objective) => (
            <ObjectiveCard
              key={objective.id}
              objective={objective}
              selectedMonth={selectedMonth}
              hideUnconfigured={filters.hideUnconfigured}
            />
          ))}
        </div>
      )}
    </div>
  );
};

