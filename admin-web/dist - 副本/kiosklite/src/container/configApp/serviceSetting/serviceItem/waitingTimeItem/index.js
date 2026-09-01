import React from 'react';
import { Trans, withTranslation } from 'react-i18next';
import styles from './waitingTimeItem.module.scss';

class WaitingTimeItem extends React.Component {
  constructor() {
    super();
    this.state = {
      configId: null,
      overTimeClose: 30,
      overTimeShowModal: '',
    };
  }

  static getDerivedStateFromProps(props, state) {
    if (state.configId === null) {
      const configId = props?.configInfo?.id;
      const overTimeClose = props?.configInfo?.value?.overTimeClose;
      const overTimeShowModal =
        props?.configInfo?.value?.overTimeShowModal || '';

      return {
        configId,
        overTimeClose,
        overTimeShowModal,
      };
    }
    return null;
  }

  formatterVal = (val) => {
    val = val.replace(/[^\d]/g, '');
    if (val !== '') {
      val = String(Number.parseInt(val));
    }

    return val;
  };

  handleSetValue = (e) => {
    const { overTimeShowModal } = this.state;
    let newOverTimeClose = this.formatterVal(e);

    // 如果 overTimeClose 改变，且 overTimeShowModal 大于新的 overTimeClose，则自动调整
    let newOverTimeShowModal = overTimeShowModal;
    if (
      newOverTimeClose !== '' &&
      overTimeShowModal !== '' &&
      !isNaN(Number.parseInt(overTimeShowModal)) &&
      !isNaN(Number.parseInt(newOverTimeClose)) &&
      Number.parseInt(overTimeShowModal) >= Number.parseInt(newOverTimeClose)
    ) {
      newOverTimeShowModal = '';
    }

    this.setState({
      overTimeClose: newOverTimeClose,
      overTimeShowModal: newOverTimeShowModal,
    });
  };

  handleSetShowModalValue = (e) => {
    const { overTimeClose } = this.state;
    let val = this.formatterVal(e);

    // 验证：如果输入的值大于 overTimeClose，则重置
    if (
      val !== '' &&
      overTimeClose !== '' &&
      !isNaN(Number.parseInt(val)) &&
      !isNaN(Number.parseInt(overTimeClose)) &&
      Number.parseInt(val) >= Number.parseInt(overTimeClose)
    ) {
      val = '';
    }

    this.setState({
      overTimeShowModal: val,
    });
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  render() {
    const { t, visible } = this.props;
    const { overTimeClose, overTimeShowModal } = this.state;

    return (
      <div
        className={styles.waitingTimeBox}
        style={{ display: visible ? 'block' : 'none' }}
      >
        <div>
          <Trans
            t={t}
            i18nKey="auto-close-waiting-time"
            components={[
              <input
                className={styles.waitingTimeIpt}
                type="number"
                value={overTimeClose}
                onChange={(e) => {
                  this.handleSetValue(e.target.value);
                }}
              />,
            ]}
          />
        </div>
        <div>
          <Trans
            t={t}
            i18nKey="auto-show-modal-waiting-time"
            components={[
              <input
                className={styles.waitingTimeIpt}
                type="number"
                value={overTimeShowModal}
                onChange={(e) => {
                  this.handleSetShowModalValue(e.target.value);
                }}
              />,
            ]}
          />
        </div>
      </div>
    );
  }
}

export default withTranslation()(WaitingTimeItem);
