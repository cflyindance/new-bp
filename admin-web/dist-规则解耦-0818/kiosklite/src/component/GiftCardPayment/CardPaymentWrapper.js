import { connect } from 'react-redux';
import styles from './CardPaymentWrapper.module.scss';
import ComboHeader from '@/container/comboPanel/ComboHeader';
import QueryGiftCard from './QueryGiftCard';
import CardList from './CardList';
import CardPartPayInfo from './CardPartPayInfo';

const CardPaymentWrapper = (props) => {
  const {
    onClose,
    handleSelectGiftCard,
    giftCardPaymentInfo,
    showGiftCardPartialPayInfo,
    giftCardFlowMode,
    giftCardQueryFromPartialPay,
    onPayByCard,
    onPayByCash,
    onPayByOtherGiftCard,
    onContinuePayByGiftCard,
    onBackToPartialPay,
    availableCards,
    cardSearchType,
  } = props;

  const isShowingCardList =
    availableCards.length > 0 &&
    !(showGiftCardPartialPayInfo && giftCardPaymentInfo);
  const shouldBackToPartialPay =
    giftCardQueryFromPartialPay || (isShowingCardList && !!giftCardPaymentInfo);

  const handleGoBack = () => {
    if (shouldBackToPartialPay) {
      onBackToPartialPay?.();
      return;
    }
    onClose?.();
  };

  const renderContent = () => {
    // 如果存在礼品卡部分支付信息，优先展示部分支付页面
    if (showGiftCardPartialPayInfo && giftCardPaymentInfo) {
      return (
        <CardPartPayInfo
          giftCardPaymentInfo={giftCardPaymentInfo}
          onPayByCard={onPayByCard}
          onPayByCash={onPayByCash}
          onPayByOtherGiftCard={onPayByOtherGiftCard}
        />
      );
    }

    // 如果已经查到可用礼品卡，则展示卡列表
    if (availableCards.length > 0) {
      // 根据礼品卡流程模式，决定选卡后的处理逻辑
      const handleSelectCard =
        giftCardFlowMode === 'partial_continue'
          ? onContinuePayByGiftCard
          : handleSelectGiftCard;

      return (
        <CardList
          cards={availableCards}
          onSelectCard={handleSelectCard}
          cardSearchType={cardSearchType}
        />
      );
    }

    // 默认展示礼品卡查询页面
    return (
      <QueryGiftCard
        onClose={onClose}
        showBackToPartialPay={giftCardQueryFromPartialPay}
        onBackToPartialPay={onBackToPartialPay}
      />
    );
  };

  return (
    <div className={styles.cardPaymentWrapper}>
      <ComboHeader
        handleGoBack={handleGoBack}
        hideBackButton={showGiftCardPartialPayInfo && !!giftCardPaymentInfo}
      />
      {renderContent()}
    </div>
  );
};

const mapStateToProps = (state) => ({
  availableCards: state.ecard?.availableCards || [],
  cardSearchType: state.ecard?.lastQuery?.cardSearchType || '',
});

export default connect(mapStateToProps, null)(CardPaymentWrapper);
