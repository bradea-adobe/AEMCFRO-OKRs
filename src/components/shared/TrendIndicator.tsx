// FR-002: Trend Indicator Component

import React from 'react';
import { TrendInfo } from '@/types/okr';
import { getTrendColor } from '@/lib/calculations';

interface TrendIndicatorProps {
  trend: TrendInfo;
  isInverseMetric?: boolean;
}

export const TrendIndicator: React.FC<TrendIndicatorProps> = ({
  trend,
  isInverseMetric = false,
}) => {
  const colorClass = getTrendColor(trend.direction, isInverseMetric);

  if (trend.display === 'N/A') {
    return <span className="text-sm text-gray-400">N/A</span>;
  }

  return (
    <span className={`text-sm font-medium ${colorClass}`}>
      {trend.display}
    </span>
  );
};

