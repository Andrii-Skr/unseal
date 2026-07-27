const MESSAGE_STAGGER_SECONDS = 0.85;
const MESSAGE_REVEAL_SECONDS = 0.8;
const MAX_STAGGERED_MESSAGE_INDEX = 6;

export function messageRevealDelay(index: number) {
  return Math.min(Math.max(index, 0), MAX_STAGGERED_MESSAGE_INDEX) *
    MESSAGE_STAGGER_SECONDS;
}

export function signatureRevealDelay(blockCount: number) {
  if (blockCount <= 0) return 0;
  return messageRevealDelay(blockCount - 1) + MESSAGE_REVEAL_SECONDS;
}

export const MAX_MESSAGE_SEQUENCE_SECONDS =
  messageRevealDelay(Number.POSITIVE_INFINITY) + MESSAGE_REVEAL_SECONDS * 2;
