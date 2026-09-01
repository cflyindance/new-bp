const ACTIVE_TRANSFORMS = {
  zoom: 'scale(1)',
  rotate: 'rotate(0deg)',
  bounce: 'translateY(0)',
  flip: 'scaleX(1)',
};

const INACTIVE_TRANSFORMS = {
  zoom: 'scale(0.8)',
  rotate: 'rotate(180deg)',
  bounce: 'translateY(20px)',
  flip: 'scaleX(-1)',
};

export const getScreenSaverImageTransitionStyle = ({
  effect,
  index,
  currentIndex,
  imageCount,
}) => {
  const isActive = currentIndex === index;

  if (effect === 'slide') {
    const previousIndex =
      imageCount > 1 ? (currentIndex - 1 + imageCount) % imageCount : -1;
    const isPrevious = index === previousIndex;

    return {
      opacity: 1,
      transform: isActive
        ? 'translateX(0)'
        : isPrevious
          ? 'translateX(-100%)'
          : 'translateX(100%)',
      zIndex: isActive || isPrevious ? 1 : 0,
    };
  }

  return {
    opacity: isActive ? 1 : 0,
    transform: isActive
      ? ACTIVE_TRANSFORMS[effect] || 'none'
      : INACTIVE_TRANSFORMS[effect] || 'none',
    zIndex: isActive ? 1 : 0,
  };
};
