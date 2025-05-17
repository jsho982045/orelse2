// app/api/suggestions/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

const createSuggestionSchema = z.object({
  goalId: z.string().cuid({ message: "Invalid Goal ID." }),
  suggestion: z.string().min(1, "Suggestion cannot be empty.").max(500, "Suggestion is too long (max 500 characters)."),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const suggesterId = (session.user as any).id;
    const body = await request.json();

    const validation = createSuggestionSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { goalId, suggestion } = validation.data;

    // Check if the goal exists and if the suggester is not the author of the goal
    const goal = await prisma.goal.findUnique({
      where: { id: goalId },
      select: { authorId: true, status: true }, // Select only what's needed
    });

    if (!goal) {
      return NextResponse.json({ error: 'Goal not found.' }, { status: 404 });
    }

    if (goal.authorId === suggesterId) {
      return NextResponse.json({ error: "You cannot make 'Or Else' suggestions for your own goal." }, { status: 403 }); // 403 Forbidden
    }
    
    // Optional: Prevent suggestions on goals that are not ACTIVE
    if (goal.status !== 'ACTIVE') {
        return NextResponse.json({ error: 'Suggestions can only be made for active goals.' }, { status: 400 });
    }

    const newSuggestion = await prisma.elseAction.create({
      data: {
        suggestion,
        goalId,
        suggesterId,
        // isMalicious and isChosen will default to false
        // voteCount will default to 0
      },
      include: { // Optionally include related data if needed by the client immediately
        suggester: {
            select: { name: true, image: true }
        }
      }
    });

    return NextResponse.json(newSuggestion, { status: 201 });

  } catch (error) {
    console.error('Error creating suggestion:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'An error occurred while creating the suggestion.' }, { status: 500 });
  }
}