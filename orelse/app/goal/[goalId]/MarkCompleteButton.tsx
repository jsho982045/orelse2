// app/goal/[goalId]/MarkCompleteButton.tsx
'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { GoalStatus } from '@prisma/client';

interface MarkCompleteButtonProps {
  goalId: string;
  currentStatus: GoalStatus;
}

export default function MarkCompleteButton({ goalId, currentStatus }: MarkCompleteButtonProps) {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleMarkComplete = async () => {
    if (currentStatus !== GoalStatus.ACTIVE) {
      setError("This goal is no longer active and cannot be marked as complete.");
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/goal/${goalId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status: GoalStatus.COMPLETED }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to mark goal as complete.');
      } else {
        // Successfully updated
        router.refresh(); // Refresh the page to show the new status
      }
    } catch (err) {
      console.error("Error marking complete:", err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };

  if (currentStatus !== GoalStatus.ACTIVE) {
    return null; // Don't show the button if the goal is not active
  }
  
  // Styling (dark mode focused)
  const buttonClasses = `
    inline-flex items-center justify-center px-6 py-2.5 rounded-[24px] 
    text-sm font-medium shadow-md hover:shadow-lg
    bg-green-600 hover:bg-green-700 text-white 
    focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 focus:ring-offset-[#121212]
    transition-all duration-200 ease-in-out
    disabled:opacity-70 disabled:cursor-not-allowed
  `;


  return (
    <div className="mt-6">
      <button
        onClick={handleMarkComplete}
        disabled={isLoading}
        className={buttonClasses}
      >
        {isLoading ? 'Updating...' : "🎉 I've Achieved This Goal!"}
      </button>
      {error && <p className="mt-2 text-sm text-[#FC8181]">{error}</p>}
    </div>
  );
}