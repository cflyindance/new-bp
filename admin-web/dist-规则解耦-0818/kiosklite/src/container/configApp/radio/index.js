import React, { Component } from 'react';
import styles from './radio.module.scss';

class Radio extends Component {
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

export default Radio;
