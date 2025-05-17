// app/page.tsx
import prisma from '@/src/lib/prisma';
import { Goal } from '@prisma/client';
import Link from 'next/link';

const formatDate = (dateString: Date | string): string => {
  const date = new Date(dateString);
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
};

interface GoalCardProps {
  goal: Goal;
}

function GoalCard({ goal }: GoalCardProps) {
  // Dark Mode Focused Card Styling
  const cardClasses = `
    flex flex-col 
    rounded-[36px] 
    transition-all duration-300 ease-in-out
    hover:shadow-2xl hover:-translate-y-1 
    overflow-hidden 
    bg-[#1A1A1A]/80 /* Raycast Grey Dark with opacity for glass effect */
    border border-[#333333]/60 /* Raycast Grey Medium border */
    shadow-2xl /* Prominent shadow */
    supports-[backdrop-filter]:bg-[#1A1A1A]/60 /* Adjust opacity if backdrop filter is supported */
    backdrop-blur-lg
  `;

  const titleClasses = "font-display font-semibold text-xl mb-2 text-[#C8102E]"; // Raycast Red for titles
  const textMutedClasses = "text-xs text-[#A0AEC0]"; // Raycast Grey Light
  const descriptionClasses = "text-sm mb-3 flex-grow text-[#E2E8F0] min-h-[60px]"; // Raycast White

  return (
    <div className={cardClasses}>
      <div className="p-6 flex flex-col h-full">
        <div>
          <h3 className={titleClasses}>
            {goal.description ? (goal.description.substring(0, 50) + (goal.description.length > 50 ? '...' : '')) : 'Untitled Goal'}
          </h3>
          <p className={descriptionClasses}>
            {goal.description || "No description provided."}
          </p>
        </div>
        <div className="mt-auto pt-4 border-t border-[#333333]/70">
          <p className={`${textMutedClasses} mb-1`}>
            Deadline: {formatDate(goal.deadline)}
          </p>
          <p className={`${textMutedClasses} capitalize`}>
            Status: <span className="font-medium">{goal.status.toLowerCase()}</span>
          </p>
        </div>
      </div>
    </div>
  );
}

export default async function HomePage() {
  const goals = await prisma.goal.findMany({
    where: {
      isPublic: true,
    },
    orderBy: {
      deadline: 'desc',
    },
    include: {
      author: {
        select: {
          name: true,
          image: true,
        },
      },
    },
    take: 20,
  });

  // Dark Mode Focused Button Styling
  const newGoalButtonClass = `
    inline-flex items-center justify-center font-medium 
    px-8 py-3 rounded-[36px] 
    shadow-lg hover:shadow-xl active:shadow-md
    bg-[#C8102E] text-raycast-white /* Raycast Red */
    hover:bg-[#B00E28] active:bg-[#9A0C22]
    focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#C8102E] focus:ring-offset-raycast-black
    transition-all duration-200 ease-in-out
  `;

  return (
    <div className="container mx-auto p-4">
      <div className="flex flex-col sm:flex-row justify-between items-center mb-10 gap-4">
        <h1 className="text-4xl lg:text-5xl font-display font-bold text-[#9c9da6]"> 
          Public Goals
        </h1>
        <Link href="/goal/new" className={newGoalButtonClass}>
          Set a New Goal
        </Link>
      </div>

      {goals.length === 0 && (
        <div className="text-center py-10">
          <p className="text-xl text-raycast-grey-light mb-4">
            No public goals yet. Why not?
          </p>
          <Link href="/goal/new" className={newGoalButtonClass}>
            Set Your First Goal
          </Link>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
        {goals.map((goal) => (
           <Link key={goal.id} href={`/goal/${goal.id}`} className="block hover:no-underline focus:outline-none focus:ring-2 focus:ring-[#C8102E] focus:ring-offset-2 focus:ring-offset-raycast-black rounded-[36px]">
            <GoalCard goal={goal} />
          </Link>
        ))}
      </div>
    </div>
  );
}