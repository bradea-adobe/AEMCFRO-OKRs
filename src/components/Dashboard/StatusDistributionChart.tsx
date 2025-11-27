// FR-002: Status Distribution Chart Component

import React, { useMemo } from 'react';
import { ObjectiveWithDetails } from '@/types/okr';
import { calculateStatus } from '@/lib/calculations';

interface StatusDistributionChartProps {
  objectives: ObjectiveWithDetails[];
  selectedMonth: string;
  hideUnconfigured?: boolean;
}

interface StatusCounts {
  onTrack: number;
  underWatch: number;
  offTrack: number;
  total: number;
}

export const StatusDistributionChart: React.FC<StatusDistributionChartProps> = ({
  objectives,
  selectedMonth,
  hideUnconfigured = false,
}) => {
  const statusCounts = useMemo((): StatusCounts => {
    let onTrack = 0;
    let underWatch = 0;
    let offTrack = 0;

    objectives.forEach((objective) => {
      objective.key_results.forEach((kr) => {
        const monthData = kr.monthly_data.find((md) => md.month === selectedMonth);
        
        if (!monthData) return;

        // Skip unconfigured KRs if hideUnconfigured is true (target = 0)
        if (hideUnconfigured && monthData.target === 0) {
          return;
        }

        const isInverseMetric = kr.inverse_metric === 1;
        const { status } = calculateStatus(
          monthData.actual,
          monthData.target,
          isInverseMetric
        );

        // If not set or target is 0, consider it "On Track" per user requirement
        if (status === 'not-set' || monthData.target === 0) {
          onTrack++;
        } else if (status === 'green') {
          onTrack++;
        } else if (status === 'orange') {
          underWatch++;
        } else if (status === 'red') {
          offTrack++;
        }
      });
    });

    return {
      onTrack,
      underWatch,
      offTrack,
      total: onTrack + underWatch + offTrack,
    };
  }, [objectives, selectedMonth, hideUnconfigured]);

  const getPercentage = (count: number): number => {
    if (statusCounts.total === 0) return 0;
    return (count / statusCounts.total) * 100;
  };

  if (statusCounts.total === 0) {
    return (
      <div className="card p-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">Status</h3>
        <p className="text-xs text-gray-500">No KRs to display</p>
      </div>
    );
  }

  return (
    <div className="card p-4">
      <h3 className="text-base font-semibold text-gray-900 mb-3">Status</h3>
      
      {/* Visual Bar Chart */}
      <div className="mb-3">
        <div className="flex h-6 rounded overflow-hidden">
          {statusCounts.onTrack > 0 && (
            <div
              className="bg-status-green flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(statusCounts.onTrack)}%` }}
              title={`On Track: ${statusCounts.onTrack}`}
            >
              {getPercentage(statusCounts.onTrack) > 15 && statusCounts.onTrack}
            </div>
          )}
          {statusCounts.underWatch > 0 && (
            <div
              className="bg-status-orange flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(statusCounts.underWatch)}%` }}
              title={`Under Watch: ${statusCounts.underWatch}`}
            >
              {getPercentage(statusCounts.underWatch) > 15 && statusCounts.underWatch}
            </div>
          )}
          {statusCounts.offTrack > 0 && (
            <div
              className="bg-status-red flex items-center justify-center text-white text-xs font-medium"
              style={{ width: `${getPercentage(statusCounts.offTrack)}%` }}
              title={`Off Track: ${statusCounts.offTrack}`}
            >
              {getPercentage(statusCounts.offTrack) > 15 && statusCounts.offTrack}
            </div>
          )}
        </div>
      </div>

      {/* Legend with Counts */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-status-green rounded"></div>
            <span className="text-xs text-gray-700">On Track</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900">{statusCounts.onTrack}</span>
            <span className="text-xs text-gray-500">
              ({getPercentage(statusCounts.onTrack).toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-status-orange rounded"></div>
            <span className="text-xs text-gray-700">Under Watch</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900">{statusCounts.underWatch}</span>
            <span className="text-xs text-gray-500">
              ({getPercentage(statusCounts.underWatch).toFixed(0)}%)
            </span>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 bg-status-red rounded"></div>
            <span className="text-xs text-gray-700">Off Track</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-sm font-semibold text-gray-900">{statusCounts.offTrack}</span>
            <span className="text-xs text-gray-500">
              ({getPercentage(statusCounts.offTrack).toFixed(0)}%)
            </span>
          </div>
        </div>
      </div>

      {/* Total Count */}
      <div className="mt-3 pt-3 border-t border-gray-200">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-gray-700">Total</span>
          <span className="text-lg font-bold text-gray-900">{statusCounts.total}</span>
        </div>
      </div>
    </div>
  );
};

