import { getResolvedRoomStatus, isRoomEffectivelyCompleted } from "@/lib/room-completion";

type RoomStatsPlayer = {
  score: number;
  user: {
    id: string;
    username: string;
    imageUrl?: string | null;
  };
};

type RoomStatsRecord = {
  id: string;
  code: string;
  topic: string;
  status: string;
  createdAt: Date;
  players: RoomStatsPlayer[];
  questions: Array<{ id: string }>;
  answers: Array<{ id: string }>;
};

type TopicSummary = {
  totalScore: number;
  duels: number;
};

function sortPlayers(players: RoomStatsPlayer[]): RoomStatsPlayer[] {
  return [...players].sort((a, b) => b.score - a.score || a.user.id.localeCompare(b.user.id));
}

function getWinnerIds(players: RoomStatsPlayer[]): string[] {
  const sortedPlayers = sortPlayers(players);
  const winnerScore = sortedPlayers[0]?.score;

  if (typeof winnerScore !== "number") {
    return [];
  }

  return sortedPlayers
    .filter((player) => player.score === winnerScore)
    .map((player) => player.user.id);
}

function getStrongestAndWeakestTopics(topicStats: Map<string, TopicSummary>) {
  if (topicStats.size === 0) {
    return { strongestTopic: "N/A", weakestTopic: "N/A" };
  }

  let strongestTopic = "N/A";
  let weakestTopic = "N/A";
  let bestAverage = -Infinity;
  let worstAverage = Infinity;

  for (const [topic, summary] of topicStats) {
    const averageScore = summary.totalScore / summary.duels;

    if (averageScore > bestAverage) {
      bestAverage = averageScore;
      strongestTopic = topic;
    }

    if (averageScore < worstAverage) {
      worstAverage = averageScore;
      weakestTopic = topic;
    }
  }

  return { strongestTopic, weakestTopic };
}

export function buildLeaderboardEntries(rooms: RoomStatsRecord[]) {
  const leaderboardMap = new Map<
    string,
    {
      id: string;
      username: string;
      imageUrl?: string | null;
      totalDuels: number;
      wins: number;
      totalScore: number;
    }
  >();

  for (const room of rooms) {
    if (!isRoomEffectivelyCompleted(room) || room.players.length < 2) {
      continue;
    }

    const winnerIds = getWinnerIds(room.players);

    for (const player of room.players) {
      const entry = leaderboardMap.get(player.user.id) ?? {
        id: player.user.id,
        username: player.user.username,
        imageUrl: player.user.imageUrl ?? null,
        totalDuels: 0,
        wins: 0,
        totalScore: 0,
      };

      entry.totalDuels += 1;
      entry.totalScore += player.score;
      if (winnerIds.length === 1 && winnerIds[0] === player.user.id) {
        entry.wins += 1;
      }

      leaderboardMap.set(player.user.id, entry);
    }
  }

  return Array.from(leaderboardMap.values())
    .map((entry) => {
      const winRate = entry.totalDuels > 0 ? (entry.wins / entry.totalDuels) * 100 : 0;

      return {
        ...entry,
        losses: entry.totalDuels - entry.wins,
        winRate: Math.round(winRate * 10) / 10,
      };
    })
    .sort((a, b) => {
      if (b.winRate !== a.winRate) {
        return b.winRate - a.winRate;
      }

      if (b.wins !== a.wins) {
        return b.wins - a.wins;
      }

      return b.totalScore - a.totalScore;
    });
}

export function buildProfilePayload(rooms: RoomStatsRecord[], userId: string) {
  const completedRooms = rooms.filter(
    (room) => isRoomEffectivelyCompleted(room) && room.players.some((player) => player.user.id === userId)
  );
  const topicStats = new Map<string, TopicSummary>();
  let wins = 0;
  let losses = 0;
  let totalScore = 0;

  const history = completedRooms.map((room) => {
    const sortedPlayers = sortPlayers(room.players);
    const winnerIds = getWinnerIds(room.players);
    const myPlayer = room.players.find((player) => player.user.id === userId);
    const opponent = room.players.find((player) => player.user.id !== userId);

    if (!myPlayer) {
      return null;
    }

    totalScore += myPlayer.score;

    if (winnerIds.length === 1 && winnerIds[0] === userId) {
      wins += 1;
    } else if (opponent && opponent.score > myPlayer.score) {
      losses += 1;
    }

    const topicSummary = topicStats.get(room.topic) ?? { totalScore: 0, duels: 0 };
    topicSummary.totalScore += myPlayer.score;
    topicSummary.duels += 1;
    topicStats.set(room.topic, topicSummary);

    return {
      id: room.id,
      code: room.code,
      topic: room.topic,
      status: getResolvedRoomStatus(room),
      createdAt: room.createdAt.toISOString(),
      result:
        !opponent || myPlayer.score === opponent.score
          ? "DRAW"
          : myPlayer.score > opponent.score
            ? "WIN"
            : "LOSS",
      players: sortedPlayers.map((player) => ({
        score: player.score,
        user: {
          id: player.user.id,
          username: player.user.username,
        },
      })),
    };
  }).filter(Boolean);

  const { strongestTopic, weakestTopic } = getStrongestAndWeakestTopics(topicStats);
  const totalDuels = completedRooms.length;

  return {
    stats: {
      totalDuels,
      wins,
      losses,
      winRate: totalDuels > 0 ? Math.round((wins / totalDuels) * 1000) / 10 : 0,
      totalScore,
      strongestTopic,
      weakestTopic,
    },
    history,
  };
}
