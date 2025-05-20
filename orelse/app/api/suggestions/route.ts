// app/api/suggestions/route.ts
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth'; // Import Session type
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GoalStatus } from '@prisma/client';

const createSuggestionSchema = z.object({
  goalId: z.string().cuid({ message: "Invalid Goal ID." }),
  suggestion: z.string().min(1, "Suggestion cannot be empty.").max(500, "Suggestion is too long (max 500 characters)."),
});

export async function POST(request: Request) {
  try {
    const session: Session | null = await getServerSession(authOptions); // Typed session

    // Use augmented session.user.id which should be string | null | undefined
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated or user ID missing' }, { status: 401 });
    }

    const suggesterId = session.user.id; // Type-safe
    const body = await request.json();

    const validation = createSuggestionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { goalId, suggestion } = validation.data;

    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { authorId: true, status: true },
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
    }

    if (goal.authorId === suggesterId) {
      return NextResponse.json({ error: "You cannot make 'Or Else' suggestions for your own goal." }, { status: 403 });
    }
    
    if (goal.status !== GoalStatus.ACTIVE) {
        return NextResponse.json({ error: 'Suggestions can only be made for active goals.' }, { status: 400 });
    }

    const newSuggestion = await prisma.elseAction.create({
      data: {
        suggestion,
        goalId,
        suggesterId,
      },
      include: {
        suggester: {
            select: { name: true, image: true }
        }
      }
    });

    return NextResponse.json(newSuggestion, { status: 201 });

  } catch (error: unknown) { // Typed error as unknown
    console.error('Error creating suggestion:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    const message = error instanceof Error ? error.message : "An unknown error occurred";
    return NextResponse.json({ error: `An error occurred while creating the suggestion: ${message}` }, { status: 500 });
  }
}