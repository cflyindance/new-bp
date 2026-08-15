import { useEffect, useRef, useCallback } from 'react';
import { getDeviceOrientation } from '@/utils';

/**
 * 横屏模式下处理原生键盘弹出的 Hook
 * @param {Object} options - 配置选项
 * @param {React.RefObject} options.inputRef - 输入框的引用
 * @param {boolean} options.enabled - 是否启用键盘检测，默认为 true
 * @returns {{ handleKeyboardChange: Function, handleKeyboardClose: Function }} 返回手动触发的方法
 */
const useLandscapeKeyboard = ({ inputRef, enabled = true } = {}) => {
  const originalBodyHeightRef = useRef(null);
  const originalBodyOverflowRef = useRef(null);
  const visualViewportHandlerRef = useRef(null);
  const resizeHandlerRef = useRef(null);
  const orientationHandlerRef = useRef(null);

  // 获取设备方向
  const getIsVertical = useCallback(() => {
    return getDeviceOrientation() === 'vertical';
  }, []);

  // 恢复 body 样式
  const restoreBodyStyle = useCallback(() => {
    document.body.style.height = originalBodyHeightRef.current || '';
    document.body.style.overflow = originalBodyOverflowRef.current || '';
  }, []);

  // 处理键盘打开
  const handleKeyboardOpen = useCallback((viewportHeight) => {
    // 固定 body 高度，防止页面滚动
    document.body.style.height = `${viewportHeight}px`;
    document.body.style.overflow = 'hidden';

    // 确保输入框在可视区域内
    setTimeout(() => {
      const inputElement = inputRef?.current;
      if (inputElement) {
        inputElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }, 100);
  }, [inputRef]);

  // 处理键盘关闭
  const handleKeyboardClose = useCallback(() => {
    restoreBodyStyle();
  }, [restoreBodyStyle]);

  // 处理键盘变化
  const handleKeyboardChange = useCallback(() => {
    if (getIsVertical()) {
      // 竖屏模式不需要处理
      return;
    }

    const viewportHeight = window.visualViewport
      ? window.visualViewport.height
      : window.innerHeight;
    const windowHeight = window.innerHeight;
    const heightDiff = windowHeight - viewportHeight;

    // 如果高度差超过 150px，认为键盘弹出（横屏键盘通常高度在 150-300px）
    if (heightDiff > 150) {
      handleKeyboardOpen(viewportHeight);
    } else {
      handleKeyboardClose();
    }
  }, [getIsVertical, handleKeyboardOpen, handleKeyboardClose]);

  // 清理键盘检测（内部函数，不依赖其他回调）
  const cleanupKeyboardDetectionInternal = useCallback(() => {
    if (window.visualViewport && visualViewportHandlerRef.current) {
      window.visualViewport.removeEventListener(
        'resize',
        visualViewportHandlerRef.current
      );
      window.visualViewport.removeEventListener(
        'scroll',
        visualViewportHandlerRef.current
      );
      visualViewportHandlerRef.current = null;
    }
    if (resizeHandlerRef.current) {
      window.removeEventListener('resize', resizeHandlerRef.current);
      resizeHandlerRef.current = null;
    }
    if (orientationHandlerRef.current) {
      window.removeEventListener(
        'orientationchange',
        orientationHandlerRef.current
      );
      orientationHandlerRef.current = null;
    }
    // 恢复原始样式
    restoreBodyStyle();
  }, [restoreBodyStyle]);

  // 设置键盘检测
  const setupKeyboardDetection = useCallback(() => {
    // 保存原始样式
    originalBodyHeightRef.current = document.body.style.height;
    originalBodyOverflowRef.current = document.body.style.overflow;

    // 使用 visualViewport API（推荐，更准确）
    if (window.visualViewport) {
      visualViewportHandlerRef.current = () => {
        handleKeyboardChange();
      };
      window.visualViewport.addEventListener(
        'resize',
        visualViewportHandlerRef.current
      );
      window.visualViewport.addEventListener(
        'scroll',
        visualViewportHandlerRef.current
      );
    }

    // 降级方案：使用 window resize 事件
    resizeHandlerRef.current = () => {
      // 检查方向是否改变
      const isVertical = getIsVertical();
      if (isVertical) {
        // 如果变为竖屏，清理键盘检测
        cleanupKeyboardDetectionInternal();
      } else {
        // 如果变为横屏，重新设置
        handleKeyboardChange();
      }
    };
    window.addEventListener('resize', resizeHandlerRef.current);

    // 监听方向改变
    if (window.orientation !== undefined && !orientationHandlerRef.current) {
      orientationHandlerRef.current = () => {
        setTimeout(() => {
          const isVertical = getIsVertical();
          if (isVertical) {
            cleanupKeyboardDetectionInternal();
          } else {
            // 如果已经是横屏，只需要重新检测键盘状态
            if (!resizeHandlerRef.current && !visualViewportHandlerRef.current) {
              setupKeyboardDetection();
            } else {
              handleKeyboardChange();
            }
          }
        }, 100);
      };
      window.addEventListener('orientationchange', orientationHandlerRef.current);
    }
  }, [getIsVertical, handleKeyboardChange, cleanupKeyboardDetectionInternal]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    // 横屏模式下监听原生键盘弹出
    if (!getIsVertical()) {
      setupKeyboardDetection();
    }

    // 清理函数
    return () => {
      cleanupKeyboardDetectionInternal();
    };
  }, [enabled, getIsVertical, setupKeyboardDetection, cleanupKeyboardDetectionInternal]);

  // 返回手动触发键盘检测的方法（用于输入框的 onFocus/onBlur）
  return {
    handleKeyboardChange,
    handleKeyboardClose,
  };
};

export default useLandscapeKeyboard;

