// app/goal/[goalId]/VoteButton.tsx
'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation'; // To refresh data

interface VoteButtonProps {
  elseActionId: string;
  initialVoteCount: number;
  goalStatus: string; // e.g., 'ACTIVE', 'COMPLETED', 'FAILED'
  // To determine if the current user has already voted, we'd ideally pass this from the server component
  // For now, we'll handle the "already voted" feedback based on API response
  // hasVoted?: boolean; 
}

export default function VoteButton({ elseActionId, initialVoteCount, goalStatus }: VoteButtonProps) {
  const { data: session, status: sessionStatus } = useSession();
  const router = useRouter();
  const [currentVoteCount, setCurrentVoteCount] = useState(initialVoteCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false); // To give immediate feedback

  const canVote = sessionStatus === 'authenticated' && goalStatus === 'ACTIVE';

  const handleVote = async () => {
    if (!canVote || isLoading || justVoted) return;

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/votes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ elseActionId }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || 'Failed to cast vote.');
        if (response.status === 409) { // 409 Conflict for "already voted"
            setJustVoted(true); // Assume they already voted if API says so
        }
      } else {
        setCurrentVoteCount(data.newVoteCount);
        setJustVoted(true); // Mark as voted to prevent immediate re-vote & change UI
        // router.refresh(); // Refresh the whole page data to get updated vote counts from server for all users
                            // Or, if only one user is voting at a time and we trust client-side update:
                            // No full refresh needed, local state update is enough visual feedback.
                            // For MVP, local update is fine. For robustness, router.refresh() is better.
      }
    } catch (err) {
      console.error("Vote error:", err);
      setError('An unexpected error occurred.');
    } finally {
      setIsLoading(false);
    }
  };
  
  // Styling
  const buttonBaseClasses = "text-xs font-medium py-1.5 px-4 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-raycast-black";
  const activeVoteButtonClasses = `bg-[#C8102E]/20 text-[#C8102E] hover:bg-[#C8102E]/30 focus:ring-[#C8102E]`;
  const votedButtonClasses = `bg-[#333333] text-[#A0AEC0] cursor-default`; // Greyed out if voted
  const disabledButtonClasses = "opacity-60 cursor-not-allowed bg-[#333333] text-[#A0AEC0]";


  let buttonText = `Vote (${currentVoteCount})`;
  let buttonStyle = `${buttonBaseClasses} ${activeVoteButtonClasses}`;
  let isDisabled = isLoading || !canVote;

  if (justVoted) {
    buttonText = `Voted (${currentVoteCount})`;
    buttonStyle = `${buttonBaseClasses} ${votedButtonClasses}`;
    isDisabled = true;
  } else if (!canVote && sessionStatus === 'authenticated' && goalStatus !== 'ACTIVE') {
    buttonText = `Voting Closed (${currentVoteCount})`;
    buttonStyle = `${buttonBaseClasses} ${disabledButtonClasses}`;
    isDisabled = true;
  } else if (sessionStatus !== 'authenticated' && goalStatus === 'ACTIVE') {
     buttonText = `Login to Vote (${currentVoteCount})`;
     buttonStyle = `${buttonBaseClasses} ${disabledButtonClasses}`;
     isDisabled = true; // Or link to login
  }


  return (
    <div className="mt-3 flex flex-col items-start">
      <button
        onClick={handleVote}
        disabled={isDisabled}
        className={buttonStyle}
      >
        {isLoading ? 'Voting...' : buttonText}
      </button>
      {error && <p className="text-xs text-[#FC8181] mt-1">{error}</p>}
    </div>
  );
}