import React, { useState, useEffect } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './receiptModal.module.scss';
import Dialog from '../dialog';
import Icon from '../icon';
import MenusifuLoading from '../menusifuLoading';
import maskPhoneNumber from '@/utils/maskPhoneNumber';

const DELAY = 600;

const ReceiptModal = (props) => {
  const {
    t,
    loadObj,
    currentOrder,
    countDownTime,
    handleClose,
    isShowReceipt,
    isBuyGiftCardOrderFn,
    buyGiftCardOrderPhone,
    systemConfig,
    allSysConfig,
    selfConfig,
  } = props;
  const {
    customer: { phone },
    saveOrderResult: { orderNumber },
  } = currentOrder;
  const [show, setShow] = useState(false);

  useEffect(() => {
    let timer;
    if (isShowReceipt) {
      // isShowReceipt 为 true，启动定时器，600ms后显示
      timer = setTimeout(() => {
        setShow(true);
      }, DELAY);
    } else {
      // isShowReceipt 为 false，取消定时器，立即隐藏
      clearTimeout(timer);
      setShow(false);
    }
    // 清理函数，组件卸载或 isShowReceipt 变化时调用
    return () => clearTimeout(timer);
  }, [isShowReceipt]);

  // 判断是否开通纸质收据（id:8，0：自动打印、1：手动打印、2：不打印）
  const judgePrintByConfig = () => {
    return selfConfig?.configMap?.id_8;
  };

  // 是否展示纸质收据按钮
  const judgeShowPrintBtn = () => {
    let isOpenPrint = allSysConfig?.RECEIPT_PRINT === 'true'; // pos
    return !!(isOpenPrint && judgePrintByConfig() === 1);
  };

  // 判断是否开通SMS收据（id:9，0：自动打印、1：手动打印、2：不打印）
  const judgeSMSByConfig = () => {
    return selfConfig?.configMap?.id_9;
  };

  // 是否展示SMS收据按钮
  const judgeShowSMSBtn = () => {
    // 配置项-(SMS收据自动0，手动1，不打2)(id: 9)
    return !!(
      systemConfig.KIOSK_SEND_MESSAGE?.booleanValue &&
      currentOrder.saveOrderResult.customer?.phone[0]?.number &&
      judgeSMSByConfig() === 1
    );
  };

  const isBuyGiftCardOrderShowSMS = () => {
    const smsPhoneNumber = buyGiftCardOrderPhone || '';
    const isShowConditionSatisfy = isBuyGiftCardOrderFn() && !!smsPhoneNumber;

    return !!(
      systemConfig.KIOSK_SEND_MESSAGE?.booleanValue &&
      isShowConditionSatisfy &&
      judgeSMSByConfig() === 1
    );
  };

  let isShowPrint = judgeShowPrintBtn();
  let isShowSMS = judgeShowSMSBtn() || isBuyGiftCardOrderShowSMS();

  let phoneNum = phone[0]?.number || buyGiftCardOrderPhone || '';
  phoneNum = phoneNum ? '+1' + maskPhoneNumber(phoneNum.slice(-10)) : '';

  if (!show) {
    return null;
  }

  // 短信类型弹框消息
  if (loadObj.type == 'msg') {
    const { msgDone, handleNoReceipt, handleSendMsg, handlePrint } = loadObj;
    let loadingMsg =
      msgDone == 'ing' ? (
        <div className={styles.loadBox}>
          <MenusifuLoading />
          <div className={styles.orderBox}>
            <div className={styles.msg}>
              {t('phone-msg-loading-title')}
              <br />
              {phoneNum}
            </div>
            <div className={styles.orderNumBox}>
              <div>{orderNumber}</div>
              <div>{t('order_number')}</div>
            </div>
          </div>
        </div>
      ) : msgDone == 'success' ? (
        <div className={[styles.successBox, styles.msgSuccessBox].join(' ')}>
          <div className={styles.top}>
            <Icon type="check" size={8} color="#6FCF68" />
            <div className={styles.orderBox}>
              <div className={styles.msg}>
                <div>
                  {t('phone-msg-success-title')}
                  <br />
                  {phoneNum}
                </div>
              </div>
              <div className={styles.orderNumBox}>
                <div>{orderNumber}</div>
                <div>{t('order_number')}</div>
              </div>
            </div>
          </div>
          <div className={styles.closeBtn} onClick={handleClose}>
            {t('close')} ({countDownTime}s)
          </div>
        </div>
      ) : (
        <div className={styles.failBox}>
          <div className={styles.top}>
            <Icon type="svg_warn" size={8} />
            <div className={styles.orderBox}>
              <div className={styles.msg}>
                <div>{t('phone-msg-fail-title')}</div>
              </div>
              <div className={styles.orderNumBox}>
                <div>{orderNumber}</div>
                <div>{t('order_number')}</div>
              </div>

              {isShowPrint ? (
                <div className={styles.btnBox}>
                  <span onClick={handlePrint}>{t('print')}</span>
                  <span onClick={handleSendMsg}>{t('send-again')}</span>
                </div>
              ) : (
                <div className={styles.btnBox}>
                  <span onClick={handleNoReceipt}>{t('no-receipt')}</span>
                  <span onClick={handleSendMsg}>{t('send-again')}</span>
                </div>
              )}
            </div>
          </div>
          {isShowPrint && (
            <div className={styles.close} onClick={handleNoReceipt}>
              {t('no-receipt')}
            </div>
          )}
        </div>
      );
    return <Dialog visible={show} html={loadingMsg} />;
  } else if (loadObj.type == 'print') {
    // 打印机类型弹框消息
    const { msgDone, handleSendMsg, handlePrint, handleNoReceipt } = loadObj;
    let loadingMsg =
      msgDone == 'ing' ? (
        <div className={styles.loadBox}>
          <MenusifuLoading />
          <div className={styles.itemBox}>
            <div className={styles.itemName}>
              {t('print-msg-loading-title')}
            </div>
            <div className={styles.subItemName}>{t('wait')}</div>
          </div>
        </div>
      ) : msgDone == 'success' ? (
        <div className={[styles.successBox, styles.msgSuccessBox].join(' ')}>
          <div className={styles.top}>
            <Icon type="check" size={8} color="#6FCF68" />
            <div className={styles.orderBox}>
              <div className={styles.msg}>
                <div>{t('print-msg-success-title')}</div>
                <div>{t('take-receipt')}</div>
              </div>
              <i className={styles.printImg}></i>
            </div>
          </div>
          <div className={styles.closeBtn} onClick={handleClose}>
            {t('close')} ({countDownTime}s)
          </div>
        </div>
      ) : (
        <div className={styles.failBox}>
          <div className={styles.top}>
            <Icon type="svg_warn" size={8} />
            <div className={styles.orderBox}>
              <div className={styles.msg}>
                <div>{t('print-msg-fail-title')}</div>
              </div>
              <div className={styles.orderNumBox}>
                <div>{orderNumber}</div>
                <div>{t('order_number')}</div>
              </div>
              {isShowSMS ? (
                <div className={styles.btnBox}>
                  <span onClick={handlePrint}>{t('print-again')}</span>
                  <span onClick={handleSendMsg}>{t('text-msg')}</span>
                </div>
              ) : (
                <div className={styles.btnBox}>
                  <span onClick={handleNoReceipt}>{t('no-receipt')}</span>
                  <span onClick={handlePrint}>{t('print-again')}</span>
                </div>
              )}
            </div>
          </div>
          {isShowSMS && (
            <div className={styles.close} onClick={handleNoReceipt}>
              {t('no-receipt')}
            </div>
          )}
        </div>
      );
    return <Dialog visible={show} html={loadingMsg} />;
  }
};

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    systemConfig: state.systemConfig,
    allSysConfig: state.allSysConfig,
    currentOrder: state.currentOrder,
  };
}

export default connect(mapStateToProps)(withTranslation()(ReceiptModal));
