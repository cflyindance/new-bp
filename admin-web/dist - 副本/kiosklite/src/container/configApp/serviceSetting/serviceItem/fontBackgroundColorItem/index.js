import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './fontBackgroundColorItem.module.scss';
import Radio from '../../../radio';

class FontBackgroundColorItem extends Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      type: 'default', // 'default' 或 'custom'
      customColor: '#000000b3', // 自定义背景色
    };
  }

  // 初始化
  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const configId = props?.configInfo?.id;
      const value = props?.configInfo?.value || {
        type: 'default',
        customColor: '#000000b3',
      };

      return {
        configId,
        type: value.type || 'default',
        customColor: value.customColor || '#000000b3',
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
      <div className={styles.fontBackgroundColorBox}>
        <div
          className={styles.fontBackgroundColorOption}
          onClick={() => {
            this.handleRadioChange('default');
          }}
        >
          <Radio checkedB={type === 'default'} />
          <span className={styles.radioText}>
            {t('font-background-color-default')}
          </span>
        </div>
        <div className={styles.fontBackgroundColorOption}>
          <div
            className={styles.fontBackgroundColorOptionRow}
            onClick={() => {
              this.handleRadioChange('custom');
            }}
          >
            <Radio checkedB={type === 'custom'} />
            <span className={styles.radioText}>
              {t('font-background-color-custom')}
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

export default withTranslation()(FontBackgroundColorItem);

