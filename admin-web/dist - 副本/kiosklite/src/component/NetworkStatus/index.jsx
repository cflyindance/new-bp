// <!--展示网络信息-->
import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import styles from './NetworkStatus.module.scss';
import NETWORK_BEST from '@/assets/images/net_best.png';
import NETWORK_BETTER from '@/assets/images/net_better.png';
import NETWORK_GOOD from '@/assets/images/net_good.png';
import NETWORK_BARE from '@/assets/images/net_bare.png';
import NETWORK_NONE from '@/assets/images/net_none.png';

const formatLocalTime = (date) =>
  [date.getHours(), date.getMinutes(), date.getSeconds()]
    .map((value) => `0${value}`.slice(-2))
    .join(':');

const NetworkStatus = (props) => {
  const {
    sysCookie: { networkStatus },
  } = props;
  const [isShow, setIsShow] = useState(true);
  const [netImgUrl, setNetImgUrl] = useState(NETWORK_NONE);
  const [localTime, setLocalTime] = useState(() => formatLocalTime(new Date()));

  useEffect(() => {
    // 是否在iframe中，在-> 在pos中打开了配置页, 隐藏网络信息
    if (window.self !== window.top) {
      setIsShow(false);
    }
  }, []);

  useEffect(() => {
    // 网络状态更新
    const { rtt } = networkStatus;
    let src;
    if (rtt < 0) {
      src = NETWORK_NONE;
    } else if (rtt >= 0 && rtt <= 50) {
      src = NETWORK_BEST;
    } else if (rtt >= 51 && rtt <= 150) {
      src = NETWORK_BETTER;
    } else if (rtt >= 151 && rtt <= 300) {
      src = NETWORK_GOOD;
    } else if (rtt > 300) {
      src = NETWORK_BARE;
    } else {
      src = NETWORK_NONE;
    }
    setNetImgUrl(() => src);
  }, [networkStatus]);

  useEffect(() => {
    const timer = setInterval(() => {
      setLocalTime(formatLocalTime(new Date()));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  return (
    isShow && (
      <div id={styles.kioskNetworkStatus}>
        <img
          className={styles.netImg}
          src={netImgUrl}
          alt="system network status"
        />
        <time className={styles.localTime}>{localTime}</time>
      </div>
    )
  );
};

function mapStateToProps(state) {
  return {
    sysCookie: state.sysCookie,
  };
}

export default connect(mapStateToProps)(NetworkStatus);
