import { useEffect, useState } from 'react';
import { getDeviceOrientation, subscribeDeviceOrientation } from '@/utils';

const useDeviceOrientation = () => {
  const [orientation, setOrientation] = useState(getDeviceOrientation());

  useEffect(() => subscribeDeviceOrientation(setOrientation), []);

  return orientation;
};

export default useDeviceOrientation;
