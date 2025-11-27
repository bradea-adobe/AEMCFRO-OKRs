// FR-004: Key Result Row for Tracker with editable actuals

import React, { useState, useEffect } from 'react';
import { KeyResultWithData } from '@/types/okr';
import { useMonthlyData } from '@/hooks/useMonthlyData';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';
import { formatNumber, parseFormattedNumber } from '@/lib/utils';

interface KeyResultRowProps {
  keyResult: KeyResultWithData;
  selectedMonth: string;
  disabled: boolean;
  onUpdate: () => void;
}

export const KeyResultRow: React.FC<KeyResultRowProps> = ({
  keyResult,
  selectedMonth,
  disabled,
  onUpdate,
}) => {
  const { updateActual, updateTarget } = useMonthlyData();
  const monthData = keyResult.monthly_data.find(
    (md) => md.month === selectedMonth
  );

  const [targetValue, setTargetValue] = useState(
    formatNumber(monthData?.target || 0)
  );
  const [actualValue, setActualValue] = useState(
    formatNumber(monthData?.actual || 0)
  );
  const [isSavingTarget, setIsSavingTarget] = useState(false);
  const [isSavingActual, setIsSavingActual] = useState(false);

  // Update values when month data changes
  useEffect(() => {
    if (monthData) {
      setTargetValue(formatNumber(monthData.target));
      setActualValue(formatNumber(monthData.actual));
    }
  }, [monthData?.target, monthData?.actual, selectedMonth]);

  if (!monthData) {
    return null;
  }

  const handleSaveTarget = async () => {
    const numValue = parseFormattedNumber(targetValue);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    setIsSavingTarget(true);
    try {
      await updateTarget(keyResult.id, selectedMonth, numValue);
      toast.success('Target value updated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update target value');
    } finally {
      setIsSavingTarget(false);
    }
  };

  const handleSaveActual = async () => {
    const numValue = parseFormattedNumber(actualValue);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    setIsSavingActual(true);
    try {
      await updateActual(keyResult.id, selectedMonth, numValue);
      toast.success('Actual value updated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update actual value');
    } finally {
      setIsSavingActual(false);
    }
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      <div className="space-y-4">
        {/* KR Info */}
        <div>
          <h4 className="font-semibold text-gray-900">{keyResult.title}</h4>
          <p className="text-sm text-gray-600 mt-1">
            {keyResult.metric}
            {keyResult.unit && ` (${keyResult.unit})`}
          </p>
        </div>

        {/* Target and Actual in a row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Target (Editable) */}
          <div>
            <label
              htmlFor={`target-${keyResult.id}`}
              className="block text-xs text-gray-500 uppercase tracking-wide mb-1"
            >
              Target
            </label>
            <div className="flex gap-2">
              <input
                id={`target-${keyResult.id}`}
                type="text"
                value={targetValue}
                onChange={(e) => setTargetValue(e.target.value)}
                disabled={disabled}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <Button
                onClick={handleSaveTarget}
                disabled={disabled || isSavingTarget}
                className="whitespace-nowrap"
              >
                {isSavingTarget ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>

          {/* Actual (Editable) */}
          <div>
            <label
              htmlFor={`actual-${keyResult.id}`}
              className="block text-xs text-gray-500 uppercase tracking-wide mb-1"
            >
              Actual
            </label>
            <div className="flex gap-2">
              <input
                id={`actual-${keyResult.id}`}
                type="text"
                value={actualValue}
                onChange={(e) => setActualValue(e.target.value)}
                disabled={disabled}
                placeholder="0"
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <Button
                onClick={handleSaveActual}
                disabled={disabled || isSavingActual}
                className="whitespace-nowrap"
              >
                {isSavingActual ? 'Saving...' : 'Save'}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

