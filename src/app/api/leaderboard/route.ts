import { auth } from "@clerk/nextjs/server";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { userId: clerkId } = await auth();
    if (!clerkId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const topic = req.nextUrl.searchParams.get("topic");

    // Build base where clause for completed rooms
    const roomWhere = topic
      ? { status: "COMPLETED" as const, topic }
      : { status: "COMPLETED" as const };

    // Get all users with their stats
    const users = await prisma.user.findMany({
      include: {
        roomPlayers: {
          where: {
            room: roomWhere,
          },
          include: {
            room: {
              include: {
                players: {
                  include: { user: true },
                  orderBy: { score: "desc" as const },
                },
              },
            },
          },
        },
      },
    });

    const leaderboard = users
      .map((user) => {
        const totalDuels = user.roomPlayers.length;
        if (totalDuels === 0) return null;

        let wins = 0;
        let totalScore = 0;

        user.roomPlayers.forEach((rp) => {
          totalScore += rp.score;
          const topPlayer = rp.room.players[0];
          if (topPlayer && topPlayer.userId === user.id && rp.room.players.length > 1) {
            wins++;
          }
        });

        const winRate = totalDuels > 0 ? (wins / totalDuels) * 100 : 0;

        return {
          id: user.id,
          username: user.username,
          imageUrl: user.imageUrl,
          totalDuels,
          wins,
          losses: totalDuels - wins,
          winRate: Math.round(winRate * 10) / 10,
          totalScore,
        };
      })
      .filter(Boolean)
      .sort((a, b) => {
        if (!a || !b) return 0;
        // Sort by win rate first, then total score
        if (b.winRate !== a.winRate) return b.winRate - a.winRate;
        return b.totalScore - a.totalScore;
      });

    return NextResponse.json(leaderboard);
  } catch (error) {
    console.error("Leaderboard error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
