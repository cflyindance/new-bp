import React from 'react';
import { withTranslation } from 'react-i18next';
import styles from './CardList.module.scss';
import GIFT_CARD_IMAGE from '@/assets/images/gift-card-image.png';
import { CARD_NUMBER } from '@/constants/constantUnit';

const getAvailableCards = (cards) =>
  (cards || []).filter((card) => (Number(card?.balance) || 0) > 0);

const formatMoney = (value) => `$${Number(value || 0).toFixed(2)}`;

const formatDate = (dateString) => {
  if (!dateString) {
    return '';
  }

  const date = new Date(dateString);

  if (Number.isNaN(date.getTime())) {
    return String(dateString);
  }

  return date.toISOString().slice(0, 10);
};

const maskCardNumber = (cardNumber) => {
  const digits = String(cardNumber || '').replace(/\s+/g, '');

  if (digits?.length <= 4) {
    return 'xxxx';
  }

  const maskedDigits = `${digits.slice(0, -4)}xxxx`;

  return maskedDigits.replace(/(.{4})/g, '$1 ').trim();
};

const CardList = ({ cards, onSelectCard, t, cardSearchType }) => {
  const availableCards = getAvailableCards(cards);
  const totalBalance = availableCards.reduce(
    (sum, card) => sum + (Number(card?.balance) || 0),
    0
  );
  const isCardNumberQuery = cardSearchType === CARD_NUMBER;
  const titleKey = isCardNumberQuery
    ? 'gift_card_details_title'
    : 'gift_card_list_title';

  return (
    <div className={styles.cardListContainer}>
      <div className={styles.content}>
        <h2 className={styles.title}>{t(titleKey)}</h2>

        {availableCards.length === 0 ? (
          <div className={styles.emptyState}>
            {t('no_available_gift_cards')}
          </div>
        ) : (
          <>
            {!isCardNumberQuery ? (
              <div className={styles.summaryCard}>
                <div className={styles.summaryBlock}>
                  <div className={styles.summaryLabel}>
                    {t('gift_card_total_balance')}
                  </div>
                  <div className={styles.summaryValue}>
                    {formatMoney(totalBalance)}
                  </div>
                </div>

                <div className={styles.summaryBlock}>
                  <div className={styles.summaryLabel}>
                    {t('gift_card_total_cards')}
                  </div>
                  <div className={styles.summaryValue}>
                    {availableCards.length}
                  </div>
                </div>
              </div>
            ) : null}

            <div
              className={`${styles.cardList} ${
                isCardNumberQuery ? styles.detailsList : ''
              }`}
            >
              {availableCards.map((card, index) => {
                const expiresAt = formatDate(card?.giftCardExpiration);

                return (
                  <div
                    key={card?.cardNumber || index}
                    className={styles.cardItem}
                  >
                    <img
                      className={styles.cardArtwork}
                      src={GIFT_CARD_IMAGE}
                      alt="gift card image"
                    />

                    <div className={styles.cardMain}>
                      <div className={styles.cardNumber}>
                        {maskCardNumber(card?.cardNumber)}
                      </div>

                      <div className={styles.balanceRow}>
                        <span className={styles.balanceLabel}>
                          {t('gift_card_balance_label')}
                        </span>
                        <span className={styles.balanceValue}>
                          {formatMoney(card?.balance)}
                        </span>
                      </div>

                      {expiresAt ? (
                        <div className={styles.expiryTag}>
                          {t('gift_card_expires_label', { date: expiresAt })}
                        </div>
                      ) : null}
                    </div>

                    <button
                      type="button"
                      className={`${styles.actionButton} ${styles.redeemButton} linear-animate-btn`}
                      onClick={() => onSelectCard && onSelectCard(card)}
                    >
                      {t('gift_card_redeem')}
                    </button>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default withTranslation()(CardList);
