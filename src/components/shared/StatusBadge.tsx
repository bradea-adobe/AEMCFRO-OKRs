// FR-002: Status Badge Component

import React from 'react';
import { Status } from '@/types/okr';
import { getStatusColor } from '@/lib/calculations';

interface StatusBadgeProps {
  status: Status;
  completionPercentage?: number;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({
  status,
  completionPercentage,
}) => {
  const colorClass = getStatusColor(status);

  const labels: Record<Status, string> = {
    green: 'On Track',
    orange: 'Under-Watch',
    red: 'Off Track',
    'not-set': 'Not Set',
  };

  return (
    <span className={`status-badge ${colorClass}`}>
      {labels[status]}
      {completionPercentage !== undefined && status !== 'not-set' && (
        <span className="ml-1">({completionPercentage.toFixed(0)}%)</span>
      )}
    </span>
  );
};

