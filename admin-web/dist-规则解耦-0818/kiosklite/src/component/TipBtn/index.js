import React from 'react';
import { connect } from 'react-redux';
import styles from './tipBtn.module.scss';
import Icon from '../icon';

const TipBtn = (props) => {
  const { id, selected, tipToggler, tipStyle, text, ratio, selfConfig } = props;

  // 小费收取方式 1.固定金额 2.百分比
  const tipCollectMethodPercentage = selfConfig?.configMap?.id_14[0] === 2;
  // 是否展示小费具体金额配置
  const isOpenTipPriceDetail = selfConfig?.configMap?.id_55;
  // 展示title文字
  const showText =
    (tipCollectMethodPercentage && isOpenTipPriceDetail && !id) ||
    id ||
    !tipCollectMethodPercentage;

  return (
    <div
      id={id}
      className={`${styles.tipBtn} ${styles[id] || ''} ${selected ? styles.tipBtnSelected : ''}`}
      onClick={tipToggler}
      style={tipStyle || {}}
    >
      <div className={styles.tipBtnTxtBox}>
        {showText && <div className={styles.tipBtnText}>{text}</div>}
        {ratio && (
          <div className={showText ? styles.tipBtnRatio : styles.tipBtnText}>
            {showText ? `(${ratio}%)` : `${ratio}%`}
          </div>
        )}
      </div>
      {selected && <Icon type="check" size={7} className={styles.tipBtnIcon} />}
    </div>
  );
};

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps)(TipBtn);
