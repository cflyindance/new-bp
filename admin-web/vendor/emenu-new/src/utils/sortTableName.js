import { cloneDeep } from 'lodash-es'

const sortTableName = (array) => {
  // // 数字项
  // const pureNumbers = array.filter(
  //   (item) => typeof item.name === 'number' || /^\d+$/.test(item.name)
  // )
  // // 字母 + 数字
  // const mixed = array.filter(
  //   (item) =>
  //     typeof item.name === 'string' &&
  //     /\d/.test(item.name) &&
  //     /[A-Za-z]/.test(item.name)
  // )
  // // 纯字母项
  // const letters = array.filter(
  //   (item) => typeof item.name === 'string' && /^[A-Za-z]+$/.test(item.name)
  // )

  const { pureNumbers, mixed, letters, others } = array.reduce(
    (acc, item) => {
      // 数字项
      if (typeof item.name === 'number' || /^\d+$/.test(item.name)) {
        acc.pureNumbers.push(item)
        // 字母 + 数字
      } else if (
        typeof item.name === 'string' &&
        /\d/.test(item.name) &&
        /[A-Za-z]/.test(item.name)
      ) {
        acc.mixed.push(item)
        // 纯字母项
      } else if (
        typeof item.name === 'string' &&
        /^[A-Za-z]+$/.test(item.name)
      ) {
        acc.letters.push(item)
        // 其他项
      } else {
        acc.others.push(item)
      }
      return acc
    },
    { pureNumbers: [], mixed: [], letters: [], others: [] }
  )

  pureNumbers?.sort((a, b) => a.name - b.name)
  const sortMixed = sortMixTableName(mixed)
  letters.sort((a, b) => a.name.localeCompare(b.name))
  others.sort((a, b) => a.name.localeCompare(b.name))

  return [...pureNumbers, ...sortMixed, ...letters, ...others]
}

const sortMixTableName = (array) => {
  return cloneDeep(array).sort((x, y) => {
    // 提取数字部分和字母部分
    const extract = (str) => {
      const match = str.match(/^(\d+)?([a-zA-Z]*)?(\d+)?$/)
      if (!match) return [null, str, null]
      const [, num1, letters, num2] = match
      return [
        num1 ? parseInt(num1, 10) : null,
        letters,
        num2 ? parseInt(num2, 10) : null,
      ]
    }

    const [num1X, lettersX, num2X] = extract(x.name)
    const [num1Y, lettersY, num2Y] = extract(y.name)

    // 按数字部分排序
    if (num1X !== num1Y) return (num1X || 0) - (num1Y || 0)

    // 按字母部分排序
    if (lettersX !== lettersY) return lettersX.localeCompare(lettersY)

    // 按后续数字排序
    return (num2X || 0) - (num2Y || 0)
  })
}

export default sortTableName
