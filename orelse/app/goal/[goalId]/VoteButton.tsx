// app/goal/[goalId]/VoteButton.tsx
'use client';

import { useState /*, useEffect */ } from 'react'; // Removed useEffect as it was unused
import { useSession } from 'next-auth/react';
// import { useRouter } from 'next/navigation'; // Removed useRouter as it was unused (unless router.refresh() is added back)

interface VoteButtonProps {
  elseActionId: string;
  initialVoteCount: number;
  goalStatus: string;
}

export default function VoteButton({ elseActionId, initialVoteCount, goalStatus }: VoteButtonProps) {
  const { status: sessionStatus } = useSession(); // Only get status, session data itself wasn't used
  // const router = useRouter(); // Keep if you re-add router.refresh()

  const [currentVoteCount, setCurrentVoteCount] = useState(initialVoteCount);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [justVoted, setJustVoted] = useState(false);

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

      const data = await response.json(); // Always try to parse JSON

      if (!response.ok) {
        setError(data.error || 'Failed to cast vote.');
        if (response.status === 409) {
            setJustVoted(true); 
        }
        // No need to throw new Error here if setting state for UI
        return; 
      }
      // Success case
      setCurrentVoteCount(data.newVoteCount);
      setJustVoted(true);
      // router.refresh(); // Consider adding this back if you want the whole page data to refresh from server

    } catch (err: unknown) { // Changed to unknown
      console.error("Vote error:", err);
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };
  
  const buttonBaseClasses = "text-xs font-medium py-1.5 px-4 rounded-full transition-all duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-[#121212]"; // Adjusted ring-offset
  const activeVoteButtonClasses = `bg-[#C8102E]/20 text-[#C8102E] hover:bg-[#C8102E]/30 focus:ring-[#C8102E]`;
  const votedButtonClasses = `bg-[#333333] text-[#A0AEC0] cursor-default`;
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
     isDisabled = true;
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