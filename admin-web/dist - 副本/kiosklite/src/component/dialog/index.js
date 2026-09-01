import React from 'react';
import ReactDOM from 'react-dom';
import styles from './dialog.module.scss';

const Dialog = (props) => {
  const {
    outerStyle,
    visible,
    html,
    onClose = () => {},
    isMountOnBody,
  } = props;

  if (!visible) return null;

  const content = (
    <div
      className={styles.dialogPanelOuter}
      style={outerStyle || {}}
      onClick={onClose}
    >
      <div className={styles.dialogPanelInner}>{html}</div>
    </div>
  );

  if (isMountOnBody) {
    return ReactDOM.createPortal(content, document.body);
  }

  return content;
};

export default Dialog;
