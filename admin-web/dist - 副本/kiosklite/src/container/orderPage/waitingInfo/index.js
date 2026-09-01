import React, {
  useMemo,
  useEffect,
  useImperativeHandle,
  forwardRef,
  useRef,
} from 'react';
import styles from './waitingInfo.module.scss';
import { connect } from 'react-redux';
import { Trans, withTranslation } from 'react-i18next';
import { fetchSystemConfig, getMarginappFetchConfig } from '@/api';
import { setSelfConfig, initConfigParams } from '@/actions';

const DEFAULT_OVER_TIME_CLOSE = 30; // 默认超时关闭时间（分钟）
const DEFAULT_OVER_NUMBER = 10; // 默认展示区间的杯数
const DEFAULT_OVER_TIME_MINUTES = 10; // 默认展示区间的时长（分钟）
const DEFAULT_RANGE_SUB_MINUTES = 2; // 默认左区间减的时长（分钟）
const DEFAULT_RANGE_ADD_MINUTES = 2; // 默认右区间加的时长（分钟）

const WaitingInfo = forwardRef(
  (
    {
      t,
      selfConfig,
      systemConfig,
      makingCupNum,
      waitingBoxStyle,
      countTextStyle,
      minutesTextStyle,
      isFixed = false, //固定位置模式
      outputNormalText = false, //输出普通样式内容
      innerRef, // 从外层 HOC 传递的 ref
    },
    ref
  ) => {
    // 使用 innerRef 或 ref
    const actualRef = innerRef || ref;
    const waitingBoxRef = useRef(null);
    // kiosk 等待时间关闭时间配置
    const waitingTimeSetting = useMemo(
      () => selfConfig?.configList?.find((e) => e.id === 44)?.value || {},
      [selfConfig]
    );

    // kiosk 等待时间区间展示配置
    const waitingTimeRangeSetting = useMemo(
      () => selfConfig?.configList?.find((e) => e.id === 47)?.value || {},
      [selfConfig]
    );

    // kiosk 等待时长展示类型配置
    const waitingTimeShowType = useMemo(
      () =>
        selfConfig?.configList?.find((e) => e.id === 56)?.value || [
          'count',
          'time',
        ],
      [selfConfig]
    );

    // 当fixed展示时，字体大小的配置
    const waitingTimeFontSize = useMemo(
      () => selfConfig?.configList?.find((e) => e.id === 57)?.value,
      [selfConfig]
    );

    // 当fixed展示时，背景颜色的配置
    const waitingTimeBgColor = useMemo(
      () => selfConfig?.configList?.find((e) => e.id === 58)?.value,
      [selfConfig]
    );

    // 当fixed展示时，字体颜色的配置
    const waitingTimeFontColor = useMemo(
      () => selfConfig?.configList?.find((e) => e.id === 59)?.value,
      [selfConfig]
    );

    const {
      status: waitingFlag = false,
      overTimeClose = DEFAULT_OVER_TIME_CLOSE,
    } = waitingTimeSetting;

    const {
      status: waitingRangeFlag = false,
      overNumber = DEFAULT_OVER_NUMBER,
      overTimeMinutes = DEFAULT_OVER_TIME_MINUTES,
      rangeSubMinutes = DEFAULT_RANGE_SUB_MINUTES,
      rangeAddMinutes = DEFAULT_RANGE_ADD_MINUTES,
    } = waitingTimeRangeSetting;

    const cupSettings = useMemo(
      () => ({
        underCups: systemConfig?.PREPARING_TIME_UNDER_CUPS?.intValue || 0, //未满underCups杯
        underCupsSecond:
          systemConfig?.PREPARING_TIME_UNDER_CUPS_SECONDS?.intValue || 0, //不超过underCups，制作时间（秒）
        upperCups: systemConfig?.PREPARING_TIME_UPPER_CUPS?.intValue || 0,
        upperCupsSecond:
          systemConfig?.PREPARING_TIME_UPPER_CUPS_SECONDS?.intValue || 0, //超过underCups，每upperCups增加upperCupsSecond时间（秒）
        additionalTime:
          systemConfig?.PREPARING_TIME_ADDITIONAL_TIME?.intValue || 0, //附加时间，只加一次
        count:
          (makingCupNum !== null
            ? makingCupNum
            : systemConfig?.PREPARING_ITEM_COUNT?.doubleValue) || 0, //杯数，优先取ws推送的
      }),
      [systemConfig, makingCupNum]
    );

    // 计算总等待时间（秒）
    const waitingTimeTotal = useMemo(() => {
      const {
        count,
        underCups,
        underCupsSecond,
        upperCups,
        upperCupsSecond,
        additionalTime,
      } = cupSettings;

      let basicTime = underCupsSecond + additionalTime;
      if (count <= underCups) return basicTime;

      const extraCups = count - underCups;
      const intervals = Math.ceil(extraCups / upperCups);
      return basicTime + intervals * upperCupsSecond;
    }, [cupSettings]);

    // 控制显示逻辑
    const shouldShow = useMemo(() => {
      const waitingMinutes = Math.ceil(waitingTimeTotal / 60);
      return (
        cupSettings.count > 0 && waitingFlag && waitingMinutes <= overTimeClose
      );
    }, [cupSettings.count, waitingFlag, overTimeClose, waitingTimeTotal]);

    // 通过 ref 暴露 shouldShow 值
    useImperativeHandle(actualRef, () => ({
      shouldShow,
      waitingTimeTotal,
    }));

    // 数据获取逻辑
    useEffect(() => {
      const fetchRequiredData = async () => {
        try {
          // 获取KIOSK配置
          if (!selfConfig?.configList?.length) {
            const res = await getMarginappFetchConfig();
            if (res.data.result.successful) {
              if (res.data.marginAppConfigTypes.length) {
                let obj = res.data.marginAppConfigTypes.find(
                  (p) => p.product == 'KIOSKLITE'
                );
                let configMap = JSON.parse(obj.data);
                setSelfConfig(configMap);
              }
            }
          }

          // 获取系统配置
          if (!Object.keys(systemConfig).length) {
            const res = await fetchSystemConfig();
            if (res?.data) {
              initConfigParams(res.data);
            }
          }
        } catch (error) {
          console.error('Error fetching configurations:', error);
        }
      };

      fetchRequiredData();
    }, [selfConfig, systemConfig]);

    // 展示的等待时间
    const showTimeContent = useMemo(() => {
      if (
        waitingRangeFlag &&
        (cupSettings.count > overNumber ||
          waitingTimeTotal > overTimeMinutes * 60)
      ) {
        const startTime = Math.floor(waitingTimeTotal / 60 - rangeSubMinutes);
        const endTime = Math.ceil(waitingTimeTotal / 60 + rangeAddMinutes);
        return `${startTime}-${endTime}`;
      } else {
        return `${Math.ceil(waitingTimeTotal / 60)}`;
      }
    }, [
      cupSettings.count,
      waitingTimeTotal,
      waitingRangeFlag,
      rangeSubMinutes,
      rangeAddMinutes,
    ]);

    const showCount = waitingTimeShowType.includes('count');
    const showTime = waitingTimeShowType.includes('time');

    // 处理fixed时字体大小调整 
    useEffect(() => {
      if (!isFixed || !waitingBoxRef.current) return;

      const container = waitingBoxRef.current;
      const fontSizeConfig = waitingTimeFontSize || { type: 'default' };
      const { type, fontsizeMultiple = 1 } = fontSizeConfig;

      if (type === 'multiple') {
        // 获取容器内所有文字元素
        const textElements = container.querySelectorAll('span, div');

        textElements.forEach((element) => {
          // 先移除内联样式以获取原始CSS计算值
          const savedInlineStyle = element.style.fontSize;
          element.style.fontSize = '';

          // 获取原始字体大小（从CSS计算得出）
          const computedStyle = window.getComputedStyle(element);
          const baseFontSize = parseFloat(computedStyle.fontSize);

          if (baseFontSize && !isNaN(baseFontSize)) {
            // 计算新的字体大小并应用
            const newFontSize = baseFontSize * fontsizeMultiple;
            element.style.fontSize = `${newFontSize}px`;
          } else if (savedInlineStyle) {
            // 如果获取不到原始值，恢复之前的样式
            element.style.fontSize = savedInlineStyle;
          }
        });

        // 调整容器本身的字体大小
        const savedContainerStyle = container.style.fontSize;
        container.style.fontSize = '';

        const containerComputedStyle = window.getComputedStyle(container);
        const baseContainerFontSize = parseFloat(
          containerComputedStyle.fontSize
        );

        if (baseContainerFontSize && !isNaN(baseContainerFontSize)) {
          const newContainerFontSize = baseContainerFontSize * fontsizeMultiple;
          container.style.fontSize = `${newContainerFontSize}px`;
        } else if (savedContainerStyle) {
          container.style.fontSize = savedContainerStyle;
        }
      } else if (type === 'default') {
        // 恢复默认：移除所有内联字体大小样式，让CSS样式生效
        const textElements = container.querySelectorAll('span, div');
        textElements.forEach((element) => {
          element.style.fontSize = '';
        });
        container.style.fontSize = '';
      }
    }, [
      waitingTimeFontSize?.type,
      waitingTimeFontSize?.fontsizeMultiple,
      isFixed,
      showCount,
      showTime,
      cupSettings.count,
      showTimeContent,
    ]);

    // 处理fixed时背景颜色调整
    useEffect(() => {
      if (!isFixed || !waitingBoxRef.current) return;

      const container = waitingBoxRef.current;
      const bgColorConfig = waitingTimeBgColor || { type: 'default' };
      const { type, customColor } = bgColorConfig;

      if (type === 'custom' && customColor) {
        // 设置自定义背景色
        container.style.backgroundColor = customColor;
      } else if (type === 'default') {
        // 恢复默认：移除内联背景色样式，让CSS样式生效
        container.style.backgroundColor = '';
      }
    }, [
      waitingTimeBgColor?.type,
      waitingTimeBgColor?.customColor,
      isFixed,
    ]);

    // 处理fixed时字体颜色调整
    useEffect(() => {
      if (!isFixed || !waitingBoxRef.current) return;

      const container = waitingBoxRef.current;
      const fontColorConfig = waitingTimeFontColor || { type: 'default' };
      const { type, customColor } = fontColorConfig;

      if (type === 'custom' && customColor) {
        // 获取容器内所有文字元素
        const textElements = container.querySelectorAll('span, div');
        
        // 设置所有文字元素的字体颜色
        textElements.forEach((element) => {
          element.style.color = customColor;
        });
        
        // 设置容器本身的字体颜色
        container.style.color = customColor;
      } else if (type === 'default') {
        // 恢复默认：移除所有内联字体颜色样式，让CSS样式生效
        const textElements = container.querySelectorAll('span, div');
        textElements.forEach((element) => {
          element.style.color = '';
        });
        container.style.color = '';
      }
    }, [
      waitingTimeFontColor?.type,
      waitingTimeFontColor?.customColor,
      isFixed,
      showCount,
      showTime,
      cupSettings.count,
      showTimeContent,
    ]);

    if (!shouldShow) return null;

    return (
      <div
        ref={waitingBoxRef}
        className={isFixed ? styles.waitingBoxFixed : styles.waitingBoxLine}
        style={waitingBoxStyle}
      >
        {showCount && (
          <>
            <Trans
              t={t}
              i18nKey="waiting-time-count"
              values={{
                count: cupSettings.count,
              }}
              components={[
                <span
                  style={countTextStyle}
                  className={
                    !outputNormalText && `${styles.cupCount} ${styles.text}`
                  }
                ></span>,
              ]}
            />
            {showTime &&
              (isFixed || outputNormalText ? <div></div> : <span>, </span>)}
          </>
        )}
        {showTime && (
          <Trans
            t={t}
            i18nKey="waiting-time-minutes"
            values={{
              time: showTimeContent,
            }}
            components={[
              <span
                style={minutesTextStyle}
                className={!outputNormalText && styles.text}
              ></span>,
            ]}
          />
        )}
      </div>
    );
  }
);

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    makingCupNum: state.socket.makingCupNum,
  };
}

// 先包装 withTranslation，再包装 connect
// connect 在 v6+ 默认转发 ref，但需要确保 withTranslation 也能转发
const WaitingInfoWithTranslation = withTranslation()(WaitingInfo);

// 使用 forwardRef 包装 connect 的结果，确保 ref 能传递到内部的 forwardRef 组件
const WaitingInfoWithConnect = connect(mapStateToProps, {
  setSelfConfig,
  initConfigParams,
})(WaitingInfoWithTranslation);

export default React.forwardRef((props, ref) => {
  return <WaitingInfoWithConnect {...props} innerRef={ref} />;
});
