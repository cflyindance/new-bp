import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './tipItemSetting.module.scss';
import Toast from '../../../../../component/toast';
import Radio from '../../../radio';
import cloneDeep from 'lodash/cloneDeep';

class TipItemSetting extends Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      // 1：固定金额，2：百分比
      tipList: [],
    };
  }

  // 初始化tipList
  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const tipList = [
        {
          1: ['', '', ''],
        },
        {
          2: ['', '', ''],
        },
      ];
      const configId = props?.configInfo?.id;
      const v = props?.configInfo?.value[0];
      const list = props?.configInfo?.value[1];
      for (let item of tipList) {
        let key = Object.keys(item)[0];
        if (key == v) {
          item[key] = cloneDeep(list);
        } else {
          item[key] = ['', '', ''];
        }
      }

      return {
        configId,
        tipList,
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

  handleSetValue = (idx, i, e) => {
    const { t } = this.props;
    const { tipList } = this.state;
    if (idx === 0) {
      if (Number.parseFloat(e) > 999.99 || Number.parseFloat(e) < 0) {
        Toast.info(t('tip-fixed-min-max'), 1000);
        return false;
      }
    } else {
      if (Number.parseFloat(e) > 100 || Number.parseFloat(e) < 0) {
        Toast.info(t('tip-percent-min-max'), 1000);
        return false;
      }
    }

    tipList[idx][idx + 1][i] = this.formatterVal(e);

    this.setState({
      tipList: cloneDeep(tipList),
    });
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  render() {
    const {
      t,
      configInfo: { id, value },
    } = this.props;
    const { tipList } = this.state;

    const selVal = value[0];

    return (
      <div className={styles.tipBox}>
        {tipList.map((tip, idx) => {
          if (tip[idx + 1]?.length) {
            return (
              <div key={idx} className={styles.tipType}>
                <div
                  className={styles.tipTitle}
                  onClick={() => {
                    this.props.handleRadio(id, idx + 1);
                  }}
                >
                  <Radio checkedB={idx + 1 == selVal} />
                  <span>{idx === 0 ? t('tip-at-fixed') : t('tip-at-percent')}</span>
                </div>
                <div className={styles.tipItemBox}>
                  {tip[idx + 1].map((item, i) => {
                    return (
                      <input
                        className={styles.tipIpt}
                        key={idx + 1 + '_' + i}
                        type="text"
                        value={item}
                        onChange={(e) => {
                          this.handleSetValue(idx, i, e.target.value);
                        }}
                      />
                    );
                  })}
                </div>
              </div>
            );
          }
        })}
      </div>
    );
  }
}

export default withTranslation()(TipItemSetting);
