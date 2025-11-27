// FR-002: Key Result Row for Dashboard

import React from 'react';
import { KeyResultWithData } from '@/types/okr';
import { StatusBadge } from '@/components/shared/StatusBadge';
import { TrendIndicator } from '@/components/shared/TrendIndicator';
import { calculateStatus, calculateTrend } from '@/lib/calculations';
import { getPreviousMonth, formatNumber } from '@/lib/utils';

interface KeyResultRowProps {
  keyResult: KeyResultWithData;
  selectedMonth: string;
}

export const KeyResultRow: React.FC<KeyResultRowProps> = ({
  keyResult,
  selectedMonth,
}) => {
  // Get current and previous month data
  const currentData = keyResult.monthly_data.find(
    (md) => md.month === selectedMonth
  );
  const previousMonthStr = getPreviousMonth(selectedMonth);
  const previousData = previousMonthStr
    ? keyResult.monthly_data.find((md) => md.month === previousMonthStr)
    : null;

  if (!currentData) {
    return null;
  }

  // Calculate status and trend
  const isInverseMetric = keyResult.inverse_metric === 1;
  
  console.log(`📊 KeyResultRow [${keyResult.title}]:`, {
    inverse_metric_raw: keyResult.inverse_metric,
    inverse_metric_type: typeof keyResult.inverse_metric,
    isInverseMetric,
    target: currentData.target,
    actual: currentData.actual,
  });
  
  const statusInfo = calculateStatus(
    currentData.actual,
    currentData.target,
    isInverseMetric
  );
  const trendInfo = calculateTrend(
    currentData.actual,
    previousData?.actual ?? null
  );

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
        {/* KR Title and Metric */}
        <div className="md:col-span-2">
          <h3 className="font-semibold text-gray-900">{keyResult.title}</h3>
          <p className="text-sm text-gray-600 mt-1">
            {keyResult.metric}
            {keyResult.unit && ` (${keyResult.unit})`}
          </p>
        </div>

        {/* Target */}
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Target
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatNumber(currentData.target)}
            {keyResult.unit && (
              <span className="text-sm text-gray-500 ml-1">
                {keyResult.unit}
              </span>
            )}
          </p>
        </div>

        {/* Actual */}
        <div className="text-center">
          <p className="text-xs text-gray-500 uppercase tracking-wide">
            Actual
          </p>
          <p className="text-lg font-semibold text-gray-900 mt-1">
            {formatNumber(currentData.actual)}
            {keyResult.unit && (
              <span className="text-sm text-gray-500 ml-1">
                {keyResult.unit}
              </span>
            )}
          </p>
        </div>

        {/* Status and Trend */}
        <div className="flex flex-col items-center gap-2">
          <StatusBadge
            status={statusInfo.status}
            completionPercentage={statusInfo.completionPercentage}
          />
          <TrendIndicator trend={trendInfo} isInverseMetric={isInverseMetric} />
        </div>
      </div>
    </div>
  );
};

