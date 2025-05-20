// app/my-goals/page.tsx
import prisma from '@/src/lib/prisma';
import { Goal, GoalStatus, ElseAction /*, User */ } from '@prisma/client'; // Removed 'User' as it's not directly used for type annotation here
import Link from 'next/link';
import { getServerSession } from 'next-auth/next';
import { Session } from 'next-auth'; // Import Session type from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { redirect } from 'next/navigation';
import SubscribeButton from '@/src/components/SubscibeButton'; // Corrected from SubscibeButton

const formatDate = (dateString: Date | string, options?: Intl.DateTimeFormatOptions): string => {
  const date = new Date(dateString);
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric', month: 'long', day: 'numeric',
    hour: '2-digit', minute: '2-digit',
  };
  return new Intl.DateTimeFormat('en-US', { ...defaultOptions, ...options }).format(date);
};

type ElseActionWithSuggester = ElseAction & {
  suggester: { name: string | null; image: string | null };
};

// The 'Goal' type imported from @prisma/client already includes 'author' and 'elseActions'
// if they are included in the Prisma query. So, this more specific type might not be strictly necessary
// unless you are adding properties not directly from the Prisma model.
// For clarity, we can ensure the included relations are typed if needed.
type GoalWithRelations = Goal & {
  author: { name: string | null; image: string | null }; // Prisma include handles this shape
  elseActions: ElseActionWithSuggester[];              // Prisma include handles this shape
};

interface UserGoalCardProps {
  goal: GoalWithRelations; // Use the more descriptive type
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
    case GoalStatus.ACTIVE: statusBadgeColor = "bg-sky-700 text-sky-100"; break;
    case GoalStatus.COMPLETED: statusBadgeColor = "bg-green-700 text-green-100"; break;
    case GoalStatus.FAILED: statusBadgeColor = "bg-red-700 text-red-100"; break;
    default: statusBadgeColor = "bg-gray-700 text-gray-100";
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
                Consequence: &quot;{chosenElseAction.suggestion.substring(0,30)}...&quot; {/* Escaped quotes */}
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
  const session: Session | null = await getServerSession(authOptions); // Typed session

  // Rely on augmented Session type which includes user.id
  if (!session || !session.user || !session.user.id) {
    redirect('/api/auth/signin?callbackUrl=/my-goals');
  }

  const currentUserId = session.user.id; // Type-safe

  const dbUser = await prisma.user.findUnique({ // Renamed to dbUser to avoid conflict if 'User' type was imported
    where: { id: currentUserId },
    select: {
      subscriptionStatus: true,
    }
  });

  const userGoals = await prisma.goal.findMany({
    where: { authorId: currentUserId, },
    orderBy: [ { status: 'asc' }, { deadline: 'asc' }, ],
    include: {
      author: { select: { name: true, image: true } },
      elseActions: {
        orderBy: [{ voteCount: 'desc' }, { createdAt: 'asc' }],
        include: { suggester: { select: { name: true, image: true } } },
      },
    },
  });

  const processedGoals = userGoals.map(goal => {
    let effectiveStatus: GoalStatus = goal.status; // Explicitly type
    const isPastDeadline = new Date() > new Date(goal.deadline);
    if (goal.status === GoalStatus.ACTIVE && isPastDeadline) {
      effectiveStatus = GoalStatus.FAILED;
    }

    let chosenElseAction: ElseActionWithSuggester | null = null;
    if (effectiveStatus === GoalStatus.FAILED && goal.elseActions.length > 0) {
      chosenElseAction = goal.elseActions[0] as ElseActionWithSuggester; // Cast if necessary
    }
    return { ...goal, effectiveStatus, chosenElseAction };
  });
  
  const newGoalButtonClass = `
    inline-flex items-center justify-center font-medium 
    px-8 py-3 rounded-[36px] 
    shadow-lg hover:shadow-xl active:shadow-md
    bg-[#C8102E] text-[#E2E8F0] /* text-raycast-white -> direct hex */
    hover:bg-[#B00E28] active:bg-[#9A0C22]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-[#121212] /* ring-offset-raycast-black -> direct hex */
    transition-all duration-200 ease-in-out
  `;
  const pageTitleClasses = "text-4xl lg:text-5xl font-display font-bold text-[#E2E8F0] mb-2 tracking-tight";
  const placeholderCardClasses = "text-center py-16 bg-[#1A1A1A]/50 rounded-[36px] shadow-xl border border-[#333333]/50";

  const STRIPE_PRICE_ID = process.env.STRIPE_YOUR_PRODUCT_PRICE_ID || "YOUR_TEST_PRICE_ID_HERE"; 
  if (STRIPE_PRICE_ID === "YOUR_TEST_PRICE_ID_HERE" && process.env.NODE_ENV !== "development") {
      console.warn("WARNING: Stripe Price ID is not set correctly for production!");
  }

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h1 className={pageTitleClasses}>My Goals</h1>
        <Link href="/goal/new" className={newGoalButtonClass}>Set New Goal</Link>
      </div>

      {(!dbUser?.subscriptionStatus || dbUser.subscriptionStatus !== 'active') && (
        <section className="mb-12 p-6 sm:p-8 rounded-[36px] bg-[#1f1f23] border border-[#C8102E]/50 shadow-2xl text-center">
          <h2 className="text-2xl lg:text-3xl font-display font-bold text-[#C8102E] mb-3">
            Unlock Full Potential!
          </h2>
          <p className="text-[#A0AEC0] mb-6 max-w-md mx-auto">
            Get unlimited goal posts, suggestions, and votes by subscribing to OrElse Pro.
            Just $3/month to supercharge your accountability!
          </p>
          <SubscribeButton 
            priceId={STRIPE_PRICE_ID} 
            currentSubscriptionStatus={dbUser?.subscriptionStatus}
            buttonText="Go Pro - $3/month"
          />
        </section>
      )}
      {dbUser?.subscriptionStatus === 'active' && (
         <div className="mb-10 text-center p-4 rounded-md bg-green-800/30 border border-green-600">
            <p className="font-semibold text-green-400">OrElse Pro Activated!</p>
         </div>
      )}

      {processedGoals.length === 0 && (
        <div className={placeholderCardClasses}>
          <h2 className="text-2xl font-display text-[#E2E8F0] mb-3">Your goal slate is clean!</h2>
          <p className="text-[#A0AEC0] mb-6">What amazing feat will you conquer next?</p>
          <Link href="/goal/new" className={newGoalButtonClass}>Set Your First Goal</Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {processedGoals.map((goal) => (
          <UserGoalCard 
            key={goal.id} 
            goal={goal as GoalWithRelations} // Cast goal to GoalWithRelations
            effectiveStatus={goal.effectiveStatus}
            chosenElseAction={goal.chosenElseAction}
          />
        ))}
      </div>
    </div>
  );
}