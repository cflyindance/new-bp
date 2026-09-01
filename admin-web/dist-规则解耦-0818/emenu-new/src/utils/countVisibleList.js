// 获取菜品类高度
const getRowHeight = (rowItem) => {
  return rowItem[Object.keys(rowItem)[0]]
}

// 找到第一个合法 row
const findFirstValidRow = (rowSize, startIndex) => {
  let leftIndex = startIndex - 1
  let rightIndex = startIndex + 1
  while (leftIndex >= 0 || rightIndex <= rowSize.length - 1) {
    // 优先向下找
    if (
      rightIndex <= rowSize.length - 1 &&
      getRowHeight(rowSize[rightIndex]) > 0
    ) {
      return rightIndex
    }
    if (
      leftIndex >= 0 &&
      rowSize[leftIndex] &&
      getRowHeight(rowSize[leftIndex]) > 0
    ) {
      return leftIndex
    }
    rightIndex++
    leftIndex--
  }
  return -1
}

export default {
  getRowHeight,
  findFirstValidRow,
}
