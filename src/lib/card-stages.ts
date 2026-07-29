export type CardStage =
  | "intro"
  | "lock-1-opened"
  | "lock-2-opened"
  | "lock-3-opened"
  | "lock-4-opened"
  | "all-locks-opened"
  | "entering-heart"
  | "inside-heart"
  | "final-message";

export const PREVIEW_STAGES: CardStage[] = [
  "intro",
  "lock-1-opened",
  "lock-2-opened",
  "lock-3-opened",
  "lock-4-opened",
  "all-locks-opened",
  "inside-heart",
  "final-message",
];

const OPENED_LOCKS: Record<CardStage, number> = {
  intro: 0,
  "lock-1-opened": 1,
  "lock-2-opened": 2,
  "lock-3-opened": 3,
  "lock-4-opened": 4,
  "all-locks-opened": 5,
  "entering-heart": 5,
  "inside-heart": 5,
  "final-message": 5,
};

export function openedLockCount(stage: CardStage) {
  return OPENED_LOCKS[stage];
}

export function stageAfterOpening(lockIndex: number): CardStage {
  const stages: CardStage[] = [
    "lock-1-opened",
    "lock-2-opened",
    "lock-3-opened",
    "lock-4-opened",
    "all-locks-opened",
  ];

  return stages[lockIndex] ?? "all-locks-opened";
}
