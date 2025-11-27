// FR-004: Comment Box for Tracker

import React, { useState, useEffect } from 'react';
import { ObjectiveWithDetails } from '@/types/okr';
import { useComments } from '@/hooks/useComments';
import { toast } from 'sonner';
import { Button } from '@/components/shared/Button';

interface CommentBoxProps {
  objective: ObjectiveWithDetails;
  selectedMonth: string;
  disabled: boolean;
  onUpdate: () => void;
}

export const CommentBox: React.FC<CommentBoxProps> = ({
  objective,
  selectedMonth,
  disabled,
  onUpdate,
}) => {
  const { update } = useComments();
  const monthComment = objective.comments.find(
    (c) => c.month === selectedMonth
  );

  const [comment, setComment] = useState(monthComment?.comment || '');
  const [isSaving, setIsSaving] = useState(false);

  // Update comment when month changes
  useEffect(() => {
    setComment(monthComment?.comment || '');
  }, [monthComment]);

  const handleSave = async () => {
    if (comment.length > 2000) {
      toast.error('Comment must be 2000 characters or less');
      return;
    }

    setIsSaving(true);
    try {
      await update(objective.id, selectedMonth, comment);
      toast.success('Comment updated');
      onUpdate();
    } catch (error) {
      toast.error('Failed to update comment');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="border-t border-gray-200 pt-4">
      <label
        htmlFor={`comment-${objective.id}`}
        className="block text-sm font-semibold text-gray-700 uppercase tracking-wide mb-2"
      >
        Monthly Comment
      </label>
      <textarea
        id={`comment-${objective.id}`}
        rows={3}
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        disabled={disabled}
        maxLength={2000}
        placeholder="Add a comment about progress this month..."
        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
      />
      <div className="flex justify-between items-center mt-2">
        <span className="text-sm text-gray-500">
          {comment.length} / 2000 characters
        </span>
        <Button onClick={handleSave} disabled={disabled || isSaving}>
          {isSaving ? 'Saving...' : 'Save Comment'}
        </Button>
      </div>
    </div>
  );
};

