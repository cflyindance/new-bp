import copy from 'copy-to-clipboard';
import Toast from '@/component/toast';

/**
 * 复制到剪贴板
 * @param {string} code - 要复制的内容
 * @param {object} options - 复制选项
 * @param {string} options.message - 复制成功后的提示消息
 * @returns {boolean} 复制是否成功
 */
const copyCode = (code, options = {}) => {
  const { message = 'success' } = options;

  if (!code) {
    return false;
  }

  try {
    const success = copy(code);

    if (success) {
      Toast.info(message, 2000);
      return true;
    } else {
      Toast.error('filed', 2000);
      return false;
    }
  } catch (error) {
    return false;
  }
};

export default copyCode;
