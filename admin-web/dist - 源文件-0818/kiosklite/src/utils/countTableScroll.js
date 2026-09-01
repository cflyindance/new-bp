export function getTableScroll(extraHeight = 64, id) {
  let tHeader = null;
  if (id) {
    tHeader = document.getElementById(id)
      ? document.getElementById(id).getElementsByClassName('ant-table-thead')[0]
      : null;
  } else {
    tHeader = document.getElementsByClassName('ant-table-thead')[0];
  }
  //表格内容距离顶部的距离
  let tHeaderBottom = 0;
  if (tHeader) {
    tHeaderBottom = tHeader.getBoundingClientRect().bottom;
  }
  //窗体高度-表格内容顶部的高度-表格内容底部的高度
  return `calc(100vh - ${tHeaderBottom + extraHeight}px)`;
}
