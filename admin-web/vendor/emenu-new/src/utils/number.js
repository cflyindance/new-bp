/**
 * 四舍五入浮点数
 * @param {Number} number 原始数字
 * @param {Number} decimals 小数点后位数/精度
 * @returns 四舍五入后数字
 */
export const roundToPrecision = (number, decimals = 2) => {
  // const pow = Math.pow(10, decimals)
  // return Math.round((number + Number.EPSILON) * pow) / pow
  number = Math.round(number + 'e' + decimals)
  return Number(number + 'e' + -decimals)
}
