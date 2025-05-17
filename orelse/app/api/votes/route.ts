// app/api/votes/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const castVoteSchema = z.object({
  elseActionId: z.string().cuid({ message: "Invalid ElseAction ID." }),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const voterId = (session.user as any).id;
    const body = await request.json();

    const validation = castVoteSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { elseActionId } = validation.data;

    // Check if the ElseAction exists and its parent Goal is active
    const elseAction = await prisma.elseAction.findUnique({
      where: { id: elseActionId },
      select: { 
        goalId: true,
        goal: { select: { status: true, authorId: true } } // Also fetch goal's authorId
      },
    });

    if (!elseAction) {
      return NextResponse.json({ error: 'Suggestion not found.' }, { status: 404 });
    }

    if (elseAction.goal.status !== 'ACTIVE') {
      return NextResponse.json({ error: 'Voting is only allowed on suggestions for active goals.' }, { status: 400 });
    }

    // Optional: Prevent goal author from voting on suggestions for their own goal
    // if (elseAction.goal.authorId === voterId) {
    //   return NextResponse.json({ error: "You cannot vote on suggestions for your own goal." }, { status: 403 });
    // }

    // Perform the vote creation and voteCount update in a transaction
    const result = await prisma.$transaction(async (tx) => {
      // 1. Attempt to create the vote
      // This will fail if the unique constraint (userId, elseActionId) is violated (user already voted)
      const newVote = await tx.userElseActionVote.create({
        data: {
          userId: voterId,
          elseActionId: elseActionId,
        },
      });

      // 2. If vote creation was successful, increment the voteCount on the ElseAction
      const updatedElseAction = await tx.elseAction.update({
        where: { id: elseActionId },
        data: {
          voteCount: {
            increment: 1,
          },
        },
        select: { voteCount: true } // Only select the new vote count
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

  } catch (error: any) {
    console.error('Error casting vote:', error);
    if (error.code === 'P2002' && error.meta?.target?.includes('userId') && error.meta?.target?.includes('elseActionId')) {
      // Unique constraint violation (user already voted for this suggestion)
      return NextResponse.json({ error: 'You have already voted for this suggestion.' }, { status: 409 }); // 409 Conflict
    }
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'An error occurred while casting the vote.' }, { status: 500 });
  }
}