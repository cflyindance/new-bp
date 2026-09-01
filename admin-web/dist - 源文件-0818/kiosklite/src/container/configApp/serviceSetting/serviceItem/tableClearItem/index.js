import React from 'react';
import { Trans, withTranslation } from 'react-i18next';
import styles from './tableClearItem.module.scss';

class TableClearItem extends React.Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      delayTime: 0,
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const configId = props?.configInfo?.id;
      const delayTime = props?.configInfo?.value?.delayTime;

      return {
        configId,
        delayTime,
      };
    }
    return null;
  }

  formatterVal = (val) => {
    val = val.replace(/[^\d]/g, '');
    if (val !== "") {
      val = String(Number.parseInt(val));
    }

    return val;
  };

  handleSetValue = (e) => {
    this.setState({
      delayTime: this.formatterVal(e),
    });
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  render() {
    const { t, visible } = this.props;
    const { delayTime } = this.state;

    return (
      <div className={styles.tableClearTimeBox} style={{display: visible ? 'block': 'none'}}>
        <Trans
          t={t}
          i18nKey='auto-clear-table-delay'
          components={[
            <input
              className={styles.tableClearTimeIpt}
              type="text"
              value={delayTime}
              onChange={(e) => {
                this.handleSetValue(e.target.value);
              }}
            />
          ]}
        />
      </div>
    )
  }
}

export default withTranslation()(TableClearItem);
