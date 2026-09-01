import * as types from '@/constants/actionTypes';

export const setPosterData = (data) => ({ type: types.SET_POSTER_DATA, data });

export const setCurrentBlock = (data) => ({
  type: types.SET_CURRENT_BLOCK,
  data,
});

export const setCurrentPage = (data) => ({
  type: types.SET_CURRENT_PAGE,
  data,
});

export const changePosterStatus = (data) => ({
  type: types.CHANGE_POSTER_STATUS,
  data,
});

export const setKioskMenuTree = (data) => ({
  type: types.SET_KIOSK_MENU_TREE,
  data,
});

// 将当前block同步到页面
export const syncBlockDataToPage = (block) => {
  return (dispatch, getState) => {
    const { currentPageData } = getState().posterPro;
    const newCurrentPageData = {
      ...currentPageData,
      children: currentPageData.children?.map((b) => {
        return b.id === block.id ? block : b;
      }),
    };
    dispatch({
      type: types.SET_CURRENT_PAGE,
      data: newCurrentPageData,
    });
  };
};
// 将当前页面数据同步到全局
export const syncPageDataToGlobal = () => {
  return (dispatch, getState) => {
    const { currentPageData, posterData } = getState().posterPro;
    const { id } = currentPageData;
    const newGlobalData = posterData.map((p) => {
      return p.id === id ? currentPageData : p;
    });
    dispatch({
      type: types.SET_POSTER_DATA,
      data: newGlobalData,
    });
  };
};
// 删除当前block
export const removeCurrentBlock = () => {
  return (dispatch, getState) => {
    const { currentBlock, currentPageData } = getState().posterPro;
    const newCurrentPageData = {
      ...currentPageData,
      children: currentPageData?.children?.filter(
        (b) => b.id !== currentBlock.id
      ),
    };
    dispatch({
      type: types.SET_CURRENT_PAGE,
      data: newCurrentPageData,
    });
  };
};
// 修改属性
export const editCurrentBlockProps = (newProps) => {
  return (dispatch, getState) => {
    const { currentBlock } = getState().posterPro;
    const newCurrentBlock = {
      ...currentBlock,
      props: {
        ...(currentBlock.props || {}),
        ...newProps,
      },
    };
    dispatch({
      type: types.SET_CURRENT_BLOCK,
      data: newCurrentBlock,
    });
  };
};
// 修改样式
export const editCurrentBlockStyle = (newStyle) => {
  return (dispatch, getState) => {
    const { currentBlock } = getState().posterPro;
    const newCurrentBlock = {
      ...currentBlock,
      style: {
        ...(currentBlock.style || {}),
        ...newStyle,
      },
    };
    dispatch({
      type: types.SET_CURRENT_BLOCK,
      data: newCurrentBlock,
    });
  };
};
