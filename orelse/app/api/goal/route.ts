// app/api/goal/route.ts
import { getServerSession } from 'next-auth/next';
import type { Session } from 'next-auth'; // Import Session type directly from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import prisma from '@/src/lib/prisma';
import { NextResponse } from 'next/server';
import { z } from 'zod';

// Define the expected shape of the request body using Zod
const createGoalSchema = z.object({
  description: z.string().min(1, "Description cannot be empty.").max(1000, "Description is too long."),
  deadline: z.string().datetime({ message: "Invalid deadline format. Must be ISO 8601." }),
  isPublic: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    // getServerSession returns the Session type, which should be augmented
    const session: Session | null = await getServerSession(authOptions);

    // The 'id' should be available on session.user due to module augmentation
    if (!session || !session.user || !session.user.id) {
      return NextResponse.json({ error: 'Not authenticated or user ID missing' }, { status: 401 });
    }

    const userId = session.user.id; // Now type-safe
    const body = await request.json();

    const validation = createGoalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { description, deadline, isPublic } = validation.data;
    const deadlineDate = new Date(deadline);

    const newGoal = await prisma.goal.create({
      data: {
        description,
        deadline: deadlineDate,
        isPublic,
        authorId: userId,
        // status will default to ACTIVE as per schema
      },
    });

    return NextResponse.json(newGoal, { status: 201 });

  } catch (error: unknown) { // Use 'unknown' for the catch block error
    console.error('Error creating goal:', error);
    if (error instanceof z.ZodError) {
        return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    // Create a more specific error message
    const message = error instanceof Error ? error.message : 'An unknown error occurred.';
    return NextResponse.json({ error: `An error occurred while creating the goal: ${message}` }, { status: 500 });
  }
}