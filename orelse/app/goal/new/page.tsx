// app/goal/new/page.tsx
'use client';

import { useState, FormEvent } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
// import Link from 'next/link'; // Removed as it's not used in the JSX

interface GoalFormData {
  description: string;
  deadline: string;
  isPublic: boolean;
}
interface ApiErrorIssue {
  path: (string | number)[];
  message: string;
}
interface ApiErrorResponse {
  error: string;
  issues?: ApiErrorIssue[];
}

export default function NewGoalPage() {
  const router = useRouter();
  // Only destructure 'status' if 'data' (sessionData) is not used
  const { status: sessionStatus } = useSession();
  const [formData, setFormData] = useState<GoalFormData>({
    description: '',
    deadline: '',
    isPublic: true,
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string | undefined>>({});

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    if (type === 'checkbox') {
      setFormData(prev => ({ ...prev, [name]: (e.target as HTMLInputElement).checked }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setFieldErrors({});

    if (!formData.description.trim()) {
      setFieldErrors(prev => ({ ...prev, description: "Description can't be empty."}));
      setIsLoading(false);
      return;
    }
    if (!formData.deadline) {
      setFieldErrors(prev => ({ ...prev, deadline: "Deadline is required."}));
      setIsLoading(false);
      return;
    }
    let isoDeadline = '';
    try {
      const localDate = new Date(formData.deadline);
      if (isNaN(localDate.getTime())) throw new Error('Invalid date from input');
      isoDeadline = localDate.toISOString();
    } catch {
      setFieldErrors(prev => ({ ...prev, deadline: "Invalid date/time format."}));
      setIsLoading(false);
      return;
    }
    try {
      const response = await fetch('/api/goal', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          description: formData.description,
          deadline: isoDeadline,
          isPublic: formData.isPublic,
        }),
      });
      if (!response.ok) {
        const errorData: ApiErrorResponse = await response.json();
        setError(errorData.error || `Failed to create goal. Status: ${response.status}`);
        if (errorData.issues) {
          const newFieldErrors: Record<string, string | undefined> = {};
          errorData.issues.forEach(issue => {
            if (issue.path.length > 0) newFieldErrors[issue.path[0] as string] = issue.message;
          });
          setFieldErrors(newFieldErrors);
        }
        return;
      }
      router.push('/');
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'An unexpected error occurred.';
      if (!error && !Object.keys(fieldErrors).length) {
         setError(errorMessage);
      }
      console.error('Submission error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  if (sessionStatus === 'loading') {
    return (
        <div className="container mx-auto p-4 max-w-2xl">
            <div className="h-10 bg-[#1A1A1A] animate-pulse rounded-md mb-4 w-1/4"></div>
            <div className="space-y-4">
                <div className="h-24 bg-[#1A1A1A] animate-pulse rounded-md"></div>
                <div className="h-12 bg-[#1A1A1A] animate-pulse rounded-md"></div>
                <div className="h-12 bg-[#1A1A1A] animate-pulse rounded-md w-1/3"></div>
            </div>
        </div>
    );
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="container mx-auto p-4 text-center">
        <p className="text-lg text-[#FC8181]">
          You need to be signed in to create a goal.
        </p>
      </div>
    );
  }

  const inputClasses = "mt-1 block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none sm:text-sm bg-[#1A1A1A] border-[#333333] focus:ring-[#C8102E] focus:border-[#C8102E] text-[#E2E8F0] placeholder-[#9c9da6]/60";
  const labelClasses = "block text-sm font-medium text-[#9c9da6]/80";
  const buttonClasses = `w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-[#E2E8F0] 
                        ${isLoading ? 'bg-[#333333] cursor-not-allowed' : 'bg-[#C8102E] hover:bg-[#B00E28] cursor-pointer'}
                        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-[#121212] transition-colors`;
  
  // const backButtonClasses = ` ... `; // Removed as it's not used in the JSX

  return (
    <div className="container mx-auto p-4 max-w-2xl">
      {/* The back button was commented out in your JSX, so backButtonClasses is unused */}
      {/* <Link href="/" className={backButtonClasses}>
            &larr; Back to Public Goals
      </Link> */}

      <h1 className="text-3xl font-display font-bold mb-6 text-[#C8102E]">
        Set a New Goal
      </h1>

      {error && (
        <div className="mb-4 p-3 rounded-md bg-[#FC8181] text-[#121212]">
          <p>{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="description" className={labelClasses}>
            What&apos;s your goal?
          </label>
          <textarea
            id="description" name="description" rows={4}
            className={inputClasses}
            value={formData.description} onChange={handleChange} required
            placeholder="e.g., Run a marathon, learn to code, read 52 books..."
          />
          {fieldErrors.description && <p className="mt-1 text-xs text-[#FC8181]">{fieldErrors.description}</p>}
        </div>

        <div>
          <label htmlFor="deadline" className={labelClasses}>
            When do you want to achieve it by?
          </label>
          <input
            type="datetime-local" id="deadline" name="deadline"
            className={inputClasses}
            value={formData.deadline} onChange={handleChange} required
          />
          {fieldErrors.deadline && <p className="mt-1 text-xs text-[#FC8181]">{fieldErrors.deadline}</p>}
        </div>
        
        <div className="flex items-center">
          <input
            id="isPublic" name="isPublic" type="checkbox"
            className="h-4 w-4 rounded border-[#333333] text-[#C8102E] focus:ring-[#C8102E] bg-[#1A1A1A]"
            checked={formData.isPublic} onChange={handleChange}
          />
          <label htmlFor="isPublic" className="ml-2 block text-sm text-[#9c9da6]/60">
            Make this goal public?
          </label>
        </div>

        <div>
          <button type="submit" disabled={isLoading || sessionStatus !== 'authenticated'} className={buttonClasses}>
            {isLoading ? 'Setting Goal...' : 'Set Goal'}
          </button>
        </div>
      </form>
    </div>
  );
}