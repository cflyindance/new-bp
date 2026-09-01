import React, { Component } from 'react';
import styles from './index.module.scss';
import RemoveIcon from '@material-ui/icons/Remove';
import AddIcon from '@material-ui/icons/Add';
import DeleteIcon from '@material-ui/icons/Delete';

class Counter extends Component {
  render() {
    const {
      quantity,
      handleReduce,
      handleAdd,
      optionMode = false,
      max = 99,
      iconSize = 3.5,
      needGreyBg,
      plusVersion,
    } = this.props;
    if (!quantity) return null;
    return (
      <div className={styles.rightCounter}>
        <div
          className={[
            styles.counterBtnSubtract,
            optionMode && styles.optionMode,
            needGreyBg && styles.plusVersionBg,
          ].join(' ')}
          style={{
            width: `${iconSize}rem`,
            height: `${iconSize}rem`,
          }}
          onClick={(event) => {
            event.stopPropagation();
            handleReduce();
          }}
        >
          {quantity > 1 ? (
            <RemoveIcon className={styles.counterIcon} />
          ) : (
            <DeleteIcon className={styles.counterIcon} />
          )}
        </div>
        <span className={plusVersion ? styles.counterNum : ''}>
          {quantity || null}
        </span>
        <div
          className={[
            styles.counterBtnAdd,
            optionMode && styles.optionMode,
            quantity >= max && styles.disableCounter,
            quantity < max && 'animate-btn',
          ].join(' ')}
          style={{
            width: `${iconSize}rem`,
            height: `${iconSize}rem`,
          }}
          onClick={(event) => {
            event.stopPropagation();
            if (quantity >= max) return;
            handleAdd();
          }}
        >
          <AddIcon className={styles.counterIcon} />
        </div>
      </div>
    );
  }
}

export default Counter;
