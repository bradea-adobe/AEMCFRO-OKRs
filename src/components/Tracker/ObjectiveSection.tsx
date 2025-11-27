// FR-004: Objective Section for Tracker

import React from 'react';
import { Disclosure } from '@headlessui/react';
import { ChevronUpIcon } from '@heroicons/react/20/solid';
import { ObjectiveWithDetails } from '@/types/okr';
import { KeyResultRow } from './KeyResultRow';
import { KeyResultAllMonthsRow } from './KeyResultAllMonthsRow';
import { CommentBox } from './CommentBox';

interface ObjectiveSectionProps {
  objective: ObjectiveWithDetails;
  selectedMonth: string;
  showAllMonths: boolean;
  disabled: boolean;
  onUpdate: () => void;
}

export const ObjectiveSection: React.FC<ObjectiveSectionProps> = ({
  objective,
  selectedMonth,
  showAllMonths,
  disabled,
  onUpdate,
}) => {
  return (
    <Disclosure defaultOpen>
      {({ open }) => (
        <div className="card">
          <Disclosure.Button className="flex w-full justify-between items-center text-left">
            <div>
              <h2 className="text-xl font-bold text-gray-900">
                {objective.title}
              </h2>
              <div className="text-base text-gray-600 mt-2 flex items-center gap-3">
                <span className="font-semibold text-gray-700">Owner:</span>
                <span className="text-gray-900">Razvan</span>
                <span className="text-gray-400 mx-1">•</span>
                <span className="font-semibold text-gray-700">Driver:</span>
                <span className="text-gray-900">{objective.driver}</span>
              </div>
            </div>
            <ChevronUpIcon
              className={`${
                open ? 'rotate-180 transform' : ''
              } h-6 w-6 text-gray-500 transition-transform`}
            />
          </Disclosure.Button>

          <Disclosure.Panel className="mt-6 space-y-4">
            {/* Monthly Comment - only in single month view */}
            {!showAllMonths && (
              <CommentBox
                objective={objective}
                selectedMonth={selectedMonth}
                disabled={disabled}
                onUpdate={onUpdate}
              />
            )}

            {/* Key Results */}
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
                Key Results
              </h3>
              {objective.key_results.length === 0 ? (
                <p className="text-gray-500 text-center py-4">
                  No key results defined for this objective.
                </p>
              ) : showAllMonths ? (
                // All months view
                objective.key_results.map((kr) => (
                  <KeyResultAllMonthsRow
                    key={kr.id}
                    keyResult={kr}
                    disabled={disabled}
                    onUpdate={onUpdate}
                  />
                ))
              ) : (
                // Single month view
                objective.key_results.map((kr) => (
                  <KeyResultRow
                    key={kr.id}
                    keyResult={kr}
                    selectedMonth={selectedMonth}
                    disabled={disabled}
                    onUpdate={onUpdate}
                  />
                ))
              )}
            </div>
          </Disclosure.Panel>
        </div>
      )}
    </Disclosure>
  );
};

