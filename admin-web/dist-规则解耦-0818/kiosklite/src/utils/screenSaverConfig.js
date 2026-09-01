/** 屏保 id:35 数据来源（与 margin 配置一致） */
export const SCREENSAVER_DATA_SOURCE = {
  LOCAL: 'local',
  CLOUD: 'cloud',
};

export function isOrientationMediaEmpty(orientationData) {
  if (!orientationData) return true;
  const imgs = orientationData.imageList || [];
  const vids = orientationData.videoList || [];
  const hasImg = imgs.some((i) => i?.url && String(i.url).trim());
  const hasVid = vids.some((v) => v?.url && String(v.url).trim());
  return !hasImg && !hasVid;
}

/** 横竖屏均未配置图片/视频素材 */
export function bothOrientationsMediaEmpty(value) {
  return (
    isOrientationMediaEmpty(value?.horizontalData) &&
    isOrientationMediaEmpty(value?.verticalityData)
  );
}

/**
 * 未存过 dataSource 时：无横竖屏素材 → 云端，否则 → 本地
 */
export function normalizeScreenSaverDataSource(
  screenData,
  changeDirectionData = false
) {
  if (!screenData || typeof screenData !== 'object') return screenData;
  const ds = screenData.dataSource;
  if (ds === SCREENSAVER_DATA_SOURCE.CLOUD) {
    if (changeDirectionData) {
      return {
        ...screenData,
        horizontalData: screenData.verticalityData,
        verticalityData: screenData.horizontalData,
      };
    }
    return screenData;
  }

  // 本地数据遗留问题：原本横竖数据的键名命名取反了，为了兼容，反向取数据
  if (ds === SCREENSAVER_DATA_SOURCE.LOCAL) {
    if (changeDirectionData) {
      return {
        ...screenData,
        horizontalData: screenData.verticalityData,
        verticalityData: screenData.horizontalData,
      };
    }
    return screenData;
  }

  // Legacy local configs saved these orientation keys in reverse.
  const migratedScreenData = changeDirectionData
    ? {
        ...screenData,
        horizontalData: screenData.verticalityData,
        verticalityData: screenData.horizontalData,
      }
    : { ...screenData };

  return {
    ...migratedScreenData,
    dataSource: bothOrientationsMediaEmpty(migratedScreenData)
      ? SCREENSAVER_DATA_SOURCE.CLOUD
      : SCREENSAVER_DATA_SOURCE.LOCAL,
  };
}
