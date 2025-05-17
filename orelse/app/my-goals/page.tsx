// app/my-goals/page.tsx
import prisma from '@/src/lib/prisma';
import { Goal, GoalStatus, ElseAction } from '@prisma/client'; // Import necessary types
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation'; // For redirecting if not logged in

// Helper to format dates (can be moved to a shared utils file later if not already)
const formatDate = (dateString: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

// We can reuse a similar card structure or create a dedicated one
// For now, let's define a UserGoalCard here, adapting from the public GoalCard
// We'll need to pass the 'effectiveStatus' and 'chosenElseAction' if we calculate them here too
type ElseActionWithSuggester = ElseAction & {
  suggester: { name: string | null; image: string | null };
};

type GoalWithAuthorAndElseActions = Goal & {
  author: { name: string | null; image: string | null };
  elseActions: ElseActionWithSuggester[];
};

interface UserGoalCardProps {
  goal: GoalWithAuthorAndElseActions;
  effectiveStatus: GoalStatus;
  chosenElseAction: ElseActionWithSuggester | null;
}

function UserGoalCard({ goal, effectiveStatus, chosenElseAction }: UserGoalCardProps) {
  const cardClasses = `
    flex flex-col rounded-[36px] transition-all duration-300 ease-in-out
    hover:shadow-2xl hover:-translate-y-1 overflow-hidden 
    bg-[#1A1A1A]/80 border border-[#333333]/60 shadow-2xl 
    supports-[backdrop-filter]:bg-[#1A1A1A]/60 backdrop-blur-lg h-full
  `;
  const titleClasses = "font-display font-semibold text-xl mb-2 text-[#C8102E]";
  const textMutedClasses = "text-xs text-[#A0AEC0]";
  const descriptionClasses = "text-sm mb-3 flex-grow text-[#E2E8F0] min-h-[60px]";
  const statusBadgeBase = "px-2.5 py-0.5 rounded-full text-xs font-semibold";
  let statusBadgeColor = "";

  switch (effectiveStatus) {
    case GoalStatus.ACTIVE:
      statusBadgeColor = "bg-sky-700 text-sky-100";
      break;
    case GoalStatus.COMPLETED:
      statusBadgeColor = "bg-green-700 text-green-100";
      break;
    case GoalStatus.FAILED:
      statusBadgeColor = "bg-red-700 text-red-100";
      break;
    default:
      statusBadgeColor = "bg-gray-700 text-gray-100";
  }

  return (
    <Link href={`/goal/${goal.id}`} className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2 focus:ring-offset-[#121212] rounded-[36px]">
      <div className={cardClasses}>
        <div className="p-6 flex flex-col h-full">
          <div>
            <h3 className={titleClasses}>
              {goal.description ? (goal.description.substring(0, 50) + (goal.description.length > 50 ? '...' : '')) : 'Untitled Goal'}
            </h3>
            {!goal.isPublic && (
                <span className="text-xs font-medium bg-[#333333] text-[#A0AEC0] px-2 py-0.5 rounded-full inline-block mb-2">
                    Private
                </span>
            )}
            <p className={descriptionClasses}>
              {goal.description || "No description provided."}
            </p>
          </div>
          <div className="mt-auto pt-4 border-t border-[#333333]/70 space-y-1.5">
            <p className={`${textMutedClasses}`}>
              Deadline: <span className="text-[#E2E8F0]">{formatDate(goal.deadline)}</span>
            </p>
            <p className={`${textMutedClasses} capitalize`}>
              Status: <span className={`${statusBadgeBase} ${statusBadgeColor}`}>{effectiveStatus.toLowerCase()}</span>
            </p>
            {effectiveStatus === GoalStatus.FAILED && chosenElseAction && (
              <p className={`${textMutedClasses} text-yellow-400`}>
                Consequence: "{chosenElseAction.suggestion.substring(0,30)}..."
              </p>
            )}
             {effectiveStatus === GoalStatus.FAILED && !chosenElseAction && (
              <p className={`${textMutedClasses} text-yellow-400`}>
                Consequence: None suggested.
              </p>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}


export default async function MyGoalsPage() {
  const session = await getServerSession(authOptions);

  if (!session || !session.user || !(session.user as any).id) {
    redirect('/api/auth/signin?callbackUrl=/my-goals'); // Redirect to sign-in if not authenticated
  }

  const currentUserId = (session.user as any).id;

  const userGoals = await prisma.goal.findMany({
    where: {
      authorId: currentUserId,
    },
    orderBy: [
      { status: 'asc' }, // Show ACTIVE first, then COMPLETED, then FAILED
      { deadline: 'asc' },
    ],
    include: {
      author: { select: { name: true, image: true } }, // Though for "my goals", author is always self
      elseActions: {
        orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }],
        include: {
          suggester: { select: { name: true, image: true } },
        },
      },
    },
  });

  // Calculate effective status and chosen action for each goal
  const processedGoals = userGoals.map(goal => {
    let effectiveStatus = goal.status;
    const isPastDeadline = new Date() > new Date(goal.deadline);
    if (goal.status === GoalStatus.ACTIVE && isPastDeadline) {
      effectiveStatus = GoalStatus.FAILED;
    }

    let chosenElseAction: ElseActionWithSuggester | null = null;
    if (effectiveStatus === GoalStatus.FAILED && goal.elseActions.length > 0) {
      chosenElseAction = goal.elseActions[0];
    }
    return { ...goal, effectiveStatus, chosenElseAction };
  });
  
  const newGoalButtonClass = `
    inline-flex items-center justify-center font-medium 
    px-8 py-3 rounded-[36px] 
    shadow-lg hover:shadow-xl active:shadow-md
    bg-[#C8102E] text-raycast-white
    hover:bg-[#B00E28] active:bg-[#9A0C22]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-raycast-black
    transition-all duration-200 ease-in-out
  `;
  const pageTitleClasses = "text-4xl lg:text-5xl font-display font-bold text-[#E2E8F0] mb-2 tracking-tight"; // Using Raycast White

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h1 className={pageTitleClasses}>
          My Goals
        </h1>
        <Link href="/goal/new" className={newGoalButtonClass}>
          Set New Goal
        </Link>
      </div>

      {processedGoals.length === 0 && (
        <div className="text-center py-16 bg-[#1A1A1A]/50 rounded-[36px] shadow-xl border border-[#333333]/50">
          <h2 className="text-2xl font-display text-[#E2E8F0] mb-3">No goals set yet!</h2>
          <p className="text-[#A0AEC0] mb-6">Ready to challenge yourself? Set your first goal now.</p>
          <Link href="/goal/new" className={newGoalButtonClass}>
            Set Your First Goal
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {processedGoals.map((goal) => (
          <UserGoalCard 
            key={goal.id} 
            goal={goal} 
            effectiveStatus={goal.effectiveStatus}
            chosenElseAction={goal.chosenElseAction}
          />
        ))}
      </div>
    </div>
  );
}