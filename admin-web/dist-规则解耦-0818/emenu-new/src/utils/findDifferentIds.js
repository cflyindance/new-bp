import { differenceWith, isEqual, forEach, indexOf } from 'lodash-es'

const findDifferentIds = (arr1, arr2) => {
  // 找出 arr1 中与 arr2 不同的对象项
  const uniqueInA = differenceWith(arr1, arr2, isEqual)
  // 找出 arr2 中与 arr1 不同的对象项
  const uniqueInB = differenceWith(arr2, arr1, isEqual)

  const differences = []

  // 找出 uniqueInA 和 uniqueInB 中不同的属性键
  forEach(uniqueInA, (obj1, index) => {
    const obj2 = uniqueInB[index]
    if (obj2) {
      const idx = indexOf(arr1, obj1)
      differences.push(arr1[idx].id)
    }
  })

  return differences
}

export default findDifferentIds
