// app/api/goal/[goalId]/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoalStatus } from '@prisma/client'; // Import GoalStatus enum

// Schema for updating goal status (specifically to COMPLETED for now)
const updateGoalStatusSchema = z.object({
  status: z.literal(GoalStatus.COMPLETED), // Only allow setting to COMPLETED via this specific action
});

interface RouteContext {
  params: {
    goalId: string;
  };
}

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getServerSession(authOptions);
    const { goalId } = context.params;

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const currentUserId = (session.user as any).id;
    const body = await request.json();

    const validation = updateGoalStatusSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input for status update.', issues: validation.error.issues }, { status: 400 });
    }

    const { status: newStatus } = validation.data; // Should be 'COMPLETED'

    // Fetch the goal to ensure it exists and the current user is the author
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
    
    // Optional: Check if deadline has passed for marking as COMPLETED
    // For now, we allow marking complete even if deadline passed, assuming user did it but marked late.
    // if (newStatus === GoalStatus.COMPLETED && new Date() > new Date(goal.deadline)) {
    //   // This logic can be complex: did they complete it ON TIME?
    //   // For MVP, let them mark it complete. The "Failed" status will be for when deadline passes AND it's not completed.
    // }


    const updatedGoal = await prisma.goal.update({
      where: { id: goalId },
      data: {
        status: newStatus, // Set to COMPLETED
      },
    });

    return NextResponse.json(updatedGoal, { status: 200 });

  } catch (error) {
    console.error(`Error updating goal ${context.params.goalId}:`, error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'An error occurred while updating the goal.' }, { status: 500 });
  }
}