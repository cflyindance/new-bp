import React, { useState, useEffect, useRef } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './NewMemberGift.module.scss';
import STAR from '@/assets/images/star.png';
import coinSmile from '@/assets/lottie/coin_smile.json';
import clickLoading from '@/assets/lottie/check2.json';
import Dialog from '@/component/dialog';
import ImgCard from '@/component/imgCard';
import LottiePlayer from '@/component/LottiePlayer';
import useReward from '@/hooks/useReward';
import dayjs from 'dayjs';

const countMin = 1;

const NewMemberGift = (props) => {
  const {
    visible,
    t,
    allSysConfig,
    selfConfig,
    currentOrder,
    avocado,
    onboardGiftRule,
    handleConfirm,
    menuGroup,
    comboMenu,
    crm: { rewardRule },
  } = props;
  const { rewards, vouchers, metaData } = avocado;
  const points = onboardGiftRule?.data?.[0]?.giftContent?.number || 0;
  const [isClicked, setIsClicked] = useState(false);
  const [smileComplete, setSmileComplete] = useState(false);
  const [isShowCount, setIsShowCount] = useState(false);
  const [kioskVoucherList, setKioskVoucherList] = useState([]);
  const timeoutRefs = useRef([]);

  const handleClaim = () => {
    setIsClicked(true);
  };

  const handleSmileComplete = () => {
    setSmileComplete(true);
    let showCount = kioskVoucherList.some((item) => {
      const { voucherRules } = item;
      const { quantity = 1 } = voucherRules || {};
      return quantity > countMin;
    });
    if (showCount) {
      const timeout1 = setTimeout(() => {
        setIsShowCount(true);
        // 展示数字的动画延迟1500ms执行
      }, 1500);

      // 滚动list
      const timeout2 = setTimeout(() => {
        vourcherListRolling();
        // 2600=count动画300ms,延迟1500ms执行；滚动延迟800ms
      }, 2600);

      timeoutRefs.current = [timeout1, timeout2];
    } else {
      // 滚动list
      const timeout = setTimeout(() => {
        vourcherListRolling();
        // 滚动延迟800ms
      }, 800);

      timeoutRefs.current = [timeout];
    }
  };

  // 添加清理定时器的 useEffect
  useEffect(() => {
    return () => {
      // 组件卸载时清理所有定时器
      timeoutRefs.current.forEach((timeoutId) => {
        if (timeoutId) {
          clearTimeout(timeoutId);
        }
      });
      timeoutRefs.current = [];
    };
  }, []);

  const vourcherListRolling = () => {
    // 获取滚动容器元素
    const voucherListElement = document.querySelector(`.${styles.voucherList}`);
    if (!voucherListElement) return;

    // 计算总滚动距离（从顶部到底部）
    const scrollHeight = voucherListElement.scrollHeight;
    const clientHeight = voucherListElement.clientHeight;
    const maxScrollTop = scrollHeight - clientHeight;

    // 如果内容不需要滚动，直接返回
    if (maxScrollTop <= 0) return;

    // 设置初始位置（顶部）
    voucherListElement.scrollTop = 0;

    // 计算滚动步长，确保在300ms内完成
    const duration = 300;
    const startTime = Date.now();
    const startScrollTop = 0;
    const endScrollTop = maxScrollTop;

    const animateScroll = () => {
      const currentTime = Date.now();
      const elapsed = currentTime - startTime;

      if (elapsed >= duration) {
        // 动画完成，滚动到底部
        voucherListElement.scrollTop = endScrollTop;
        return;
      }

      // 使用缓动函数计算当前滚动位置
      const progress = elapsed / duration;
      const easeOutCubic = 1 - Math.pow(1 - progress, 3); // 缓出三次方函数
      const currentScrollTop =
        startScrollTop + (endScrollTop - startScrollTop) * easeOutCubic;

      voucherListElement.scrollTop = currentScrollTop;

      // 继续动画
      requestAnimationFrame(animateScroll);
    };

    // 开始动画
    requestAnimationFrame(animateScroll);
  };

  const handleClickComplete = () => {
    handleConfirm();
  };

  const { voucherList } = useReward({
    rewards,
    vouchers,
    allSysConfig,
    menuGroup,
    comboMenu,
    metaData,
    rewardRule,
    currentOrder,
  });

  useEffect(() => {
    if (!Array.isArray(voucherList)) return;
    setKioskVoucherList(voucherList);
  }, [voucherList]);

  return (
    <Dialog
      outerStyle={{ background: 'rgba(0, 0, 0, 0.8)' }}
      visible={visible}
      html={
        <div
          className={styles.containerBox}
          onClick={(e) => e.stopPropagation()}
        >
          <div className={styles.welCome}>{t('crm_gift_title')}</div>
          <div className={styles.welComeContent}>
            <div className={styles.welComeSub}>
              <div className={styles.swipeImageBx}>
                <LottiePlayer
                  speed={0.6}
                  animationData={coinSmile}
                  loop={false}
                  onComplete={handleSmileComplete}
                />
              </div>
              <div className={styles.desc}>{t('crm_gift_welcome_text')}</div>

              {!kioskVoucherList.length > 0 && points > 0 && (
                <div className={styles.point}>
                  <img src={STAR} alt="point" className={styles.pointImg} />
                  <span className={styles.pointNum}>{points}</span>
                  <span className={styles.pointTxt}>{t('pts')}</span>
                </div>
              )}
            </div>
            {kioskVoucherList.length > 0 && (
              <div className={styles.rewardBlock}>
                {points > 0 && (
                  <div className={styles.point}>
                    <img src={STAR} alt="point" className={styles.pointImg} />
                    <span className={styles.pointNum}>
                      {onboardGiftRule?.data?.[0]?.giftContent?.number}
                    </span>
                    <span className={styles.pointTxt}>{t('pts')}</span>
                  </div>
                )}
                <div className={styles.voucherBlock}>
                  <div className={`${styles.voucherList}`}>
                    {kioskVoucherList.map((item, index) => {
                      const { name, useEndTime, voucherRules, extSkuMapping } =
                        item;
                      const { minSpend = 0, quantity = 1 } = voucherRules || {};

                      // 过期时间
                      const expires = useEndTime
                        ? t('voucher_period', {
                            value: dayjs(useEndTime).format('YYYY/MM/DD'),
                          })
                        : t('permanently_voucher');
                      // 最低门槛
                      const threshold = minSpend
                        ? t('use_voucher_condition', {
                            value: `$${minSpend}`,
                          })
                        : t('all_order_voucher');
                      // 赠品券 - 安全地检查 extSkuMapping 是否存在
                      const isItem = extSkuMapping?.length > 0;

                      return (
                        <div className={styles.voucherItem} key={index}>
                          <div className={styles.voucher}>
                            <div className={styles.voucherContent}>
                              <div className={styles.voucherExpire}>
                                {expires}
                              </div>
                              <div className={styles.voucherName}>{name}</div>
                              <div className={styles.voucherMinSpend}>
                                {threshold}
                              </div>
                            </div>
                            {isItem && (
                              <div className={styles.voucherImg}>
                                <ImgCard
                                  selfConfig={selfConfig}
                                  itemInfo={extSkuMapping[0]}
                                />
                              </div>
                            )}
                          </div>
                          {quantity > countMin &&
                            smileComplete &&
                            isShowCount && (
                              <div
                                className={`${styles.count} ${isShowCount ? styles.countShow : ''}`}
                              >
                                X {quantity}
                              </div>
                            )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}
          </div>
          <div
            onClick={handleClaim}
            className={`${styles.btnSubmit} linear-animate-btn`}
          >
            {isClicked ? (
              <div className={styles.clickImageBx}>
                <LottiePlayer
                  animationData={clickLoading}
                  loop={false}
                  onComplete={handleClickComplete}
                />
              </div>
            ) : (
              t('crm_gift_continue')
            )}
          </div>
        </div>
      }
    />
  );
};

const mapStateToProps = (state) => {
  return {
    crm: state.crm,
    allSysConfig: state.allSysConfig,
    selfConfig: state.selfConfig,
    avocado: state.avocado,
    menuGroup: state.menuGroup,
    comboMenu: state.comboMenu,
    currentOrder: state.currentOrder,
  };
};
export default connect(mapStateToProps)(withTranslation()(NewMemberGift));
