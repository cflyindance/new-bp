const refreshOrderStockBeforeSubmit = async ({
  refreshStock,
  getOrderItems,
  judgeOrder,
  onRefreshError,
}) => {
  try {
    await refreshStock();
  } catch (error) {
    onRefreshError?.(error);
    return { status: 'refresh_failed', error };
  }

  return {
    status: 'validated',
    dishMap: judgeOrder(getOrderItems()),
  };
};

export default refreshOrderStockBeforeSubmit;
