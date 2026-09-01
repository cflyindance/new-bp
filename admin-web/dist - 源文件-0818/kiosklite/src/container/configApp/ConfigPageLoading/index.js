import React, { useEffect, useState } from 'react';
import FallbackLoading from '@/component/FallbackLoading';
import { subscribeConfigFetchLoading } from '@/utils/configFetchLoading';

const ConfigPageLoading = () => {
  const [visible, setVisible] = useState(false);

  useEffect(() => subscribeConfigFetchLoading(setVisible), []);

  return <FallbackLoading visible={visible} />;
};

export default ConfigPageLoading;
