import LandscapeKeyboardManager from '@/utils/landscapeKeyboardManager';

const syncLandscapeKeyboardManager = (component, getInputRef) => {
  const isVertical = component.state.deviceOrientation === 'vertical';

  if (isVertical) {
    if (component.keyboardManager) {
      component.keyboardManager.cleanup();
      component.keyboardManager = null;
    }
    return;
  }

  if (!component.keyboardManager) {
    component.keyboardManager = new LandscapeKeyboardManager(getInputRef);
    component.keyboardManager.setup();
  }
};

export default syncLandscapeKeyboardManager;
