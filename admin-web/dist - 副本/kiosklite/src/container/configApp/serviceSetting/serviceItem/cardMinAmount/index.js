import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './cardMinAmount.module.scss';
import Toast from '../../../../../component/toast';

class CardMinAmount extends Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      // 信用卡支付最小金额
      minAmout: 0,
    };
  }

  // 初始化tipList
  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const minAmout = props?.configInfo?.value;
      const configId = props?.configInfo?.id;

      return {
        configId,
        minAmout,
      };
    }
    return null;
  }

  formatterVal = (val) => {
    val = val.replace(/[^\d.]/g, ''); //清除"数字"和"."以外的字符
    val = val.replace(/^\./g, ''); //验证第一个字符是数字
    val = val.replace(/\.{2,}/g, '.'); //只保留第一个, 清除多余的
    val = val.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');
    val = val.replace(/^(\-)*(\d+)\.(\d\d).*$/, '$1$2.$3'); //只能输入两个小数

    if (val.charAt(0) != '' && val.charAt(0) == 0 && val.charAt(1) != '.') {
      val = String(Number.parseFloat(val));
    }

    return val;
  };

  handleSetValue = (e) => {
    const { t } = this.props;
    if (Number.parseFloat(e) > 999.99 || Number.parseFloat(e) < 0) {
      Toast.info(t('card-amount-min-max'), 1000);
      return false;
    }
    this.setState({
      minAmout: this.formatterVal(e),
    });
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  render() {
    const { minAmout } = this.state;

    return (
      <div className={styles.minBox}>
        <input
          className={styles.minIpt}
          type="text"
          value={minAmout}
          onChange={(e) => {
            this.handleSetValue(e.target.value);
          }}
        />
      </div>
    );
  }
}

export default withTranslation()(CardMinAmount);
