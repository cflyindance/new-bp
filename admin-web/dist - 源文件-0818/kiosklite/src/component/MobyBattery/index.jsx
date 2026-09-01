// <!--展示Moby电量-->
import { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { getCookie } from '@/utils';
import styles from './MobyBattery.module.scss';
import battery1 from '@/assets/images/battery1.png';
import battery5 from '@/assets/images/battery5.png';
import battery10 from '@/assets/images/battery10.png';
import battery20 from '@/assets/images/battery20.png';
import battery30 from '@/assets/images/battery30.png';
import battery40 from '@/assets/images/battery40.png';
import battery50 from '@/assets/images/battery50.png';
import battery60 from '@/assets/images/battery60.png';
import battery70 from '@/assets/images/battery70.png';
import battery80 from '@/assets/images/battery80.png';
import battery90 from '@/assets/images/battery90.png';
import battery100 from '@/assets/images/battery100.png';
import batteryNull from '@/assets/images/batteryNull.png';

const MobyBattery = (props) => {
  const {
    sysCookie: { mobyDeviceInfo, mobyDeviceLinkStatus },
  } = props;

  const batteryLevel =
    (mobyDeviceInfo?.batteryLevel ??
      mobyDeviceInfo?.status?.battery?.level) ?? null;
  const [isShow, setIsShow] = useState(false);
  const [linkImgUrl, setNetImgUrl] = useState(batteryNull);
  const batteryLevelMap = {
    4: battery1,
    9: battery5,
    19: battery10,
    29: battery20,
    39: battery30,
    49: battery40,
    59: battery50,
    69: battery60,
    79: battery70,
    89: battery80,
    99: battery90,
    100: battery100,
  };

  useEffect(() => {
    // 当前设备非 moby 卡机，隐藏图标; 在 pos 中打开了配置页也隐藏; 卡机断联时也隐藏;
    if (
      getCookie('serviceTarget') === 'INGENICO' &&
      window.self === window.top &&
      mobyDeviceLinkStatus === 1
    ) {
      setIsShow(true);
      if (batteryLevel === null) {
        setNetImgUrl(batteryNull);
        return;
      }
      const levelForIcon = batteryLevel === 0 ? 4 : batteryLevel;
      for (const threshold of Object.keys(batteryLevelMap)
        .map(Number)
        .sort((a, b) => a - b)) {
        if (levelForIcon <= threshold) {
          setNetImgUrl(batteryLevelMap[threshold]);
          break;
        }
      }
    } else {
      setIsShow(false);
    }
  }, [batteryLevel, mobyDeviceLinkStatus, getCookie('serviceTarget')]);

  return (
    isShow && (
      <div id={styles.kioskMobyBattery}>
        <img className={styles.linkImg} src={linkImgUrl} alt="moby battery" />
        <div className={styles.batteryTxt}>
          {batteryLevel !== null ? batteryLevel : '--'}%
        </div>
      </div>
    )
  );
};

function mapStateToProps(state) {
  return {
    sysCookie: state.sysCookie,
  };
}

export default connect(mapStateToProps)(MobyBattery);
