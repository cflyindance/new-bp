const handleCountRowNum = ({ isTopMenu, selfConfig }) => {
  const currentDeviceId = localStorage.getItem('deviceId');
  const currentDeviceInfo = selfConfig?.configList
    ?.find((config) => config.id === 34)
    ?.value?.find((device) => device.deviceId === currentDeviceId);
  let count = 1;
  if (currentDeviceInfo && currentDeviceInfo.menuDisplay) {
    count = currentDeviceInfo.menuDisplay;
    return { count, widthRate: Math.floor(100 / count) - 1 };
  }

  //是否横屏
  if (currentDeviceInfo?.horizontalDisplay) {
    //是否是安卓
    if (currentDeviceInfo?.deviceType === 'Android') {
      //是否是顶部展示
      if (isTopMenu) {
        count = 5;
      } else {
        count = 4;
      }
    } else {
      //是否是顶部展示
      if (isTopMenu) {
        count = 4;
      } else {
        count = 3;
      }
    }
  } else {
    //是否是安卓
    if (currentDeviceInfo?.deviceType === 'Android') {
      //是否是顶部展示
      if (isTopMenu) {
        count = 3;
      } else {
        count = 2;
      }
    } else {
      //是否是顶部展示
      if (isTopMenu) {
        count = 4;
      } else {
        count = 3;
      }
    }
  }

  return { count, widthRate: Math.floor(100 / count) - 1 };
};

export default handleCountRowNum;
