import React, { useMemo } from 'react';
import { Col, Row, Select } from 'antd';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';
import { editCurrentBlockProps } from '@/actions/posterPro';

const buildQuickAmountValue = (amountInfo = {}) => {
  const { rechargeAmount = '', bonusAmount, saveAmount } = amountInfo;
  const amountType = saveAmount ? 'save' : bonusAmount ? 'bonus' : 'base';
  const amountValue =
    amountType === 'save'
      ? saveAmount ?? ''
      : amountType === 'bonus'
        ? bonusAmount ?? ''
        : '';

  return `${rechargeAmount}_${amountType}_${amountValue}`;
};

const BlockBuyGiftCardAmount = (props) => {
  const { t } = useTranslation();
  const { posterPro, ecard, editCurrentBlockProps } = props;
  const { currentBlock } = posterPro;
  const quickAmounts = ecard?.quickAmounts || [];

  const options = useMemo(() => {
    return quickAmounts.map((amountInfo) => ({
      value: buildQuickAmountValue(amountInfo),
      label: amountInfo.label
        ? t(amountInfo.label, {
            amount: amountInfo.rechargeAmount,
            bonusAmount: amountInfo.bonusAmount,
            saveAmount: amountInfo.saveAmount,
          })
        : String(amountInfo.rechargeAmount),
    }));
  }, [quickAmounts, t]);

  const handleChange = (value) => {
    const selectedAmount =
      quickAmounts.find(
        (amountInfo) => buildQuickAmountValue(amountInfo) === value
      ) || null;

    editCurrentBlockProps({
      quickAmount: selectedAmount,
    });
  };

  return (
    <Row align="middle">
      <Col span={10}>{t('blocks.buyGiftCard_label')}:</Col>
      <Col span={14}>
        <Select
          classNames={{ popup: { root: 'kiosk_tree_select' } }}
          placeholder={t('blocks.buyGiftCard_label')}
          style={{ width: '100%' }}
          value={buildQuickAmountValue(currentBlock?.props?.quickAmount)}
          options={options}
          onChange={handleChange}
          getPopupContainer={(node) => node.parentNode}
        />
      </Col>
    </Row>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
    ecard: state.ecard,
  };
};

export default connect(mapStateToProps, { editCurrentBlockProps })(
  BlockBuyGiftCardAmount
);
