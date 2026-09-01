import React from 'react';
import ReactDOM from 'react-dom';
import { withTranslation } from 'react-i18next';
import styles from './networkTip.module.scss';
import Dialog from '../../component/dialog';
import LoadingText from '../../component/loadingText';
import Toast from '../../component/toast';
import { on, off } from '@/utils';

class NetworkTip extends React.Component {
  constructor() {
    super();
    this.state = {
      isNetworkLoading: false,
      isOffNetwork: false,
    };
    this.netTime = null;
  }

  // 打开断网提示
  handleOpen = () => {
    this.setState({
      isOffNetwork: true,
    });
  };

  // 重试
  handleRetry = () => {
    this.setState({
      isOffNetwork: false,
      isNetworkLoading: true,
    });
    this.netTime = setTimeout(() => {
      this.handleCheckNetState();
    }, 10 * 1000);
  };

  // 关闭断网提示
  handleClose = () => {
    const { t } = this.props;
    this.handleDestroy();
    this.setState({
      isNetworkLoading: false,
      isOffNetwork: false,
    });
    Toast.info(t('network-succeeded'), 1000);
  };

  // 检测网络状态
  handleCheckNetState = () => {
    this.handleDestroy();
    if (!navigator.onLine) {
      this.setState({
        isOffNetwork: true,
        isNetworkLoading: false,
      });
    }
  };

  // 销毁定时器
  handleDestroy = () => {
    if (this.netTime) {
      clearTimeout(this.netTime);
    }
  };

  componentDidMount() {
    if (!navigator.onLine) {
      this.handleOpen();
    }
    on(window, 'online', this.handleClose);
    on(window, 'offline', this.handleOpen);
  }

  componentWillUnmount() {
    off(window, 'online', this.handleClose);
    off(window, 'offline', this.handleOpen);
    this.handleDestroy();
  }

  render() {
    const { t } = this.props;
    const { isOffNetwork, isNetworkLoading } = this.state;

    return ReactDOM.createPortal(
      <React.Fragment>
        <Dialog
          visible={isOffNetwork}
          html={
            <div className={styles.box}>
              <div className={styles.itemBox}>
                <div className={styles.itemName}>{t('disconnect-network')}</div>
              </div>
              <div className={styles.btnBox}>
                <span onClick={this.handleRetry}>{t('retry')}</span>
              </div>
            </div>
          }
        />

        <LoadingText visible={isNetworkLoading} textKey={1} />
      </React.Fragment>,
      document.body,
    );
  }
}

export default withTranslation()(NetworkTip);
