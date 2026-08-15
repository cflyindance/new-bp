import React, { useCallback, useEffect, useRef, useState } from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import Alert from '@material-ui/lab/Alert';
import styles from './partySizeSelection.module.scss';
import NumPad from '@/component/numPad';
import SoldoutModal from '@/component/soldoutModal';
import CardMinAmount from '@/component/cardMinAmount';
import Loading from '@/component/loading';
import Toast from '@/component/toast';
import {
  payByCard,
  payByCash,
  spliceOrderBySoldout,
  setIsReorderFlag,
  setNumOfGuests,
  setSelfConfig,
  saveOrderResult,
} from '@/actions';
import { runJudgeSMSAfterOperation } from '@/utils/runJudgeSMSAfterOperation';
import {
  judgeConfigToSoldout as judgeConfigToSoldoutUtil,
  calcCardMinAmout,
} from '@/utils/busTools';
import { solveScrollElem } from '@/utils';

const PARTY_SIZE_KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9'];

function PartySizeSelection(props) {
  const {
    t,
    history,
    selfConfig,
    systemConfig,
    store,
    isReorderFlag,
    payByCard: payByCardAction,
    payByCash: payByCashAction,
    saveOrderResult: saveOrderResultAction,
    setNumOfGuests: setNumOfGuestsAction,
    setSelfConfig: setSelfConfigAction,
    spliceOrderBySoldout: spliceOrderBySoldoutAction,
    setIsReorderFlag: setIsReorderFlagAction,
    userId: kioskConfigUserId,
  } = props;

  const [partySize, setPartySize] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorApiMsg, setErrorApiMsg] = useState('');
  const [errorApiShow, setErrorApiShow] = useState(false);
  const [isHasSoldoutDish, setIsHasSoldoutDish] = useState(false);
  const [dishMap, setDishMap] = useState({});
  const [isShowCardMinModal, setIsShowCardMinModal] = useState(false);
  const [currentAmount, setCurrentAmount] = useState(0);
  const timerRef = useRef(null);

  const isRequired = !!selfConfig?.configMap?.id_63;
  const canConfirm = partySize.length > 0;

  const showApiModalTip = useCallback((errMsg) => {
    setErrorApiMsg(errMsg);
    setErrorApiShow(true);
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      setErrorApiShow(false);
      setErrorApiMsg('');
    }, 2000);
  }, []);

  const judgeConfigToSoldout = useCallback(
    (fn) => {
      judgeConfigToSoldoutUtil(fn, {
        setSelfConfig: setSelfConfigAction,
        setState: (partial) => {
          if (partial.isHasSoldoutDish !== undefined) {
            setIsHasSoldoutDish(partial.isHasSoldoutDish);
          }
          if (partial.dishMap !== undefined) {
            setDishMap(partial.dishMap);
          }
        },
        showApiModalTip,
        reorder: () => {
          if (dishMap?.allSoldIds?.length) {
            spliceOrderBySoldoutAction(dishMap.allSoldIds);
          }
          setIsHasSoldoutDish(false);
          setIsReorderFlagAction(true);
          history.goBack();
        },
        onSoldoutDetected: () => solveScrollElem(true),
      });
    },
    [
      dishMap,
      history,
      setIsReorderFlagAction,
      setSelfConfigAction,
      showApiModalTip,
      spliceOrderBySoldoutAction,
    ]
  );

  const judgeFillCardMinAmout = useCallback(() => {
    const minAmount = calcCardMinAmout();
    if (minAmount) {
      setIsShowCardMinModal(true);
      setCurrentAmount(minAmount);
    } else {
      history.push('/cardPayment');
    }
  }, [history]);

  const continueFlow = useCallback(async () => {
    await runJudgeSMSAfterOperation({
      systemConfig,
      selfConfig,
      store,
      history,
      payByCard: payByCardAction,
      payByCash: payByCashAction,
      saveOrderResult: saveOrderResultAction,
      kioskConfigUserId,
      judgeConfigToSoldout,
      judgeFillCardMinAmout,
      setLoading,
      onError: showApiModalTip,
    });
  }, [
    history,
    judgeConfigToSoldout,
    judgeFillCardMinAmout,
    kioskConfigUserId,
    payByCardAction,
    payByCashAction,
    saveOrderResultAction,
    selfConfig,
    showApiModalTip,
    store,
    systemConfig,
  ]);

  useEffect(() => {
    if (isReorderFlag) {
      history.goBack();
    }
  }, [history, isReorderFlag]);

  useEffect(() => {
    return () => clearTimeout(timerRef.current);
  }, []);

  const handleNumPadPress = (key) => {
    setPartySize(String(key));
  };

  const handleSkip = async () => {
    setNumOfGuestsAction(null);
    await continueFlow();
  };

  const handleConfirm = async () => {
    if (!canConfirm) {
      Toast.info(t('party-size-select-tip'), 2000);
      return;
    }
    const guests = parseInt(partySize, 10);
    if (!partySize || Number.isNaN(guests) || guests < 1) {
      Toast.info(t('party-size-select-tip'), 2000);
      return;
    }
    setNumOfGuestsAction(guests);
    await continueFlow();
  };

  const reorder = () => {
    if (dishMap?.allSoldIds?.length) {
      spliceOrderBySoldoutAction(dishMap.allSoldIds);
    }
    setIsHasSoldoutDish(false);
    setIsReorderFlagAction(true);
    history.goBack();
  };

  const continueReorder = () => {
    if (dishMap?.allSoldIds?.length) {
      spliceOrderBySoldoutAction(dishMap.allSoldIds);
    }
    setIsHasSoldoutDish(false);
    if (partySize) {
      handleConfirm();
    } else {
      handleSkip();
    }
  };

  return (
    <div
      className={styles.partySizePage}
      style={{ visibility: isReorderFlag ? 'hidden' : 'visible' }}
    >
      <div className={styles.partySizePageBox}>
        <div className={styles.partySizeTitle}>{t('select-party-size')}</div>

        <div className={styles.numPadWrap}>
          <NumPad
            keys={PARTY_SIZE_KEYS}
            mode="direct"
            selectedKey={partySize}
            showDelete={false}
            keyPress={handleNumPadPress}
          />
        </div>

        <div className={styles.actionRow}>
          {!isRequired && (
            <div className={styles.never} onClick={handleSkip}>
              {t('skip')}
            </div>
          )}
          <div
            className={[
              styles.btnConfirm,
              canConfirm ? `linear-animate-btn` : styles.btnNoConfirm,
            ].join(' ')}
            onClick={handleConfirm}
          >
            {t('confirm')}
          </div>
        </div>
      </div>

      {isHasSoldoutDish ? (
        <SoldoutModal
          isHasSoldoutDish={isHasSoldoutDish}
          dishMap={dishMap}
          reorder={reorder}
          continueReorder={continueReorder}
        />
      ) : null}

      {isShowCardMinModal ? (
        <CardMinAmount
          isShowCardMinModal={isShowCardMinModal}
          currentAmount={currentAmount}
          handleContinueOrder={() => {
            setIsShowCardMinModal(false);
            reorder();
          }}
          handleCloseMin={() => setIsShowCardMinModal(false)}
        />
      ) : null}

      {errorApiShow ? (
        <Alert variant="filled" severity="error">
          {errorApiMsg}
        </Alert>
      ) : null}
      <Loading visible={loading} />
    </div>
  );
}

function mapStateToProps(state) {
  return {
    store: state,
    systemConfig: state.systemConfig,
    selfConfig: state.selfConfig,
    isReorderFlag: state.orderEdit.isReorderFlag,
    userId: state.sysCookie.kioskConfigUserId,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    payByCard,
    payByCash,
    spliceOrderBySoldout,
    setIsReorderFlag,
    setNumOfGuests,
    setSelfConfig,
    saveOrderResult,
  })(withTranslation()(PartySizeSelection))
);
