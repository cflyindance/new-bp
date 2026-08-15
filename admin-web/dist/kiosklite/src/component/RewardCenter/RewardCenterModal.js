import RewardCenter from './index';
import Dialog from '@/component/dialog';
import { CloseOutlined } from '@ant-design/icons';
import styles from './RewardCenterModal.module.scss';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { changeFreeItem, changeSelectedDiscount } from '@/actions/crm_action';
import { removeFreeItemInOrder } from '@/actions';
import { EventBus } from '@/utils/EventBus';
import { useCloseModalOnHomePage } from '@/hooks';
import useDeviceOrientation from '@/hooks/useDeviceOrientation';
import remToPx from '@/utils/CountRemToPx';
import {
  isStockSufficient,
  showInsufficientStockToast,
} from '@/utils/validateItemStock';

const RewardCenterModal = (props) => {
  const {
    t,
    crm,
    changeFreeItem,
    changeSelectedDiscount,
    currentOrder: { itemList },
    menuItemList,
    currentOrderCombo,
    removeFreeItemInOrder,
    // props
    visible,
    onClose,
    onConfirm,
  } = props;
  const isLogin = Object.keys(crm.memberCRMInfo ?? {}).length > 0;
  const orientation = useDeviceOrientation();
  const isVertical = orientation === 'vertical';

  useCloseModalOnHomePage(onClose);

  const handleCloseModal = () => {
    onClose?.();
  };

  const handleConfirm = () => {
    if (!isLogin) {
      EventBus.emit('open_login_modal');
      return;
    }
    //删除购物车里积分菜单兑换的商品
    const freeItemInList = itemList.find((item) => item?.isFreeItem);
    if (freeItemInList) {
      removeFreeItemInOrder({
        freeItemId: freeItemInList?.id,
      });
    }
    const selectedCampaign = crm.tempCampaign?.[0];
    if (!selectedCampaign) {
      changeFreeItem([]);
      changeSelectedDiscount({});
    } else {
      const campaignType = selectedCampaign.rewardRule?.redeemRule.strategy;
      // 赠菜需校验库存
      if (
        campaignType === 'byFreeItem' &&
        !isStockSufficient({
          itemInfo: selectedCampaign,
          addQty: selectedCampaign.quantity || 1,
          itemList,
          menuItemList,
          currentOrderCombo,
          crm,
          excludeRewardPending: true,
        })
      ) {
        showInsufficientStockToast();
        return;
      }
      // 兼容在弹窗内切换活动的情况
      // 赠菜
      if (campaignType === 'byFreeItem') {
        changeFreeItem([selectedCampaign]);
        changeSelectedDiscount({});
      } else if (['byPercentageOff', 'byFixedAmount'].includes(campaignType)) {
        // 折扣
        changeSelectedDiscount(selectedCampaign);
        changeFreeItem([]);
      } else if (
        campaignType === 'setPrice' ||
        campaignType === 'orderItemFixedPriceCoupon'
      ) {
        changeFreeItem([]);
        changeSelectedDiscount({});
      }
    }
    onConfirm?.();
  };

  return (
    <Dialog
      visible={visible}
      html={
        <div className={styles.rewardCenterModal}>
          <div
            className={styles.contentWrapper}
            style={{
              padding: isVertical ? '4.7rem 6.5rem 0' : '4.7rem 12rem 0',
            }}
          >
            {!isLogin && (
              <CloseOutlined
                className={styles.closeIcon}
                onClick={handleCloseModal}
              />
            )}
            <RewardCenter height={isVertical ? remToPx(160) : remToPx(84)} />
            <div className={styles.footWrapper} onClick={handleConfirm}>
              <footer className={styles.confirmBtn}>
                {isLogin
                  ? t('confirm_reward', {
                      value: crm.tempCampaign?.length || 0,
                    })
                  : t('login')}
              </footer>
            </div>
          </div>
        </div>
      }
    />
  );
};

function mapStateToProps(state) {
  return {
    crm: state.crm,
    currentOrder: state.currentOrder,
    menuItemList: state.menuItemList,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    changeFreeItem,
    changeSelectedDiscount,
    removeFreeItemInOrder,
  })(withTranslation()(RewardCenterModal))
);
