export function generateRoomCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export function calculateScore(isCorrect: boolean, timeTaken: number): number {
  if (!isCorrect) return 0;
  const normalizedSpeed = Math.max(0, 1 - timeTaken / 30);
  const baseScore = 5;
  const speedBonus = Math.round(20 * normalizedSpeed * normalizedSpeed);
  const urgencyBonus = timeTaken <= 5 ? 5 : timeTaken <= 10 ? 2 : 0;
  return baseScore + speedBonus + urgencyBonus;
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}:${secs.toString().padStart(2, "0")}`;
}

export function cn(...classes: (string | boolean | undefined | null)[]): string {
  return classes.filter(Boolean).join(" ");
}
