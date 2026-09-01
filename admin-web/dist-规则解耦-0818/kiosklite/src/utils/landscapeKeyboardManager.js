import { getDeviceOrientation } from '@/utils';

/**
 * 横屏模式下处理原生键盘弹出的工具类
 * 可以在类组件中使用
 */
class LandscapeKeyboardManager {
  constructor(inputRef) {
    this.inputRef = inputRef;
    this.originalBodyHeight = null;
    this.originalBodyOverflow = null;
    this.visualViewportHandler = null;
    this.resizeHandler = null;
    this.orientationHandler = null;
  }

  // 获取设备方向
  getIsVertical() {
    return getDeviceOrientation() === 'vertical';
  }

  // 恢复 body 样式
  restoreBodyStyle() {
    document.body.style.height = this.originalBodyHeight || '';
    document.body.style.overflow = this.originalBodyOverflow || '';
  }

  // 处理键盘打开
  handleKeyboardOpen(viewportHeight) {
    // 固定 body 高度，防止页面滚动
    document.body.style.height = `${viewportHeight}px`;
    document.body.style.overflow = 'hidden';

    // 确保输入框在可视区域内
    setTimeout(() => {
      // inputRef 可能是函数（返回元素）、ref 对象或直接的元素
      let inputElement = null;
      if (typeof this.inputRef === 'function') {
        inputElement = this.inputRef();
      } else if (this.inputRef?.current) {
        inputElement = this.inputRef.current;
      } else {
        inputElement = this.inputRef;
      }
      
      if (inputElement) {
        inputElement.scrollIntoView({
          behavior: 'smooth',
          block: 'center',
          inline: 'nearest',
        });
      }
    }, 100);
  }

  // 处理键盘关闭
  handleKeyboardClose() {
    this.restoreBodyStyle();
  }

  // 处理键盘变化
  handleKeyboardChange() {
    if (this.getIsVertical()) {
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
      this.handleKeyboardOpen(viewportHeight);
    } else {
      this.handleKeyboardClose();
    }
  }

  // 强制检测键盘状态（用于 onFocus 时立即检测）
  forceCheck() {
    // 延迟一点时间，确保键盘已经弹出
    setTimeout(() => {
      this.handleKeyboardChange();
    }, 100);
  }

  // 设置键盘检测
  setup() {
    // 保存原始样式
    this.originalBodyHeight = document.body.style.height;
    this.originalBodyOverflow = document.body.style.overflow;

    // 使用 visualViewport API（推荐，更准确）
    if (window.visualViewport) {
      this.visualViewportHandler = () => {
        this.handleKeyboardChange();
      };
      window.visualViewport.addEventListener('resize', this.visualViewportHandler);
      window.visualViewport.addEventListener('scroll', this.visualViewportHandler);
    }

    // 降级方案：使用 window resize 事件
    this.resizeHandler = () => {
      // 检查方向是否改变
      const isVertical = this.getIsVertical();
      if (isVertical) {
        // 如果变为竖屏，清理键盘检测
        this.cleanup();
      } else {
        // 如果变为横屏，重新设置
        this.handleKeyboardChange();
      }
    };
    window.addEventListener('resize', this.resizeHandler);
    
    // 立即检测一次当前状态（可能键盘已经弹出）
    setTimeout(() => {
      this.handleKeyboardChange();
    }, 100);

    // 监听方向改变
    if (window.orientation !== undefined && !this.orientationHandler) {
      this.orientationHandler = () => {
        setTimeout(() => {
          const isVertical = this.getIsVertical();
          if (isVertical) {
            this.cleanup();
          } else {
            // 如果已经是横屏，只需要重新检测键盘状态
            if (!this.resizeHandler && !this.visualViewportHandler) {
              this.setup();
            } else {
              this.handleKeyboardChange();
            }
          }
        }, 100);
      };
      window.addEventListener('orientationchange', this.orientationHandler);
    }
  }

  // 清理键盘检测
  cleanup() {
    if (window.visualViewport && this.visualViewportHandler) {
      window.visualViewport.removeEventListener('resize', this.visualViewportHandler);
      window.visualViewport.removeEventListener('scroll', this.visualViewportHandler);
      this.visualViewportHandler = null;
    }
    if (this.resizeHandler) {
      window.removeEventListener('resize', this.resizeHandler);
      this.resizeHandler = null;
    }
    if (this.orientationHandler) {
      window.removeEventListener('orientationchange', this.orientationHandler);
      this.orientationHandler = null;
    }
    // 恢复原始样式
    this.restoreBodyStyle();
  }
}

export default LandscapeKeyboardManager;

