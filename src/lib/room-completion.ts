type CompletionRoom = {
  status: string;
  players: Array<unknown>;
  questions: Array<unknown>;
  answers: Array<unknown>;
};

const REQUIRED_QUESTION_COUNT = 10;

export function isRoomEffectivelyCompleted(room: CompletionRoom): boolean {
  if (room.status === "COMPLETED") {
    return true;
  }

  const playerCount = room.players.length;
  const questionCount = room.questions.length;

  return (
    playerCount >= 2 &&
    questionCount >= REQUIRED_QUESTION_COUNT &&
    room.answers.length >= playerCount * questionCount
  );
}

export function getResolvedRoomStatus<T extends CompletionRoom>(
  room: T
): T["status"] | "COMPLETED" {
  return isRoomEffectivelyCompleted(room) ? "COMPLETED" : room.status;
}
