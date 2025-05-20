// app/api/goal/[goalId]/route.ts
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth'; // Import Session type directly from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoalStatus } from '@prisma/client';

const updateGoalStatusSchema = z.object({
  status: z.literal(GoalStatus.COMPLETED),
});

interface RouteContext {
  params: {
    goalId: string;
  };
}

// The module augmentation in your authOptions file should make session.user.id available
// So, we might not need a separate SessionWithId interface here if the augmentation is global.
// However, to be explicit within this file, you can keep it or rely on the global augmentation.

export async function PATCH(request: Request, context: RouteContext) {
  try {
    // getServerSession returns the Session type, which should be augmented
    const session: Session | null = await getServerSession(authOptions);
    const goalId = context.params.goalId;

    // The 'id' should be available on session.user due to module augmentation in authOptions
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated or user ID missing' }, { status: 401 });
    }

    const currentUserId = session.user.id; // Now type-safe due to global augmentation
    const body = await request.json();

    const validation = updateGoalStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input for status update.', issues: validation.error.issues }, { status: 400 });
    }

    const { status: newStatus } = validation.data;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { authorId: true, status: true, deadline: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
    }

    if (goal.authorId !== currentUserId) {
      return NextResponse.json({ error: 'You are not authorized to update this goal.' }, { status: 403 });
    }

    if (goal.status !== GoalStatus.ACTIVE) {
      return NextResponse.json({ error: `Goal is not active. Current status: ${goal.status}` }, { status: 400 });
    }

    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: newStatus,
      },
    });

    return NextResponse.json(updatedGoal, { status: 200 });

  } catch (error: unknown) {
    console.error(`Error updating goal ${context.params.goalId}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `An error occurred while updating the goal: ${message}` }, { status: 500 });
  }
}