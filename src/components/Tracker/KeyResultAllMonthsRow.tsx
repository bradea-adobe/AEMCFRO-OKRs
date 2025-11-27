// FR-004: Key Result Row showing all months for editing

import React, { useState, useEffect } from 'react';
import { KeyResultWithData } from '@/types/okr';
import { useMonthlyData } from '@/hooks/useMonthlyData';
import { generateMonthRange, formatMonth, formatNumber, parseFormattedNumber } from '@/lib/utils';
import { getConfig } from '@/lib/config';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';

interface KeyResultAllMonthsRowProps {
  keyResult: KeyResultWithData;
  disabled: boolean;
  onUpdate: () => void;
}

export const KeyResultAllMonthsRow: React.FC<KeyResultAllMonthsRowProps> = ({
  keyResult,
  disabled,
  onUpdate,
}) => {
  const { updateActual, updateTarget } = useMonthlyData();
  const config = getConfig();
  const allMonths = generateMonthRange(config.startDate, config.endDate);

  // Create a map of month -> data
  const monthDataMap = new Map(
    keyResult.monthly_data.map((md) => [md.month, md])
  );

  // State for all months
  const [monthValues, setMonthValues] = useState<
    Record<string, { target: string; actual: string }>
  >(() => {
    const initial: Record<string, { target: string; actual: string }> = {};
    allMonths.forEach((month) => {
      const data = monthDataMap.get(month);
      initial[month] = {
        target: formatNumber(data?.target || 0),
        actual: formatNumber(data?.actual || 0),
      };
    });
    return initial;
  });

  const [savingField, setSavingField] = useState<string | null>(null);

  // Update state when keyResult changes
  useEffect(() => {
    const updated: Record<string, { target: string; actual: string }> = {};
    allMonths.forEach((month) => {
      const data = monthDataMap.get(month);
      updated[month] = {
        target: formatNumber(data?.target || 0),
        actual: formatNumber(data?.actual || 0),
      };
    });
    setMonthValues(updated);
  }, [keyResult]);

  const handleSave = async (month: string, field: 'target' | 'actual') => {
    const value = monthValues[month]?.[field];
    if (!value) return;

    const numValue = parseFormattedNumber(value);
    if (isNaN(numValue) || numValue < 0) {
      toast.error('Please enter a valid number');
      return;
    }

    const fieldKey = `${month}-${field}`;
    setSavingField(fieldKey);

    try {
      if (field === 'target') {
        await updateTarget(keyResult.id, month, numValue);
        toast.success(`Target updated for ${formatMonth(month)}`);
      } else {
        await updateActual(keyResult.id, month, numValue);
        toast.success(`Actual updated for ${formatMonth(month)}`);
      }
      onUpdate();
    } catch (error) {
      toast.error(`Failed to update ${field}`);
    } finally {
      setSavingField(null);
    }
  };

  const updateValue = (
    month: string,
    field: 'target' | 'actual',
    value: string
  ) => {
    setMonthValues((prev) => ({
      ...prev,
      [month]: {
        ...prev[month],
        [field]: value,
      },
    }));
  };

  return (
    <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
      {/* KR Header */}
      <div className="mb-4">
        <h4 className="font-semibold text-gray-900">{keyResult.title}</h4>
        <p className="text-sm text-gray-600 mt-1">
          {keyResult.metric}
          {keyResult.unit && ` (${keyResult.unit})`}
        </p>
      </div>

      {/* All Months Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider sticky left-0 bg-gray-100 z-10">
                Month
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Target
              </th>
              <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actual
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {allMonths.map((month) => {
              const values = monthValues[month] || { target: '0', actual: '0' };
              const targetFieldKey = `${month}-target`;
              const actualFieldKey = `${month}-actual`;

              return (
                <tr key={month} className="hover:bg-gray-50">
                  <td className="px-3 py-2 whitespace-nowrap text-sm font-medium text-gray-900 sticky left-0 bg-white">
                    {formatMonth(month)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={values.target}
                        onChange={(e) =>
                          updateValue(month, 'target', e.target.value)
                        }
                        disabled={disabled}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <Button
                        onClick={() => handleSave(month, 'target')}
                        disabled={disabled || savingField === targetFieldKey}
                        className="text-xs px-2 py-1"
                      >
                        {savingField === targetFieldKey ? '...' : 'Save'}
                      </Button>
                    </div>
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    <div className="flex gap-2 items-center">
                      <input
                        type="text"
                        value={values.actual}
                        onChange={(e) =>
                          updateValue(month, 'actual', e.target.value)
                        }
                        disabled={disabled}
                        placeholder="0"
                        className="w-24 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
                      />
                      <Button
                        onClick={() => handleSave(month, 'actual')}
                        disabled={disabled || savingField === actualFieldKey}
                        className="text-xs px-2 py-1"
                      >
                        {savingField === actualFieldKey ? '...' : 'Save'}
                      </Button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};

