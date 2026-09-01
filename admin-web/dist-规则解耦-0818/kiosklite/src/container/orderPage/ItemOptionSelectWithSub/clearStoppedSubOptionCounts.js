export const clearStoppedSubOptionCounts = ({
  checkedCountMap,
  displayOptionList,
  itemInfo,
  availabilityOptions,
  isSubOptionUnavailable,
  isSubOptionSoldOut,
}) => {
  if (
    !checkedCountMap ||
    !displayOptionList?.length ||
    !itemInfo?.options?.length
  ) {
    return checkedCountMap;
  }

  const productCenterOptionIdSet = new Set(
    itemInfo.options.map((option) => String(option?.id))
  );
  let hasChange = false;
  const next = { ...checkedCountMap };

  displayOptionList.forEach((option) => {
    if (
      option?.id === undefined ||
      !productCenterOptionIdSet.has(String(option.id))
    ) {
      return;
    }

    option?.subOptions?.forEach((subOption) => {
      const optionCountMap = next[option.id];
      const currentCount = optionCountMap?.[subOption.id];
      if (!currentCount) {
        return;
      }

      const isUnavailableMark = isSubOptionUnavailable(
        itemInfo,
        option,
        subOption,
        availabilityOptions
      );
      const isSoldoutMark = isSubOptionSoldOut(
        itemInfo,
        option,
        subOption,
        availabilityOptions
      );

      if (isUnavailableMark || isSoldoutMark) {
        next[option.id] = {
          ...optionCountMap,
          [subOption.id]: 0,
        };
        hasChange = true;
      }
    });
  });

  return hasChange ? next : checkedCountMap;
};
