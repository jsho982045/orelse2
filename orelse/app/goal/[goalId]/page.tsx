// app/goal/[goalId]/page.tsx
import prisma from '@/src/lib/prisma';
import { Goal, User, ElseAction, GoalStatus } from '@prisma/client';
import { notFound } from 'next/navigation';
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import SuggestionForm from './SuggestionForm';
import VoteButton from './VoteButton';
import MarkCompleteButton from './MarkCompleteButton';

const formatDate = (dateString: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

export type ElseActionWithSuggesterAndVoteCount = ElseAction & {
  suggester: {
    name: string | null;
    image: string | null;
  };
};

interface GoalPageProps {
  params: {
    goalId: string;
  };
}

export default async function GoalPage({ params }: GoalPageProps) {
  const { goalId } = params;
  const session = await getServerSession(authOptions);
  const currentUserId = (session?.user as any)?.id || null;

  const goalData = await prisma.goal.findUnique({ // Renamed to goalData to avoid conflict
    where: { id: goalId, isPublic: true },
    include: {
      author: { select: { id: true, name: true, image: true } },
      elseActions: {
        orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }], // Highest votes, then oldest for tie-breaking
        include: {
          suggester: { select: { name: true, image: true } },
        },
      },
    },
  });

  if (!goalData) {
    notFound();
  }

  const isAuthor = currentUserId === goalData.authorId;
  
  // Determine goal's effective status (considering deadline)
  let effectiveStatus = goalData.status;
  const isPastDeadline = new Date() > new Date(goalData.deadline);

  if (goalData.status === GoalStatus.ACTIVE && isPastDeadline) {
    effectiveStatus = GoalStatus.FAILED;
  }

  const canSuggest = session && currentUserId && currentUserId !== goalData.authorId && effectiveStatus === GoalStatus.ACTIVE;


  // Find the chosen "Or Else" action if the goal has effectively FAILED
  let chosenElseAction: ElseActionWithSuggesterAndVoteCount | null = null;
  if (effectiveStatus === GoalStatus.FAILED && goalData.elseActions.length > 0) {
    // The first one in the sorted list (by voteCount desc, createdAt asc) is the winner
    chosenElseAction = goalData.elseActions[0];
  }

  // --- Styling Constants ---
  const pageContainerClasses = "container mx-auto px-4 sm:px-6 lg:px-8 py-8 max-w-4xl";
  const backButtonClasses = `inline-flex items-center px-6 py-2.5 mb-8 rounded-[24px] text-sm font-medium bg-[#2A2A2F] text-[#E2E8F0] hover:bg-[#3c3c42] focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2 focus:ring-offset-[#121212] transition-all duration-200 ease-in-out shadow-md hover:shadow-lg`;
  const mainGoalTitleClasses = "text-4xl lg:text-5xl font-display font-extrabold text-[#E2E8F0] mb-3 tracking-tight";
  const metaInfoContainerClasses = "mb-8 space-y-1.5";
  const metaTextLabelClasses = "text-sm text-[#9c9da6]";
  const metaTextValueClasses = "text-sm text-[#E2E8F0]";
  const authorInfoClasses = "flex items-center space-x-3 py-2";
  const authorImageClasses = "w-10 h-10 rounded-full border-2 border-[#333333]";
  const authorNameClasses = "text-sm font-semibold text-[#E2E8F0]";
  const sectionCardClasses = `mt-8 p-6 sm:p-8 rounded-[36px] bg-[#1A1A1A]/80 border border-[#333333]/60 shadow-2xl supports-[backdrop-filter]:bg-[#1A1A1A]/60 backdrop-blur-xl`;
  const sectionTitleClasses = "text-3xl font-display font-bold text-[#C8102E] mb-6";
  const challengeTitleClasses = "text-2xl font-display font-semibold text-[#9c9da6] mb-4";
  const challengeDescriptionTextClasses = "text-lg text-[#E2E8F0] leading-relaxed max-w-none";
  const suggestionCardClasses = `p-4 sm:p-5 bg-[#121212] rounded-[24px] border border-[#333333]/50 shadow-lg transition-all duration-200 hover:shadow-xl hover:border-[#C8102E]/50`;
  const suggestionTextClasses = "text-md text-[#E2E8F0] mb-2";
  const suggesterInfoClasses = "text-xs text-[#9c9da6]/80 mt-2 flex items-center space-x-2";
  const suggesterImageClasses = "w-6 h-6 rounded-full";
  const placeholderTextClasses = "italic text-[#9c9da6]/60";

  // Specific styles for FAILED goal state and chosen suggestion
  const failedBannerClasses = "p-6 rounded-[24px] bg-red-800/80 border border-red-700/60 shadow-xl backdrop-blur-md text-center mb-8";
  const chosenSuggestionCardClasses = "p-6 bg-yellow-500/10 border-2 border-yellow-500 rounded-[24px] shadow-xl text-center";


  return (
    <div className={pageContainerClasses}>
      <Link href="/" className={backButtonClasses}>
        &larr; Back to Public Goals
      </Link>

      {/* --- Display FAILED Goal Banner and Chosen Suggestion --- */}
      {effectiveStatus === GoalStatus.FAILED && (
        <section className={failedBannerClasses}>
          <h2 className="text-3xl font-display font-bold text-yellow-400 mb-3">Goal Not Achieved!</h2>
          <p className="text-yellow-200 mb-4">The deadline for this goal has passed.</p>
          {chosenElseAction ? (
            <div className={chosenSuggestionCardClasses}>
              <p className="text-lg text-yellow-300 mb-1">The community has decided... You must:</p>
              <p className="text-2xl font-semibold text-yellow-200 mb-2">"{chosenElseAction.suggestion}"</p>
              <p className="text-sm text-yellow-400/80">
                (Suggested by {chosenElseAction.suggester.name || 'Someone'} with {chosenElseAction.voteCount} votes)
              </p>
            </div>
          ) : (
            <p className="text-lg text-yellow-300">No "Or Else" suggestions were made for this goal.</p>
          )}
        </section>
      )}

      {/* --- Goal Details Section --- */}
      <section className={sectionCardClasses}>
        <h1 className={mainGoalTitleClasses}>{goalData.description || 'Untitled Goal'}</h1>
        <div className={metaInfoContainerClasses}>
          {/* ... author, deadline, status, created ... */}
          <div className={authorInfoClasses}>
            {goalData.author.image && (<img src={goalData.author.image} alt={goalData.author.name || 'Author'} className={authorImageClasses} />)}
            <div><p className={metaTextLabelClasses}>Set by</p><p className={authorNameClasses}>{goalData.author.name || 'Anonymous User'}</p></div>
          </div>
          <div><span className={metaTextLabelClasses}>Deadline: </span><span className={metaTextValueClasses}>{formatDate(goalData.deadline)}</span></div>
          <div><span className={`${metaTextLabelClasses} capitalize`}>Effective Status: </span><span className={`${metaTextValueClasses} font-semibold`}>{effectiveStatus.toLowerCase()}</span></div>
          {goalData.createdAt && (<div><span className={metaTextLabelClasses}>Created: </span><span className={metaTextValueClasses}>{formatDate(goalData.createdAt, { month: 'short', day: 'numeric', year: 'numeric' })}</span></div>)}
        </div>
        
        {isAuthor && effectiveStatus === GoalStatus.ACTIVE && (
          <MarkCompleteButton goalId={goalData.id} currentStatus={effectiveStatus} />
        )}
        
        {goalData.description && (
          <div className="mt-6 pt-6 border-t border-[#333333]/60">
            <h2 className={challengeTitleClasses}>The Challenge</h2>
            <article className={challengeDescriptionTextClasses}><p>{goalData.description}</p></article>
          </div>
        )}
      </section>

      {/* --- "Or Else..." Suggestions Section (Show if not COMPLETED and not FAILED where a choice is made) --- */}
      {effectiveStatus !== GoalStatus.COMPLETED && !(effectiveStatus === GoalStatus.FAILED && chosenElseAction) && (
        <section className="mt-12">
          <h2 className={sectionTitleClasses}>"Or Else..." Suggestions</h2>
          {/* ... SuggestionForm and conditional messages ... */}
          {canSuggest && (<div className="my-8"><SuggestionForm goalId={goalData.id} /></div>)}
          {!session && effectiveStatus === GoalStatus.ACTIVE && (
            <p className={`mb-6 ${placeholderTextClasses}`}><Link href="/api/auth/signin" className="text-[#C8102E] hover:underline font-semibold">Sign in</Link> to make a suggestion or vote.</p>
          )}
          {session && currentUserId === goalData.authorId && effectiveStatus === GoalStatus.ACTIVE && (
            <p className={`mb-6 text-sm ${placeholderTextClasses}`}>You can't make suggestions for your own goal.</p>
          )}
          {effectiveStatus === GoalStatus.FAILED && (
            <p className={`mb-6 text-sm ${placeholderTextClasses}`}>Suggestions and voting are closed as this goal's status is {effectiveStatus.toLowerCase()}.</p>
          )}

          <div className="space-y-4 lg:space-y-5">
            {goalData.elseActions.length === 0 ? (
              effectiveStatus === GoalStatus.ACTIVE && (
                <div className={`${sectionCardClasses.replace('mt-8', 'mt-0')} text-center py-10`}>
                  <p className={placeholderTextClasses}>No suggestions yet.{canSuggest && " Why not add one above?"}{!session && " Sign in to be the first!"}</p>
                </div>
              )
            ) : (
              (goalData.elseActions as ElseActionWithSuggesterAndVoteCount[]).map((action) => (
                <div key={action.id} className={suggestionCardClasses}>
                  <p className={suggestionTextClasses}>{action.suggestion}</p>
                  <div className={suggesterInfoClasses}>
                    {action.suggester.image && (<img src={action.suggester.image} alt={action.suggester.name || ''} className={suggesterImageClasses} />)}
                    <span>{action.suggester.name || 'Someone'}</span>
                    <span className="text-[#9c9da6]/60">&bull; {formatDate(action.createdAt, { month: 'short', day: 'numeric' })}</span>
                  </div>
                  <VoteButton elseActionId={action.id} initialVoteCount={action.voteCount} goalStatus={effectiveStatus}/>
                </div>
              ))
            )}
          </div>
        </section>
      )}

      {/* --- Message if goal is COMPLETED --- */}
      {effectiveStatus === GoalStatus.COMPLETED && (
        <div className={`${sectionCardClasses} mt-12 text-center py-10`}>
          <p className="text-2xl font-display text-green-500 mb-3">🎉 Goal Achieved! 🎉</p>
          <p className={placeholderTextClasses}>This goal was marked as completed.</p>
        </div>
      )}
    </div>
  );
}