let preloadPromise = null;

export const preloadOrderPageAssets = () => {
  if (preloadPromise) return preloadPromise;

  preloadPromise = Promise.all([
    import('@/container/orderPage'),
    import('@/container/orderPage/categoryList'),
    import('@/container/orderPage/currentItemList'),
  ]).catch((error) => {
    preloadPromise = null;
    if (process.env.NODE_ENV !== 'production') {
      console.warn('Failed to preload order page assets:', error);
    }
  });

  return preloadPromise;
};
