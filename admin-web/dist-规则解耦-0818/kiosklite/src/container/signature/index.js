import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Alert from '@material-ui/lab/Alert';
import CanvasDraw from 'react-canvas-draw';
import styles from './signature.module.scss';
import CallModal from '../../component/callModal';
import SignatureModal from '../../component/signatureModal';
import Loading from '../../component/loading';
import { sendSignature, printOrder } from '@/api';
import { sendError2MsgCenter } from '@/api/apiUtil';
import { getCookie, judgeSskeyIsActiveTime } from '@/utils';
import { markPostPaymentAction } from '@/actions';

class Signature extends React.Component {
  constructor(props) {
    super(props);
    const isIosStandalonePage =
      props.isStandalonePage && window.isIosShell && window.isIosShell();
    this.state = {
      signatureWidth: isIosStandalonePage ? 1600 : 800,
      signatureHeight: isIosStandalonePage ? 800 : 400,
      loading: false,
      disabled: true,
      errorApiMsg: '',
      errorApiShow: false,
      signaLoading: false,
      signaLoadObj: {},
      callLoading: false,
      callLoadObj: {},
      saveOrderId: '',
    };
    this.signatureDraw = React.createRef();
    this.saveableCanvas = React.createRef();
    this.timer = null;
    this.lastConfirmTriggerAt = 0;
  }

