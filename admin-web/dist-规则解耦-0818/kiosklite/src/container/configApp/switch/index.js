import React, { Component } from 'react';
import styles from './switch.module.scss';

class Switch extends Component {
  handleChange = () => {
    const { fId, checkedB, itemInfo } = this.props;
    this.props.handleChangeSwitch(fId, checkedB, itemInfo);
  };

  render() {
    const { checkedB } = this.props;

    return (
      <div className={styles.switchBox} onClick={this.handleChange}>
        <div
          style={{
            display: checkedB ? 'block' : 'none',
          }}
          className={styles.open}
        ></div>
        <div
          style={{
            display: !checkedB ? 'block' : 'none',
          }}
          className={styles.close}
        ></div>
      </div>
    );
  }
}

export default Switch;
