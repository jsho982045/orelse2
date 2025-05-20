// app/api/votes/route.ts
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth'; // Import Session type
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoalStatus } from '@prisma/client'; // Import GoalStatus

const castVoteSchema = z.object({
  elseActionId: z.string().cuid({ message: "Invalid ElseAction ID." }),
});

export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions); // Typed session

    // Use augmented session.user.id
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated or user ID missing' }, { status: 401 });
    }

    const voterId = session.user.id; // Type-safe
    const body = await request.json();

    const validation = castVoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { elseActionId } = validation.data;

    const elseAction = await prisma.elseAction.findUnique({
      where: { id: elseActionId },
      select: {
        goalId: true,
        goal: { select: { status: true, authorId: true } }
      },
    });

    if (!elseAction) {
      return NextResponse.json({ error: 'Suggestion not found.' }, { status: 404 });
    }

    if (elseAction.goal.status !== GoalStatus.ACTIVE) { // Use imported GoalStatus
      return NextResponse.json({ error: 'Voting is only allowed on suggestions for active goals.' }, { status: 400 });
    }

    // Optional: Prevent goal author from voting (uncomment if needed)
    // if (elseAction.goal.authorId === voterId) {
    //   return NextResponse.json({ error: "You cannot vote on suggestions for your own goal." }, { status: 403 });
    // }

    const result = await prisma.$transaction(async (tx) => {
      const newVote = await tx.userElseActionVote.create({
        data: {
          userId: voterId,
          elseActionId: elseActionId,
        },
      });

      const updatedElseAction = await tx.elseAction.update({
        where: { id: elseActionId },
        data: {
          voteCount: {
            increment: 1,
          },
        },
        select: { voteCount: true }
      });

      return { newVote, updatedVoteCount: updatedElseAction.voteCount };
    });

    return NextResponse.json(
        {
            message: 'Vote cast successfully!',
            vote: result.newVote,
            newVoteCount: result.updatedVoteCount
        },
        { status: 201 }
    );

  } catch (error: unknown) { // Typed error as unknown
    console.error('Error casting vote:', error);

    // Check for Prisma unique constraint violation (P2002)
    if (typeof error === 'object' && error !== null && 'code' in error && error.code === 'P2002') {
      const prismaError = error as { code: string; meta?: { target?: string[] } };
      if (prismaError.meta?.target?.includes('userId') && prismaError.meta?.target?.includes('elseActionId')) {
        return NextResponse.json({ error: 'You have already voted for this suggestion.' }, { status: 409 });
      }
    }
    
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `An error occurred while casting the vote: ${message}` }, { status: 500 });
  }
}