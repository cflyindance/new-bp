/**
 * 检测文本中的语言变化并在语言切换处添加换行符
 * @param {string} text - 需要处理的文本
 * @returns {string} - 处理后的文本，在语言变化处添加了换行符
 */
export const detectLanguageChange = (text) => {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // 检测字符是否为中文字符
  const isChinese = (char) => {
    return /[\u4e00-\u9fff]/.test(char);
  };

  // 检测字符是否为英文字符（包括数字和常见符号）
  const isEnglish = (char) => {
    return /[a-zA-Z0-9\s\-_.,!?@#$%^&*()+=<>[\]{}|\\:";'~`]/.test(char);
  };

  let result = '';
  let currentLanguage = null;
  
  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    let charLanguage = null;
    
    if (isChinese(char)) {
      charLanguage = 'chinese';
    } else if (isEnglish(char)) {
      charLanguage = 'english';
    }
    
    // 如果检测到语言变化，添加换行符
    if (charLanguage && currentLanguage && charLanguage !== currentLanguage) {
      result += '\n';
    }
    
    result += char;
    
    // 更新当前语言状态
    if (charLanguage) {
      currentLanguage = charLanguage;
    }
  }
  
  return result;
};

export default detectLanguageChange;
