/**
 * html特殊字符反转义，如&amp;转为&
 * @param {String} input 输入字符串
 * @returns 解码后字符串
 */
export const htmlDecode = (input) => {
  const doc = new DOMParser().parseFromString(input, 'text/html')
  return doc.documentElement.textContent
}
