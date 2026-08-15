import React, { Component } from 'react';
import styles from './index.module.scss';

class ToastBox extends Component {
  constructor() {
    super();
    this.transitionTime = 300;
    this.state = {
      notices: [],
    };
  }

  getNoticeKey() {
    const { notices } = this.state;
    return `notice-${new Date().getTime()}-${notices.length}`;
  }

  addNotice(notice) {
    const { notices } = this.state;
    notice.key = this.getNoticeKey();

    // notices.push(notice);//展示所有的提示
    notices[0] = notice; //仅展示最后一个提示

    this.setState({ notices });
    if (notice.duration > 0) {
      setTimeout(() => {
        this.removeNotice(notice.key);
      }, notice.duration);
    }
    return () => {
      this.removeNotice(notice.key);
    };
  }

  removeNotice = (key) => {
    const { notices } = this.state;
    this.setState({
      notices: notices.filter((notice) => {
        if (notice.key === key) {
          if (notice.onClose) setTimeout(notice.onClose, this.transitionTime);
          return false;
        }
        return true;
      }),
    });
  };

  render() {
    const { notices } = this.state;
    const icons = {
      info: 'toast_info',
      success: 'toast_success',
      error: 'toast_error',
      loading: 'toast_loading',
    };
    return (
      <div className={styles.toast}>
        {notices.map((notice) => (
          <div className={styles.toast_bg} key={notice.key}>
            <div className={styles.toast_box}>
              <div className={styles[`toast_icon ${icons[notice.type]}`]}></div>
              <div className={styles.toast_text}>{notice.content}</div>
            </div>
          </div>
        ))}
      </div>
    );
  }
}

export default ToastBox;