  // 接口报错提示
  showApiModalTip = (errMsg) => {
    this.setState({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  clearDraw = () => {
    if (!this.state.disabled) {
      this.saveableCanvas.clear();
      this.setState({
        disabled: true,
        loading: false,
      });
    }
  };

  // 根据状态，显示弹框
  handleSetSignature = (status) => {
    this.setState({
      signaLoading: true,
      signaLoadObj: {
        msgDone: status,
        handlePrint: this.handlePrintSignature,
        handleSkip: this.handleSkipSignature,
      },
    });
  };

  handlePrintSignature = () => {
    this.setState({
      signaLoading: true,
      signaLoadObj: {
        msgDone: 'ing',
      },
    });
    judgeSskeyIsActiveTime().then(() => this.handlePrintOrder());
  };

  handleSkipSignature = () => {
    this.setState({
      signaLoading: false,
      signaLoadObj: {},
    });
    this.props.history.push('/orderFinish');
  };

  // 打印支付收据（customer copy）
  handlePrintOrder = () => {
    if (
      this.props.currentOrder?.postPaymentActions?.paymentReceiptPrinted
    ) {
      this.handleSkipSignature();
      return;
    }
    const printObj = {
      paymentReceiptType: 'CUSTOMER_COPY',
      paymentId: this.props.currentOrder.savePaymentId,
      userAuth: {
        sessionKey: getCookie('sessionKey'),
      },
    };
    printOrder(printObj)
      .then((printRes) => {
        if (printRes.data.result?.successful) {
          this.props.markPostPaymentAction('paymentReceiptPrinted');
          this.handleSkipSignature();
        } else {
          this.handleSetSignature('fail');
          if (this.props.currentOrder.saveOrderResult?.id) {
            sendError2MsgCenter(
              this.props.currentOrder.saveOrderResult.id,
              'Printing failed'
            );
          }
        }
      })
      .catch(() => {
        this.handleSetSignature('fail');
        if (this.props.currentOrder.saveOrderResult?.id) {
          sendError2MsgCenter(
            this.props.currentOrder.saveOrderResult.id,
            'Printing failed'
          );
        }
      });
  };

  // 判断是否开通打印收据（id:7，0：自动打印、1：手动打印、2：不打印）
  judgePrintOrderByConfig = () => {
    const { selfConfig } = this.props;
    const value = selfConfig?.configMap?.id_7;
    if (value === 0) {
      judgeSskeyIsActiveTime().then(() => this.handlePrintOrder());
    } else if (value === 1) {
      this.handleSetSignature('open');
    } else if (value === 2) {
      this.handleSkipSignature();
    } else {
      this.handleSkipSignature();
    }
  };

  saverDraw = async () => {
    if (!this.state.disabled) {
      this.setState({
        disabled: true,
        loading: true,
      });
      // afterCreditCardPay 页面传递的方法
      if (this.props.handlePayTip) {
        const payTipRes = await this.props.handlePayTip?.(true);
        if (!payTipRes) {
          this.setState({
            disabled: false,
            loading: false,
          });
          return;
        }
      }
      if (this.props.currentOrder?.postPaymentActions?.signatureSubmitted) {
        this.setState({
          disabled: false,
          loading: false,
        });
        this.judgePrintOrderByConfig();
        return;
      }
      try {
        let pic = this.saveableCanvas.canvas.drawing.toDataURL('image/png', 1);
        let signatureData = {
          paymentId: this.props.currentOrder.savePaymentId,
          signature: pic,
        };
        const res = await sendSignature(signatureData);
        if (res.data.resultType.successful) {
          this.props.markPostPaymentAction('signatureSubmitted');
          this.judgePrintOrderByConfig();
        } else {
          this.showApiModalTip(res.data?.resultType?.failureReason);
        }
      } catch (err) {
        this.showApiModalTip(err?.message);
      } finally {
        this.setState({
          disabled: false,
          loading: false,
        });
      }
    }
  };

  handleConfirmTrigger = async () => {
    const now = Date.now();
    if (now - this.lastConfirmTriggerAt < 1000) {
      return;
    }

    this.lastConfirmTriggerAt = now;
    await this.saverDraw();
  };

  componentWillUnmount() {
    clearTimeout(this.timer);
  }

  render() {
    const {
      t,
      // afterCreditCardPay 页面传递的属性
      showTitle = true,
      agreement = 'top',
      customContentStyle = {},
      customContainerStyle = {},
      signHeight = 0,
    } = this.props;

    const {
      errorApiShow,
      errorApiMsg,
      loading,
      signaLoading,
      signaLoadObj,
      callLoading,
      callLoadObj,
    } = this.state;

    return (
      <div style={customContainerStyle || {}} className={styles.orderSignature}>
        <div className={styles.signatureContainer}>
          {showTitle && <div className={styles.header}>{t('sign-title')} </div>}
          {agreement === 'top' && (
            <div className={styles.menuName}>{t('sigAgreement')}</div>
          )}
          <div
            style={customContentStyle || {}}
            className={styles.signatureDrawBx}
          >
            <div className={styles.signatureDraw} ref={this.signatureDraw}>
              <CanvasDraw
                ref={(canvasDraw) => (this.saveableCanvas = canvasDraw)}
                canvasWidth={this.state.signatureWidth}
                canvasHeight={signHeight || this.state.signatureHeight}
                brushRadius={4}
                lazyRadius={0}
                hideGrid={false}
                hideInterface={true}
                onChange={() => {
                  this.setState({ disabled: false });
                }}
              />
            </div>
          </div>
          {agreement === 'bottom' && (
            <div style={{ margin: '2rem 0 0' }} className={styles.menuName}>
              {t('sigAgreement')}
            </div>
          )}
          <div className={styles.footBtnBox}>
            <div
              className={`${styles.backBtn} ${this.state.disabled ? styles.noActived : ''}`}
              onClick={this.clearDraw}
            >
              {t('clear')}
            </div>
            <div
              className={[
                styles.editBtn,
                this.state.disabled
                  ? styles.noActived
                  : `${styles.actived} linear-animate-btn`,
              ].join(' ')}
              onPointerUp={this.handleConfirmTrigger}
              onClick={this.handleConfirmTrigger}
            >
              <span>{t('confirm')}</span>
            </div>
          </div>
        </div>

        <Loading visible={loading} />

        {signaLoading ? (
          <SignatureModal signaLoading={signaLoading} loadObj={signaLoadObj} />
        ) : null}

        {callLoading ? (
          <CallModal callLoading={callLoading} loadObj={callLoadObj} />
        ) : null}

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
      </div>
    );
  }
}

const mapStateToProps = (state) => ({
  selfConfig: state.selfConfig,
  currentOrder: state.currentOrder,
});

export default connect(mapStateToProps, {
  markPostPaymentAction,
})(withTranslation()(Signature));
