// app/api/goals/route.ts
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/app/api/auth/[...nextauth]/route'; // Path to your NextAuth options
import prisma from '@/src/lib/prisma'; // Path to your Prisma client instance
import { NextResponse } from 'next/server';
import { z } from 'zod'; // For input validation

// Define the expected shape of the request body using Zod
const createGoalSchema = z.object({
  description: z.string().min(1, "Description cannot be empty.").max(1000, "Description is too long."),
  deadline: z.string().datetime({ message: "Invalid deadline format. Must be ISO 8601." }), // Expecting ISO 8601 string from client
  isPublic: z.boolean().optional().default(true),
});

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || !session.user || !(session.user as any).id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    const userId = (session.user as any).id;
    const body = await request.json();

    // Validate the request body
    const validation = createGoalSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json({ error: 'Invalid input.', issues: validation.error.issues }, { status: 400 });
    }

    const { description, deadline, isPublic } = validation.data;

    // Convert deadline string to Date object
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

    return NextResponse.json(newGoal, { status: 201 }); // 201 Created

  } catch (error) {
    console.error('Error creating goal:', error);
    if (error instanceof z.ZodError) { // Should be caught by safeParse, but as a fallback
        return NextResponse.json({ error: 'Invalid input.', issues: error.issues }, { status: 400 });
    }
    return NextResponse.json({ error: 'An error occurred while creating the goal.' }, { status: 500 });
  }
}