// app/goal/[goalId]/SuggestionForm.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation'; // To refresh data after submission

interface SuggestionFormProps {
  goalId: string;
}

interface ApiErrorIssue {
  path: (string | number)[];
  message: string;
}
interface ApiErrorResponse {
  error: string;
  issues?: ApiErrorIssue[];
}

export default function SuggestionForm({ goalId }: SuggestionFormProps) {
  const router = useRouter();
  const [suggestion, setSuggestion] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldError, setFieldError] = useState<string | undefined>(undefined);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldError(undefined);

    if (!suggestion.trim()) {
      setFieldError("Suggestion can't be empty.");
      setIsLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/suggestions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          goalId,
          suggestion,
        }),
      });

      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setError(errorData.error || `Failed to submit suggestion. Status: ${response.status}`);
        if (errorData.issues && errorData.issues.length > 0 && errorData.issues[0].path[0] === 'suggestion') {
          setFieldError(errorData.issues[0].message);
        }
        // No need to throw new Error here if we're setting state for UI feedback
        // throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        return; // Exit after handling error
      }

      setSuggestion(''); 
      router.refresh(); 
      
    } catch (err: unknown) { // Changed from 'any' to 'unknown'
      // Check if it's an actual error object before accessing .message
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (!error && !fieldError) { // Only set general error if not already set by API response
        setError(errorMessage);
      }
      console.error('Suggestion submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const textareaClasses = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm bg-[#1A1A1A] border-[#333333] focus:ring-[#C8102E] focus:border-[#C8102E] text-[#E2E8F0] placeholder-[#9c9da6]/60"; // Changed placeholder text color
  const buttonClasses = `mt-3 inline-flex items-center justify-center px-6 py-2.5 rounded-[24px] shadow-md text-sm font-medium 
                         bg-[#C8102E] text-raycast-white hover:bg-[#B00E28] active:bg-[#9A0C22] cursor-pointer
                         focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-raycast-black
                         transition-all duration-200 ease-in-out
                         disabled:bg-[#333333] disabled:cursor-not-allowed`;

  return (
    <form onSubmit={handleSubmit} className="mb-6 p-4 bg-[#121212] rounded-xl border border-[#333333]/50">
      <h3 className="text-lg font-display font-semibold text-[#E2E8F0] mb-2">Got an &quot;Or Else&quot; idea?</h3> {/* Escaped quote */}
      {error && (
        <div className="mb-3 p-2 rounded-md bg-[#FC8181] text-raycast-black text-sm">
          <p>{error}</p>
        </div>
      )}
      <div>
        <textarea
          name="suggestion"
          rows={3}
          className={textareaClasses}
          value={suggestion}
          onChange={(e) => setSuggestion(e.target.value)}
          placeholder="e.g., Wear a silly hat for a week..." // This line was 85 in error log, no unescaped quotes needed here if this is the exact content.
          maxLength={500}
        />
        {fieldError && <p className="mt-1 text-xs text-[#FC8181]">{fieldError}</p>}
      </div>
      <button type="submit" disabled={isLoading} className={buttonClasses}>
        {isLoading ? 'Submitting...' : 'Suggest'}
      </button>
    </form>
  );
}