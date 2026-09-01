const precision = 2
export default function floatNumberRounding(num) {
  var tempNum = parseFloat(num).toFixed(precision + 4)
  return Number(Math.round(tempNum + 'e' + precision) + 'e-' + precision).toFixed(precision)
}
