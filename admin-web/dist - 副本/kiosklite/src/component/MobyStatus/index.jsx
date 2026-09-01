// <!--展示Moby状态-->
import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { getCookie } from '@/utils';
import styles from './MobyStatus.module.scss';
import MOBY_OFF from '@/assets/images/mobyOff.png';
import MOBY_ON from '@/assets/images/mobyOn.png';

const MobyStatus = (props) => {
  const {
    sysCookie: { mobyDeviceLinkStatus },
  } = props;
  const [isShow, setIsShow] = useState(false);
  const [linkImgUrl, setNetImgUrl] = useState(MOBY_OFF);

  useEffect(() => {
    // 当前设备非 moby 卡机，隐藏图标; 是否在 iframe 中，在 pos 中打开了配置页, 隐藏;
    if (
      getCookie('serviceTarget') === 'INGENICO' &&
      window.self === window.top
    ) {
      if (mobyDeviceLinkStatus === null || mobyDeviceLinkStatus === -1) {
        // 初始状态，隐藏图标
        setIsShow(false);
      } else if (mobyDeviceLinkStatus === 1) {
        // 连接成功，显示开启图标
        setNetImgUrl(MOBY_ON);
        setIsShow(true);
      } else if (mobyDeviceLinkStatus === 0) {
        // 连接失败，显示关闭图标
        setNetImgUrl(MOBY_OFF);
        setIsShow(true);
      } else {
        // 其他未知状态，
        setIsShow(false);
      }
    } else {
      setIsShow(false);
    }
  }, [mobyDeviceLinkStatus, getCookie('serviceTarget')]);

  return (
    isShow && (
      <div id={styles.kioskMobyStatus}>
        <img className={styles.linkImg} src={linkImgUrl} alt="moby status" />
      </div>
    )
  );
};

function mapStateToProps(state) {
  return {
    sysCookie: state.sysCookie,
  };
}

export default connect(mapStateToProps)(MobyStatus);
