import React from 'react';
import styles from './combo.module.scss';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import ComboContent from './comboContent';
import ComboFooter from './footer';
import {
  addCombo2Order,
  initCurrentOrderCombo,
  resetCurrentOrderCombo,
} from '@/actions';
import { setLanModal } from '@/actions';
import arrowLeft from '@/assets/images/arrow-left.png';
import Icon from '@/component/icon';
import { getDishItemLanguage } from '@/utils/busTools';
import getComboSectionItem from '@/utils/getComboSectionItem';
import { systemLanguage } from '@/constants/mockData';
import LangSwitch from '@/component/LangSwitch';

const defaultMax = 99;
class ComboModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isOpenLanSwitch: false,
      isOpenMulLanSelect: false,
      comboAllChildDish: [], // 所有combo的子菜（id > 0）
      sectionIndex: 0,
      sectionId: null,
      sectionList: null,
      orderDishCount: 1,
      showRequireId: null,
    };
    this.generalUsePanelDom = React.createRef();
  }

  componentDidMount() {
    if (this.props.currentOrderCombo.length == 0) {
      const { currentCategoryList, currentItem } = this.props;
      const itemInfo = { ...currentItem };
      const currentCategory = currentCategoryList?.find((cate) =>
        cate.saleItems?.find((item) => item.id === itemInfo.id)
      );
      this.props.initCurrentOrderCombo(itemInfo, currentCategory);
    }
    this.judegIsShowLangSwitch();
  }

  componentWillUnmount() {
    this.props.resetCurrentOrderCombo();
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
      if (props.currentItem.categoryOptions) {
        sectionList.push({
          id: -3,
          name: t('item_option'),
          key: 'item_option',
          numOfItemOptionAllowed:
            props?.currentItem?.numOfItemOptionAllowed || 0,
        });
      }

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

  setCurSectionId = (i, sectionList = this.state.sectionList) => {
    // comboItems选中子菜的options一栏，则跳转到id = -1处
    if (sectionList[i]?.id == -2) {
      this.setState({
        sectionIndex: 0,
        sectionId: -1,
      });
    } else if (sectionList[i]?.id == -3) {
      this.setState({
        sectionIndex: i,
        sectionId: -3,
      });
    } else {
      this.setState({
        sectionIndex: i,
        sectionId: sectionList[i]?.id,
      });
    }
  };

  // 调用子组件的置顶函数
  handleChildUpTop = (idx) => {
    this.generalUsePanelDom.comboStepUpTop(idx);
  };

  // 自选套餐组合，选中菜品合规则，跳转其他页面的逻辑
  submitCurrentOrderCombo = () => {
    const { currentOrderCombo, currentItem } = this.props;
    const { orderDishCount } = this.state;
    const tempCurrentItem = Object.assign({}, currentItem);

    // 如果含有itemprices选项，自选套餐的price价格要置为0，改由sectionDetail里面保存sizeInfo来计算
    let isItemPrice =
      tempCurrentItem.itemPrices && tempCurrentItem.itemPrices.length > 0;
    if (isItemPrice) {
      tempCurrentItem.price = 0;
    }

    // 添加菜品
    tempCurrentItem.sectionDetail = currentOrderCombo;
    tempCurrentItem.quantity = orderDishCount;
    // 保存选好的套餐
    this.props.addCombo2Order(tempCurrentItem);
    this.props.onCloseModal();
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

  // 展示语言开关
  judegIsShowLangSwitch = () => {
    const { selfConfig } = this.props;

    if (selfConfig?.configMap?.id_10?.length === 2) {
      this.setState({ isOpenLanSwitch: true, isOpenMulLanSelect: false });
    } else {
      this.setState({ isOpenLanSwitch: false, isOpenMulLanSelect: true });
    }
  };

  handleLang = (flag) => {
    this.props.setLanModal(flag);
  };

  render() {
    const {
      currentItem,
      i18n: { language },
      onCloseModal,
    } = this.props;
    const {
      sectionIndex,
      sectionList,
      sectionId,
      comboAllChildDish,
      orderDishCount,
      showRequireId,
      isOpenLanSwitch,
      isOpenMulLanSelect,
    } = this.state;
    if (!currentItem.id) return null;

    const langTxt = systemLanguage.find((item) => item.code == language)?.abbr;

    return (
      <div className={styles.comboModalBx} onClick={(e) => e.stopPropagation()}>
        <div className={styles.header}>
          <div className={styles.navigateLeft}>
            <img
              src={arrowLeft}
              className={styles.backPrePage}
              onClick={onCloseModal}
            />
            {sectionIndex > 0 && (
              <span>
                {getDishItemLanguage(
                  currentItem.fieldDisplayNameGroups,
                  language
                ) || currentItem.name}
              </span>
            )}
          </div>

          <div className={styles.navigateRight}>
            {isOpenLanSwitch && <LangSwitch />}
            {isOpenMulLanSelect && (
              <div
                className={styles.langIcon}
                onClick={() => {
                  this.handleLang(true);
                }}
              >
                <Icon
                  className={styles.languageIcon}
                  type="language"
                  size={3.4}
                  color="#000"
                />
                <div>{langTxt}</div>
              </div>
            )}
          </div>
        </div>

        <ComboContent
          onRef={this.generalUsePanel}
          setCurSectionId={this.setCurSectionId}
          sideNavList={sectionList}
          sideNavId={sectionId}
          comboAllChildDish={comboAllChildDish}
          itemId={currentItem.id}
          showRequireId={showRequireId}
        />
        <div className={styles.footBtnBox}>
          <ComboFooter
            sideNavList={sectionList}
            setCurSectionId={this.setCurSectionId}
            submitCurrentOrderCombo={this.submitCurrentOrderCombo}
            handleChildUpTop={this.handleChildUpTop}
            orderDishCount={orderDishCount}
            changeDishNum={this.changeDishNum}
            showRequireLabel={this.showRequireLabel}
            scrollGeneralUsePanelToTop={this.scrollGeneralUsePanelToTop}
          />
        </div>
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    currentOrder: state.currentOrder,
    currentItem: state.currentItem,
    currentCategoryList: state.currentCategoryList,
    currentOrderCombo: state.currentOrderCombo,
  };
}

export default connect(mapStateToProps, {
  initCurrentOrderCombo,
  resetCurrentOrderCombo,
  addCombo2Order,
  setLanModal,
})(withTranslation()(ComboModal));
