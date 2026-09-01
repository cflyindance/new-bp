import React, { useEffect } from 'react';

const useCloseModalOnHomePage = (onCloseFn) => {
  const handleLocationChange = () => {
    if (window.location.hash === '#/') {
      onCloseFn?.();
    }
  };

  useEffect(() => {
    window.addEventListener('popstate', handleLocationChange);
    return () => {
      window.removeEventListener('popstate', handleLocationChange);
    };
  }, []);
};

export default useCloseModalOnHomePage;
