import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './fullComboPanel.module.scss';
import SideNav from '../../../component/sidenav';
import Toast from '../../../component/toast';
import GeneralUsePanel from './generalUsePanel';
import ComboFooter from '../comboFooter';
import { addCombo2Order, replaceComboOrder } from '@/actions';
import { getDishItemLanguage } from '@/utils/busTools';
import getComboSectionItem from '../../../utils/getComboSectionItem';
import DescModal from '@/component/DescModal';
import {
  checkIsCampaignValid,
  handleCheckFreeItem,
} from '@/utils/CRMIntegration/checkCRMIntegrationCampaign';
import { setTempCampaign } from '@/actions/crm_action';
import { posFrontLog } from '@/api';
import buildComboSizeList from './buildComboSizeList';

const defaultMax = 99;

class FullComboPanel extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      comboAllChildDish: [], // 所有combo的子菜（id > 0）
      sectionIndex: 0,
      sectionId: null,
      sectionList: null,
      orderDishCount: 1,
      showRequireId: null,
      // DescModal 相关状态
      descVisible: false,
      descValue: '',
      descTitle: '',
      descCallback: null,
    };
    this.sideNavDom = React.createRef();
    this.generalUsePanelDom = React.createRef();
    this.listRef = React.createRef();
    // 套餐级诊断日志：整个 FullComboPanel 生命周期内只打一遍
    this._comboDiagLogged = false;
  }

  generalUsePanel = (ref) => {
    this.generalUsePanelDom = ref;
  };

  // 初始化sideNav
  static getDerivedStateFromProps(props, state) {
    if (props.currentItem.id != undefined && state.sectionList == null) {
      const sectionList = Object.assign([], props.currentItem.comboSections);
      const {
        t,
        i18n: { language },
        currentOrder,
        currentCategoryList,
      } = props;

      sectionList.unshift({
        id: -1,
        name:
          getDishItemLanguage(
            props.currentItem.fieldDisplayNameGroups,
            language
          ) || props.currentItem.name,
        info: props.currentItem,
      });

      // 类的options
      if (props.currentItem.categoryOptions?.length > 0) {
        sectionList.push({
          id: -3,
          name: t('item_option'),
          key: 'item_option',
          numOfItemOptionAllowed:
            props?.currentItem?.numOfItemOptionAllowed || 0,
        });
      }

      // 添加 Sides 和 Drinks 菜类到步骤条最后
      // const { menuGroup } = props;
      // const sideDrinkMenu = menuGroup.find((g) => g.name === 'Menu');
      // if (sideDrinkMenu?.menuCategories?.length > 0) {
      //   // 从SideDrinkMenu 查找 Sides 和 Drinks
      //   const sidesCategory = sideDrinkMenu.menuCategories?.find(
      //     (c) => c?.name === 'Sides'
      //   );
      //   const drinksCategory = sideDrinkMenu.menuCategories?.find(
      //     (c) => c?.name === 'Drinks'
      //   );
      //
      //   // Sides (-99)
      //   if (sidesCategory?.saleItems?.length > 0) {
      //     sectionList.push({
      //       id: -99,
      //       name: sidesCategory.name,
      //       fieldDisplayNameGroups: sidesCategory.fieldDisplayNameGroups,
      //       saleItems: sidesCategory.saleItems,
      //       isOptionalSection: true,
      //     });
      //   }
      //
      //   // Drinks (-98)
      //   if (drinksCategory?.saleItems?.length > 0) {
      //     sectionList.push({
      //       id: -98,
      //       name: drinksCategory.name,
      //       fieldDisplayNameGroups: drinksCategory.fieldDisplayNameGroups,
      //       saleItems: drinksCategory.saleItems,
      //       isOptionalSection: true,
      //     });
      //   }
      // }

      const sectionId = sectionList[state.sectionIndex].id;

      // 汇总所有combo下的子菜
      const comboAllChildDish = getComboSectionItem(
        sectionList,
        currentCategoryList,
        currentOrder
      );

      return {
        sectionList,
        sectionId,
        comboAllChildDish,
      };
    }
    return null;
  }

  componentDidMount() {
    this._isMounted = true;
    // 当前是否是编辑菜品阶段
    if (this.props.isOrderEdit) {
      let idx = this.props.comboPanelIdx;
      const { editComboQty } = this.props;
      this.setState({
        orderDishCount: editComboQty,
      });
      if (idx) {
        this.setCurSectionId(idx);
        setTimeout(() => {
          this.handleChildUpTop(idx);
        }, 0);
      }
    }
    this.logComboDiagOnceIfNeeded();
    // 无规格套餐 itemPrices 为空是终态，下一帧确认后补打
    setTimeout(() => {
      this._comboDiagAllowEmptyPrices = true;
      this.logComboDiagOnceIfNeeded();
    }, 0);
  }

  componentDidUpdate(prevProps) {
    if (this._comboDiagLogged) return;
    const prevPricesLen = prevProps.currentItem?.itemPrices?.length || 0;
    const currPricesLen = this.props.currentItem?.itemPrices?.length || 0;
    if (
      prevProps.currentOrder?.orderType !==
        this.props.currentOrder?.orderType ||
      (prevPricesLen === 0 && currPricesLen > 0)
    ) {
      this.logComboDiagOnceIfNeeded();
    }
  }

  // 进入当前套餐时上报一次 orderType / itemPrices / comboSizeList
  logComboDiagOnceIfNeeded = async () => {
    if (this._comboDiagLogged) return;
    const { currentItem, currentOrder } = this.props;
    const itemId = currentItem?.id ?? currentItem?.itemId;
    if (!itemId) return;

    const itemPrices = currentItem?.itemPrices || [];
    if (itemPrices.length === 0 && !this._comboDiagAllowEmptyPrices) {
      return;
    }

    this._comboDiagLogged = true;
    const comboSizeList = buildComboSizeList(currentItem, currentOrder);

    try {
      await posFrontLog(
        `--currentOrder.orderType-- : ${currentOrder?.orderType} `
      ).catch(() => {});
      if (itemPrices.length) {
        for (const item of itemPrices) {
          await posFrontLog(
            `--itemPrices-- : ${item?.itemId} - ${item?.id} - ${item?.size} - ${item?.type}`
          ).catch(() => {});
        }
      }
      if (comboSizeList.length) {
        for (const item of comboSizeList) {
          await posFrontLog(
            `--comboSizeList-- : ${item?.itemId} - ${item?.id} - ${item?.size} - ${item?.type}`
          ).catch(() => {});
        }
      }
    } catch (error) {
      // 静默处理错误，不影响业务流程
    }
  };

  componentWillUnmount() {
    this._isMounted = false;
    if (this._showDomInViewTimer) {
      clearTimeout(this._showDomInViewTimer);
    }
  }

  // 展示在视窗内
  showDomInView = (i) => {
    if (this._showDomInViewTimer) {
      clearTimeout(this._showDomInViewTimer);
    }
    this._showDomInViewTimer = setTimeout(() => {
      this._showDomInViewTimer = null;
      if (!this._isMounted || !this.sideNavDom) return;
      const childDom =
        this.sideNavDom.current?.firstElementChild?.childNodes[i];
      childDom?.scrollIntoViewIfNeeded(true);
    }, 0);
  };

  // 选中步骤（点击 sideNav / footer 跳转）
  setCurSectionId = (i, sectionList = this.state.sectionList) => {
    const activeIdx = sectionList[i]?.id == -2 ? 0 : i;
    this.generalUsePanelDom?.setActiveSectionIdx(activeIdx);
    // comboItems选中子菜的options一栏，则跳转到id = -1处
    if (sectionList[i]?.id == -2) {
      this.setState({
        sectionIndex: 0,
        sectionId: -1,
      });
      this.showDomInView(0);
    } else if (sectionList[i]?.id == -3) {
      this.setState({
        sectionIndex: i,
        sectionId: -3,
      });
      this.showDomInView(i);
    } else {
      this.setState({
        sectionIndex: i,
        sectionId: sectionList[i]?.id,
      });
      this.showDomInView(i);
    }
  };

  // 滚动联动 sideNav 高亮（仅更新 sideNav，不触发 GeneralUsePanel 重渲染）
  onScrollSectionChange = (i, sectionList = this.state.sectionList) => {
    let sectionIndex = i;
    let sectionId = sectionList[i]?.id;
    if (sectionList[i]?.id == -2) {
      sectionIndex = 0;
      sectionId = -1;
    }
    if (
      this.state.sectionIndex === sectionIndex &&
      this.state.sectionId === sectionId
    ) {
      return;
    }
    this.setState({ sectionIndex, sectionId });
  };

  // 调用子组件的置顶函数
  handleChildUpTop = (idx) => {
    this.generalUsePanelDom.comboStepUpTop(idx);
  };

  // 自选套餐组合，选中菜品合规则，跳转其他页面的逻辑
  submitCurrentOrderCombo = async () => {
    const {
      t,
      currentOrderCombo,
      currentItem,
      isOrderEdit,
      isInFreeItem = false,
      isSpecialItem = false,
      onAddFreeItem,
      isPromotionItem,
      isExchangePurchase = false,
      onEditPromotionItem,
      selectedPromotion,
      editingSequence,
      promotion: { buyGifts },
      avocado: { outletInfo, metaData },
      ruleId,
    } = this.props;
    const { orderDishCount } = this.state;
    const tempCurrentItem = Object.assign({}, currentItem);
    // crm集成加入到购物车没有被校验过时
    if (
      currentItem.isFreeItem &&
      outletInfo?.enabled === 1 &&
      !currentItem.crmIntegrationRule
    ) {
      const res = await checkIsCampaignValid({
        coupons: [currentItem],
        metaData,
      });
      const rule = res?.[0];
      handleCheckFreeItem({ rule });
      if (!rule.crmIntegrationRule.isValid) {
        this.props.onCloseModal();
        return;
      }
      const { couponTemplate, crmIntegrationRule } = rule;
      tempCurrentItem.couponTemplate = couponTemplate;
      tempCurrentItem.crmIntegrationRule = crmIntegrationRule;
    }

    // 如果含有itemprices选项，自选套餐的price价格要置为0，改由sectionDetail里面保存sizeInfo来计算
    let isItemPrice =
      tempCurrentItem.itemPrices && tempCurrentItem.itemPrices.length > 0;
    if (isItemPrice) {
      tempCurrentItem.price = 0;
    }
    // 编辑菜品阶段
    if (isOrderEdit) {
      tempCurrentItem.sectionDetail = currentOrderCombo;
      // 重新编辑，数量取存的值
      tempCurrentItem.quantity = orderDishCount;

      if (
        isPromotionItem &&
        onEditPromotionItem &&
        selectedPromotion?.length &&
        !currentItem.isLocalExchangePurchaseItem
      ) {
        tempCurrentItem.ruleId = ruleId;
        onEditPromotionItem(tempCurrentItem, ruleId);
      } else {
        this.props.replaceComboOrder(
          tempCurrentItem,
          editingSequence ?? tempCurrentItem.sequence
        );
      }
      Toast.info(t('edit-success'), 1000);
      this.props.onCloseModal();
    } else {
      // 添加菜品
      tempCurrentItem.sectionDetail = currentOrderCombo;
      tempCurrentItem.quantity = orderDishCount;
      // 添加freeItem
      if ((isInFreeItem && !currentItem.isFreeItem) || isSpecialItem) {
        onAddFreeItem({
          remark: { optionName: '', optionType: 'NOTE', quantity: 1, price: 0 },
          ...tempCurrentItem,
        });
        this.props.onCloseModal();
        return;
      } else if (isPromotionItem) {
        // 已选择赠菜,但未加入购物车时列表编辑
        if (buyGifts?.length && selectedPromotion?.length) {
          onEditPromotionItem(tempCurrentItem, ruleId);
        } else {
          // 未加入购物车时,添加、列表编辑
          onEditPromotionItem({
            remark: {
              optionName: '',
              optionType: 'NOTE',
              quantity: 1,
              price: 0,
            },
            promotionItem: true,
            ruleId: ruleId,
            ...tempCurrentItem,
          });
        }
        this.props.onCloseModal();
        return;
      }
      // 保存选好的套餐
      this.props.addCombo2Order(tempCurrentItem);
      // 在菜品列表中的freeItem
      if (tempCurrentItem.isFreeItem) {
        this.props.setTempCampaign([tempCurrentItem]);
      }
      this.props.onCloseModal();
    }
  };

  changeDishNum = (num) => {
    if (num > defaultMax || num < 1) return;
    this.setState({
      orderDishCount: num,
    });
  };

  showRequireLabel = (id) => {
    this.setState({
      showRequireId: id,
    });
  };

  scrollGeneralUsePanelToTop = () => {
    this.generalUsePanelDom?.scrollToTop();
  };

  // DescModal 相关方法
  showDescModal = (title, value, callback) => {
    this.setState({
      descVisible: true,
      descTitle: title,
      descValue: value || '',
      descCallback: callback,
    });
  };

  hideDescModal = () => {
    this.setState({
      descVisible: false,
      descValue: '',
      descTitle: '',
      descCallback: null,
    });
  };

  handleDescModalConfirm = (value) => {
    const { descCallback } = this.state;
    if (descCallback) {
      descCallback(value);
    }
    this.hideDescModal();
  };

  render() {
    const {
      currentItem,
      selfConfig,
      onCloseModal,
      isInFreeItem = false,
      isSpecialItem = false,
      onAddFreeItem,
      isPromotionItem,
      isExchangePurchase = false,
      max,
      t,
      itemPoints,
      itemVoucherPrice,
      state,
    } = this.props;

    const {
      sectionIndex,
      sectionList,
      sectionId,
      comboAllChildDish,
      orderDishCount,
      showRequireId,
      descVisible,
      descValue,
      descTitle,
    } = this.state;

    let comboPanel = null;
    // 判断是否开启自主套餐sideNav（id:19）
    const isShowComboSideNav = selfConfig?.configMap?.id_19;

    if (currentItem.id && sectionList) {
      comboPanel = (
        <div className={styles.comboStepBox}>
          <div
            style={{
              display: isShowComboSideNav ? 'block' : 'none',
            }}
            className={styles.sctHeaderContainer}
            ref={this.sideNavDom}
          >
            {/* 步骤条 */}
            <SideNav
              sideNavList={sectionList}
              setCurSectionId={this.setCurSectionId}
              sectionIndex={sectionIndex}
              handleChildUpTop={this.handleChildUpTop}
              isInFreeItem={isInFreeItem}
              isPromotionItem={isPromotionItem}
            />
          </div>

          <div
            id="fullComboPanelId"
            style={{
              marginLeft: isShowComboSideNav ? '32rem' : '0',
            }}
            className={styles.fullComboPanel}
          >
            {/* 对应步骤显示内容区域 */}
            <GeneralUsePanel
              onRef={this.generalUsePanel}
              setCurSectionId={this.setCurSectionId}
              onScrollSectionChange={this.onScrollSectionChange}
              sideNavList={sectionList}
              comboAllChildDish={comboAllChildDish}
              itemId={currentItem.id}
              isInFreeItem={isInFreeItem}
              isSpecialItem={isSpecialItem}
              isPromotionItem={isPromotionItem}
              isExchangePurchase={isExchangePurchase}
              itemPoints={itemPoints}
              itemVoucherPrice={itemVoucherPrice}
              showRequireId={showRequireId}
              showDescModal={this.showDescModal}
              onScroll={this.props.onScroll}
            />
          </div>
          <div className={styles.footBtnBox}>
            <ComboFooter
              sideNavList={sectionList}
              isInFreeItem={isInFreeItem}
              isSpecialItem={isSpecialItem}
              isPromotionItem={isPromotionItem}
              isExchangePurchase={isExchangePurchase}
              onAddFreeItem={onAddFreeItem}
              max={max}
              itemPoints={itemPoints}
              itemVoucherPrice={itemVoucherPrice}
              setCurSectionId={this.setCurSectionId}
              submitCurrentOrderCombo={this.submitCurrentOrderCombo}
              handleChildUpTop={this.handleChildUpTop}
              orderDishCount={orderDishCount}
              changeDishNum={this.changeDishNum}
              showRequireLabel={this.showRequireLabel}
              handleGoBack={onCloseModal}
              scrollGeneralUsePanelToTop={this.scrollGeneralUsePanelToTop}
            />
          </div>

          <DescModal
            preVal={descValue}
            visible={descVisible}
            title={descTitle}
            onClose={this.hideDescModal}
            onSetVal={this.handleDescModalConfirm}
          />
        </div>
      );
    }
    return comboPanel;
  }
}

function mapStateToProps(state) {
  return {
    currentCategoryList: state.currentCategoryList,
    currentOrder: state.currentOrder,
    isOrderEdit: state.orderEdit.isOrderEdit,
    editComboQty: state.orderEdit.editComboQty,
    currentItem: state.currentItem,
    currentOrderCombo: state.currentOrderCombo,
    selfConfig: state.selfConfig,
    promotion: state.promotion,
    avocado: state.avocado,
    menuGroup: state.menuGroup,
  };
}

export default connect(mapStateToProps, {
  addCombo2Order,
  replaceComboOrder,
  setTempCampaign,
})(withTranslation()(FullComboPanel));
