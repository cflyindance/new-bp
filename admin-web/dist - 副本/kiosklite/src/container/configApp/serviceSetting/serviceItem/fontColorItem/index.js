import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './fontColorItem.module.scss';
import Radio from '../../../radio';

class FontColorItem extends Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      type: 'default', // 'default' 或 'custom'
      customColor: '#FFFFFF', // 自定义颜色，默认白色
    };
  }

  // 初始化
  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const configId = props?.configInfo?.id;
      const value = props?.configInfo?.value || {
        type: 'default',
        customColor: '#FFFFFF',
      };

      return {
        configId,
        type: value.type || 'default',
        customColor: value.customColor || '#FFFFFF',
      };
    }
    return null;
  }

  handleColorChange = (e) => {
    const color = e.target.value;
    this.setState({
      customColor: color,
    });
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
    const { type, customColor } = this.state;

    return (
      <div className={styles.fontColorBox}>
        <div
          className={styles.fontColorOption}
          onClick={() => {
            this.handleRadioChange('default');
          }}
        >
          <Radio checkedB={type === 'default'} />
          <span className={styles.radioText}>
            {t('font-color-default')}
          </span>
        </div>
        <div className={styles.fontColorOption}>
          <div
            className={styles.fontColorOptionRow}
            onClick={() => {
              this.handleRadioChange('custom');
            }}
          >
            <Radio checkedB={type === 'custom'} />
            <span className={styles.radioText}>
              {t('font-color-custom')}
            </span>
            <input
              className={styles.colorPicker}
              type="color"
              value={customColor}
              onChange={this.handleColorChange}
              onClick={(e) => {
                e.stopPropagation();
              }}
              disabled={type !== 'custom'}
            />
          </div>
        </div>
      </div>
    );
  }
}

export default withTranslation()(FontColorItem);

