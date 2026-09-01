export const TRIPOS_CARD_INPUT_MODE = {
  INSERT_SWIPE_TAP_CARD: 'InsertSwipeTapCard',
  INSERT_SWIPE_CARD: 'InsertSwipeCard',
  SWIPE_TAP_CARD: 'SwipeTapCard',
  SWIPE_CARD: 'SwipeCard',
};

const CARD_INPUT_CAPABILITIES = {
  [TRIPOS_CARD_INPUT_MODE.INSERT_SWIPE_TAP_CARD]: ['insert', 'swipe', 'tap'],
  [TRIPOS_CARD_INPUT_MODE.INSERT_SWIPE_CARD]: ['insert', 'swipe'],
  [TRIPOS_CARD_INPUT_MODE.SWIPE_TAP_CARD]: ['swipe', 'tap'],
  [TRIPOS_CARD_INPUT_MODE.SWIPE_CARD]: ['swipe'],
};

export function isTriposCardInputMode(mode) {
  return Object.prototype.hasOwnProperty.call(CARD_INPUT_CAPABILITIES, mode);
}

export function hasMoreCardInputCapabilities(previousMode, nextMode) {
  const previousCapabilities = CARD_INPUT_CAPABILITIES[previousMode];
  const nextCapabilities = CARD_INPUT_CAPABILITIES[nextMode];
  if (!previousCapabilities || !nextCapabilities) {
    return false;
  }

  return (
    nextCapabilities.length > previousCapabilities.length &&
    previousCapabilities.every((capability) =>
      nextCapabilities.includes(capability)
    )
  );
}
