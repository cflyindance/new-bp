const remToPxRate =
  Number(
    (document.documentElement.style.fontSize || '62.5%').replace('%', '')
  ) / 100;

const remToPx = (rem) => {
  const userAgent = window.navigator.userAgent;
  const isIos = !!userAgent.match(/\(i[^;]+;( U;)? CPU.+Mac OS X/);
  if (isIos) {
    return (
      rem *
      Number(
        getComputedStyle(document.documentElement).fontSize.replace('px', '')
      )
    );
  }
  return Math.round(rem * 16 * remToPxRate);
};

export default remToPx;
