"use client";

import {
  RomanticLock,
  type LockDefinition,
} from "@/components/romantic-lock";

const LOCKS: LockDefinition[] = [
  { id: 1, xPercent: 19, yPercent: 52, widthPercent: 17, rotation: -7 },
  { id: 2, xPercent: 34.5, yPercent: 48, widthPercent: 16, rotation: 4 },
  { id: 3, xPercent: 50, yPercent: 53, widthPercent: 17, rotation: -2 },
  { id: 4, xPercent: 65.5, yPercent: 48.5, widthPercent: 16, rotation: 5 },
  { id: 5, xPercent: 81, yPercent: 51.5, widthPercent: 17, rotation: -5 },
];

type LockLayerProps = {
  openedCount: number;
  openingLockIndex: number | null;
};

export function LockLayer({
  openedCount,
  openingLockIndex,
}: LockLayerProps) {
  return (
    <div className="absolute inset-0" data-testid="lock-layer">
      {LOCKS.map((lock, index) => (
        <RomanticLock
          key={lock.id}
          lock={lock}
          opening={openingLockIndex === index}
          visible={index >= openedCount || openingLockIndex === index}
        />
      ))}
    </div>
  );
}
