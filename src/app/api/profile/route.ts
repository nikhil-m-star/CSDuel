import { auth } from "@clerk/nextjs/server";
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { buildProfilePayload } from "@/lib/stats";

export async function GET() {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({ where: { clerkId } });
    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const rooms = await prisma.room.findMany({
      where: {
        players: {
          some: {
            userId: user.id,
          },
        },
      },
      include: {
        players: {
          include: {
            user: true,
          },
        },
        questions: {
          select: {
            id: true,
          },
        },
        answers: {
          select: {
            id: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(buildProfilePayload(rooms, user.id));
  } catch (error) {
    console.error("Profile stats error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
