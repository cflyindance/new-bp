import React from 'react';
import { Trans, withTranslation } from 'react-i18next';
import styles from './waitingTimeRangeItem.module.scss';
import Toast from '@/component/toast';

class WaitingTimeRangeItem extends React.Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      overNumber: 10,
      overTimeMinutes: 10,
      rangeSubMinutes: 2,
      rangeAddMinutes: 2,
    }
  }

  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const configId = props?.configInfo?.id;
      const overNumber = props?.configInfo?.value?.overNumber;
      const overTimeMinutes = props?.configInfo?.value?.overTimeMinutes;
      const rangeSubMinutes = props?.configInfo?.value?.rangeSubMinutes;
      const rangeAddMinutes = props?.configInfo?.value?.rangeAddMinutes;

      return {
        configId,
        overNumber,
        overTimeMinutes,
        rangeSubMinutes,
        rangeAddMinutes,
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

  handleSetValue = (e, fieldName) => {
    const { t } = this.props;
    if (fieldName === 'rangeSubMinutes' && Number(e) > Number(this.state.overTimeMinutes)) {
      Toast.info(t('waiting-time-range-start-warming', { time: this.state.overTimeMinutes }), 2000);
      return
    }
    this.setState({
      [fieldName]: this.formatterVal(e),
    });
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  render() {
    const { t, visible } = this.props;
    const { overNumber, overTimeMinutes, rangeSubMinutes, rangeAddMinutes } = this.state;

    return (
      <div className={styles.waitingTimeBox} style={{ display: visible ? 'block' : 'none' }}>
        <Trans
          t={t}
          i18nKey='waiting-time-range-condition'
          components={[
            <input
              className={styles.waitingTimeIpt}
              type="number"
              min={1}
              value={overNumber}
              onChange={(e) => {
                this.handleSetValue(e.target.value, 'overNumber');
              }}
            />,
            <input
              className={styles.waitingTimeIpt}
              type="number"
              min={0}
              value={overTimeMinutes}
              onChange={(e) => {
                this.handleSetValue(e.target.value, 'overTimeMinutes');
              }}
            />
          ]}
        />
        <div className={styles.rangestart}>
          <Trans
            t={t}
            i18nKey='waiting-time-range-start'
            components={[
              <input
                className={styles.waitingTimeIpt}
                type="number"
                min={0}
                value={rangeSubMinutes}
                onChange={(e) => {
                  this.handleSetValue(e.target.value, 'rangeSubMinutes');
                }}
              />
            ]}
          />
        </div>
        <div>
          <Trans
            t={t}
            i18nKey='waiting-time-range-end'
            components={[
              <input
                className={styles.waitingTimeIpt}
                type="number"
                min={0}
                value={rangeAddMinutes}
                onChange={(e) => {
                  this.handleSetValue(e.target.value, 'rangeAddMinutes');
                }}
              />
            ]}
          />
        </div>
      </div>
    )
  }
}

export default withTranslation()(WaitingTimeRangeItem);
