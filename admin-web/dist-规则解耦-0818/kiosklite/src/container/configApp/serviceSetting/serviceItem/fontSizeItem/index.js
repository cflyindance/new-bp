import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './fontSizeItem.module.scss';
import Toast from '../../../../../component/toast';
import Radio from '../../../radio';

class FontSizeItem extends Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      type: 'default', // 'default' 或 'multiple'
      fontsizeMultiple: 1,
    };
  }

  // 初始化
  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const configId = props?.configInfo?.id;
      const value = props?.configInfo?.value || {
        type: 'default',
        fontsizeMultiple: 1,
      };

      return {
        configId,
        type: value.type || 'default',
        fontsizeMultiple: value.fontsizeMultiple || 1,
      };
    }
    return null;
  }

  formatterVal = (val) => {
    val = val.replace(/[^\d.]/g, ''); //清除"数字"和"."以外的字符
    val = val.replace(/^\./g, ''); //验证第一个字符是数字
    val = val.replace(/\.{2,}/g, '.'); //只保留第一个, 清除多余的
    val = val.replace('.', '$#$').replace(/\./g, '').replace('$#$', '.');

    if (val.charAt(0) != '' && val.charAt(0) == 0 && val.charAt(1) != '.') {
      val = String(Number.parseFloat(val));
    }

    return val;
  };

  handleSetValue = (e) => {
    const { t } = this.props;
    const val = this.formatterVal(e);
    const numVal = Number.parseFloat(val);

    if (val === '' || isNaN(numVal) || numVal <= 0) {
      Toast.info(t('font-size-multiple-invalid'), 1000);
      return false;
    }

    this.setState({
      fontsizeMultiple: val,
    });
  };

  handleBlur = () => {
    const { fontsizeMultiple } = this.state;
    const numVal = Number.parseFloat(fontsizeMultiple);
    if (isNaN(numVal) || numVal <= 0) {
      this.setState({
        fontsizeMultiple: 1,
      });
    }
  };

  handleRadioChange = (type) => {
    this.setState({
      type,
    });
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  render() {
    const { t } = this.props;
    const { type, fontsizeMultiple } = this.state;

    return (
      <div className={styles.fontSizeBox}>
        <div
          className={styles.fontSizeOption}
          onClick={() => {
            this.handleRadioChange('default');
          }}
        >
          <Radio checkedB={type === 'default'} />
          <span className={styles.radioText}>{t('font-size-default')}</span>
        </div>
        <div className={styles.fontSizeOption}>
          <div
            className={styles.fontSizeOptionRow}
            onClick={() => {
              this.handleRadioChange('multiple');
            }}
          >
            <Radio checkedB={type === 'multiple'} />
            <span className={styles.radioText}>
              {t('font-size-multiple-prefix')}
            </span>
            <input
              className={styles.fontSizeInput}
              type="number"
              min="0.01"
              step="0.01"
              value={fontsizeMultiple}
              onChange={(e) => {
                this.handleSetValue(e.target.value);
              }}
              onBlur={this.handleBlur}
              onClick={(e) => {
                e.stopPropagation();
              }}
            />
            <span className={styles.radioText}>
              {t('font-size-multiple-suffix')}
            </span>
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(FontSizeItem);
