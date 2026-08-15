import React, { Component } from 'react';
import styles from './checkbox.module.scss';

class Checkbox extends Component {
  render() {
    const { checkedB } = this.props;

    return (
      <div className={styles.switchBox}>
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

export default Checkbox;
