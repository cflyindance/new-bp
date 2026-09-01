import React from 'react';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import Dialog from '@/component/dialog';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import styles from './comboItemsDetailModal.module.scss';
import Toast from '@/component/toast';
import floatNumberRounding from '@/utils/formatNumberRounding';
import { getItemPrice } from '@/utils/priceCalculator';
import _ from 'lodash';
import {
  removeFootItemComboSection,
  removeFootOptComboSection,
  clearFootItemComboSection,
  replaceComboOrder,
  setEditComboQty,
} from '@/actions';
import { solveScrollElem } from '@/utils';
import {
  getOneUncompletedSection,
  allRangHandler,
  getCurrentItemLanguage,
  getDishItemLanguage,
  getItemSizeName,
} from '@/utils/busTools';
import cloneDeep from 'lodash/cloneDeep';
import POINT from '@/assets/images/star.png';

import Big from 'big.js';
import { getPromotionModalDisplayPrice } from '@/utils/localExchangePurchase';
const defaultMax = 99;

class ComboItemsDetailModal extends React.Component {
  constructor() {
    super();
    this.state = {
      sectionId: null,
      itemInfo: {},
      isSpecial: false,
      cloneSideNavList: [],
      maxNum: defaultMax,
      chooseNum: 1,
      orderPanelShow: false,
    };
  }

  // 打开drawer
  viewOrderPanel = (e) => {
    let chooseNum = 1;
    if (this.props.history.location.pathname.indexOf('/orderReview') > -1) {
      chooseNum = this.props?.comboInfo?.quantity || 1;
    }
    this.setState(
      {
        sectionId: e?.sectionId || null,
        itemInfo: e?.itemInfo || {},
        chooseNum,
        orderPanelShow: true,
      },
      () => {
        solveScrollElem(true);
      }
    );
  };

  // 关闭drawer
  closePanel = () => {
    solveScrollElem(false);
    this.setState({
      sectionId: null,
      itemInfo: {},
      orderPanelShow: false,
    });
  };

  // 提取选择菜品的size，options等
  showCollectOptions = (list, p, isInFreeItem, isPromotionItem) => {
    const {
      i18n: { language },
      isExchangePurchase = false,
    } = this.props;
    const isPromotionItemFree = isPromotionItem && !isExchangePurchase;
    let sizeArr = [];
    let optionArr = [];
    let remarkArr = [];

    // 判断是否有size，itemPrices
    let isHas = list.find((p) => p.id == -1);
    // ${_.round(sizeInfo.price, 2).toFixed(2)
    if (!isHas) {
      // sizeArr.push(`$${p.price}`);
      sizeArr.push(
        '$' +
          (isInFreeItem || isPromotionItemFree
            ? '0.00'
            : _.round(p.price, 2).toFixed(2))
      );
    }
    // 判断是否有remark
    if (p?.remark?.optionName) {
      remarkArr.push(p.remark.optionName);
    }

    if (list && list.length) {
      list.forEach((item) => {
        if (item.sizeInfo) {
          let size = getItemSizeName(
            item.sizeInfo.sizeId,
            item.sizeInfo.size,
            this.props.itemSizeList,
            language
          );
          sizeArr.push(
            `${size}($${isInFreeItem || isPromotionItemFree ? '0.00' : _.round(item.sizeInfo.price, 2).toFixed(2)})`
          );
        }
        if (item.options && item.options.length) {
          let t = item.options.reduce((pre, cur) => {
            let nameStr =
              (cur?.fieldDisplayNameGroups?.length &&
                getCurrentItemLanguage(cur.fieldDisplayNameGroups, language)) ||
              cur.name;

            if (cur.id in pre) {
              pre[cur.id].count++;
            } else {
              pre[cur.id] = {
                count: 1,
                name: nameStr,
                price: cur.price,
              };
            }
            return pre;
          }, {});

          let tArr = [];
          for (let g in t) {
            tArr.push(t[g]);
          }

          tArr.forEach((tItem) => {
            optionArr.push(
              `${tItem.name}($${isInFreeItem || isPromotionItemFree ? '0.00' : tItem.price})x${tItem.count}`
            );
          });
        }
      });
    }
    let nList = [...sizeArr, ...optionArr, ...remarkArr];

    return nList.join(', ');
  };

  // 点击continue choose，跳转对应sidenav
  handleJumpItems = (obj) => {
    const { sideNavList, isOrderEdit } = this.props;
    let r = !!(
      this.props.history.location.pathname.indexOf('/orderReview') > -1
    );
    let idx = 0;
    if (obj.id == -2) {
      idx = 0;
    } else {
      idx = sideNavList?.findIndex((s) => s.id == obj.id) ?? 0;
    }
    // 当前是编辑状态且当前处于购物车页面
    if (isOrderEdit && r) {
      this.props.setEditComboQty(this.state.chooseNum);
      // this.props.history.push({ pathname: '/comboPanel', query: { idx } });
      this.props.openComboDetail(idx);
      this.setState({
        orderPanelShow: false,
      });
    } else {
      //this.props.setCurSectionId(idx);
      //this.props.handleChildUpTop(idx);
      // 关闭combo详情框
      this.closePanel();
    }
  };

  // 删除每一小项的菜Items，options
  handleRemoveItems = (sectionId, p, idx) => {
    const { t, sideNavList, isOrderEdit } = this.props;
    let r = !!(
      this.props.history.location.pathname.indexOf('/orderReview') > -1
    );

    if (sectionId > 0) {
      this.props.removeFootItemComboSection({ sectionId, idx, sideNavList });
    } else {
      this.props.removeFootOptComboSection({ sectionId, p });
    }
    // Toast.info(t('delete-tip'), 1000);

    if (isOrderEdit && r) {
      let i = 0;
      if (sectionId == -2) {
        i = 0;
      } else {
        i = sideNavList?.findIndex((s) => s.id == sectionId) ?? 0;
      }
      this.props.setEditComboQty(this.state.chooseNum);
      // this.props.history.push({ pathname: '/comboPanel', query: { idx: i } });
      this.props.openComboDetail(idx);
      this.setState({
        orderPanelShow: false,
      });
    }
  };

  // 全部清空每一项下的菜Items
  handleClearItems = (id) => {
    const { t, sideNavList, isOrderEdit } = this.props;
    let r = !!(
      this.props.history.location.pathname.indexOf('/orderReview') > -1
    );
    this.props.clearFootItemComboSection({ id });
    // Toast.info(t('delete-tip'), 1000);
    if (isOrderEdit && r) {
      let i = 0;
      if (id == -2) {
        i = 0;
      } else {
        i = sideNavList?.findIndex((s) => s.id == id) ?? 0;
      }
      this.props.setEditComboQty(this.state.chooseNum);
      // this.props.history.push({ pathname: '/comboPanel', query: { idx: i } });
      this.props.openComboDetail(i);
      this.setState({
        orderPanelShow: false,
      });
    }
  };

  calcPrice = (list) => {
    let o = {};
    if (list.length) {
      list.forEach((r) => {
        if (r.sizeInfo) {
          if (r.sizeInfo.id) {
            o[r.id] = {
              t: r.sizeInfo.price,
              subList: [r.sizeInfo.price],
            };
          } else {
            o[r.id] = {
              t: '0.00',
              subList: [],
            };
          }
        } else if (r.items && r.items.length) {
          let fItemsList = r.items;
          if (fItemsList.length) {
            let t = Big(0); // 每一项菜品总价
            let subList = []; // 每小项菜品的价格
            fItemsList.forEach((o) => {
              let subT = Big(getItemPrice(o)).times(o.quantity).toNumber();
              t = t.plus(subT);
              subList.push(subT);
            });
            o[r.id] = {
              t: t.toNumber(),
              subList,
            };
          }
        } else if (r.options && r.options.length) {
          let fItemsList = r.options;
          if (fItemsList.length) {
            let t = Big(0); // 每一项菜品总价
            let subList = []; // 每小项菜品的价格
            fItemsList.forEach((o) => {
              let subT = Big(getItemPrice(o)).times(o.quantity).toNumber();
              t = t.plus(subT);
              subList.push(subT);
            });
            o[r.id] = {
              t: t.toNumber(),
              subList,
            };
          }
        }
      });
    }
    return o;
  };

  // 计算总价格
  calcTotalPrice = (obj) => {
    let t = Big(0);
    for (let k in obj) {
      t = t.plus(Big(obj[k].t));
    }
    return floatNumberRounding(t.toNumber());
  };

  changeChooseNum(isAdd) {
    const { t } = this.props;
    let { maxNum, chooseNum } = this.state;
    let n = isAdd ? chooseNum + 1 : chooseNum - 1;
    // 最大提示
    if (n >= maxNum) {
      Toast.info(t('max-up', { rplc: defaultMax }), 1000);
    }
    this.setState({
      chooseNum: n,
    });
  }

  addOrder = () => {
    const { t, currentOrderCombo, currentItem } = this.props;
    const tempCurrentItem = Object.assign({}, currentItem);
    tempCurrentItem.sectionDetail = currentOrderCombo;
    tempCurrentItem.quantity = this.state.chooseNum;
    this.props.replaceComboOrder(tempCurrentItem, tempCurrentItem.sequence);
    Toast.info(t('edit-success'), 1000);
    this.closePanel();
  };

  // 通过id，查询对应的下标
  findIndexByItemId = (list, itemId) => {
    let i = list.findIndex((_) => _.id == itemId);
    return i;
  };

  componentDidMount() {
    this.props.onRef(this);
  }

  componentDidUpdate(prevProps, prevState) {
    if (
      this.state.orderPanelShow &&
      prevState.orderPanelShow != this.state.orderPanelShow
    ) {
      const { sideNavList, currentOrderCombo } = this.props;

      // 标记一种特殊情况：自选套餐有详情（size，其他options，描述，图片等），但是无size类型，则没有id: -1
      let isSpecial = false;
      const cloneSideNavList = cloneDeep(sideNavList);
      let isHasSize = !!currentOrderCombo.find((s) => s.id == -1);
      if (!isHasSize) {
        isSpecial = true;
        let i = cloneSideNavList.findIndex((side) => side.id == -1);
        if (i > -1) {
          cloneSideNavList.splice(i, 1);
        }
      }

      // 找到第一个id>0的下标，替换option位置
      let idx_z = cloneSideNavList.findIndex((side) => side.id > 0);
      let r = currentOrderCombo.find((side) => side.id == -2);
      if (r) {
        cloneSideNavList.splice(idx_z, 0, cloneDeep(r));
      }

      this.setState({
        isSpecial,
        cloneSideNavList,
      });
    }
  }

  render() {
    const {
      t,
      i18n: { language },
      currentOrderCombo,
      sideNavList,
      isOrderEdit,
      currentItem,
      isInFreeItem,
      isSpecialItem,
      itemPoints,
      isPromotionItem,
      isExchangePurchase = false,
    } = this.props;
    const isPromotionItemFree = isPromotionItem && !isExchangePurchase;
    const {
      itemInfo,
      sectionId,
      isSpecial,
      orderPanelShow,
      chooseNum,
      maxNum,
    } = this.state;
    let cloneSideNavList = [];
    if (sectionId) {
      cloneSideNavList = this.state.cloneSideNavList.filter(
        (cs) => cs.id == sectionId
      );
    } else {
      cloneSideNavList = this.state.cloneSideNavList;
    }

    // 验证提示内容（max，min）
    const chooseTipMap = allRangHandler(sideNavList, t, {
      isInFreeItem,
      isPromotionItem,
    });
    // 价格项每一小项对象展
    const priceObj = this.calcPrice(currentOrderCombo);

    // 自选套餐的总价格
    let totalPrice = Number.parseFloat(this.calcTotalPrice(priceObj)).toFixed(
      2
    );
    // 当前是购物车页面，点击的套餐状态
    let isReviewStatus = !!(
      isOrderEdit &&
      !!(this.props.history.location.pathname.indexOf('/orderReview') > -1)
    );

    // 判断是否存在特殊情况
    let singlePrice = '0.00';
    if (isSpecial) {
      singlePrice = Number.parseFloat(currentItem.price || 0).toFixed(2);
      totalPrice = Big(totalPrice)
        .plus(Number.parseFloat(singlePrice))
        .toNumber();
    }
    totalPrice = Number.parseFloat(
      Big(totalPrice).times(chooseNum).toNumber()
    ).toFixed(2);

    const _maxNum = isInFreeItem || isPromotionItem ? 1 : maxNum;

    return (
      <Dialog
        visible={orderPanelShow}
        html={
          <div className={styles.drawBody} onClick={(e) => e.stopPropagation()}>
            <div className={styles.header}></div>
            <div
              className={[
                styles.content,
                isReviewStatus ? styles.contentReview : '',
              ].join(' ')}
            >
              {isSpecial && (
                <div className={styles.box}>
                  <div className={styles.itemHeader}>
                    <span>
                      {(currentItem?.fieldDisplayNameGroups?.length &&
                        getDishItemLanguage(
                          currentItem.fieldDisplayNameGroups,
                          language
                        )) ||
                        currentItem.name}
                    </span>
                    <div className={styles.calcBox}>
                      {isInFreeItem ? (
                        <span className={styles.point}>
                          <img
                            className={styles.pointImg}
                            src={POINT}
                            alt="point"
                          />
                          <div className={styles.pointValue}>
                            {itemPoints} {t('pts')}
                          </div>
                        </span>
                      ) : isPromotionItemFree ? (
                        <span>$0.00</span>
                      ) : (
                        <span>${_.round(singlePrice, 2).toFixed(2)}</span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {cloneSideNavList.map((item) => {
                let idx = this.findIndexByItemId(currentOrderCombo, item.id);

                // 判断菜是否可以继续添加，是则显示+号
                let isShowContinue = true;
                if (item.id > 0) {
                  let obj = getOneUncompletedSection(
                    sideNavList,
                    currentOrderCombo
                  );
                  isShowContinue = obj[item.id]?.isContinueChoose;
                }

                return (
                  <div
                    className={[styles.box, item.id == -2 && styles.opt2].join(
                      ' '
                    )}
                    key={item.id}
                  >
                    <div className={styles.itemHeader}>
                      {item.id == -1 ? (
                        <span>
                          {(item?.info?.fieldDisplayNameGroups?.length &&
                            getDishItemLanguage(
                              item.info.fieldDisplayNameGroups,
                              language
                            )) ||
                            item.info?.name}
                        </span>
                      ) : item.id == -2 ? (
                        <span>{t('item_option')}</span>
                      ) : (
                        <span>
                          {(item?.fieldDisplayNameGroups?.length &&
                            getCurrentItemLanguage(
                              item.fieldDisplayNameGroups,
                              language
                            )) ||
                            item.name}
                          <i>{chooseTipMap[item.id] || ''}</i>
                        </span>
                      )}
                      <div
                        className={styles.calcBox}
                        style={{
                          display: sectionId ? 'none' : 'flex',
                        }}
                      >
                        {isInFreeItem && item.id === -1 ? (
                          <span className={styles.point}>
                            <img
                              className={styles.pointImg}
                              src={POINT}
                              alt="point"
                            />
                            <div className={styles.pointValue}>
                              {itemPoints} {t('pts')}
                            </div>
                          </span>
                        ) : (
                          <span>
                            $
                            {isInFreeItem || isPromotionItemFree
                              ? '0.00'
                              : (priceObj?.[item.id] &&
                                  priceObj?.[item.id]?.t != null &&
                                  Number(priceObj?.[item.id]?.t).toFixed(2)) ||
                                '0.00'}
                          </span>
                        )}
                        {currentOrderCombo[idx] &&
                        currentOrderCombo[idx].items &&
                        currentOrderCombo[idx].items.length ? (
                          <i onClick={() => this.handleClearItems(item.id)}>
                            -
                          </i>
                        ) : currentOrderCombo[idx] &&
                          currentOrderCombo[idx].options &&
                          currentOrderCombo[idx].options.length ? (
                          <i onClick={() => this.handleClearItems(item.id)}>
                            -
                          </i>
                        ) : null}
                      </div>
                    </div>

                    <div className={styles.itemsBox}>
                      {currentOrderCombo[idx] &&
                        currentOrderCombo[idx].items &&
                        currentOrderCombo[idx].items.map((p, i) => {
                          return (
                            <div
                              className={styles.item}
                              key={p.id + '_' + i}
                              style={{
                                display: sectionId
                                  ? itemInfo?.id == p.id
                                    ? 'flex'
                                    : 'none'
                                  : 'flex',
                              }}
                            >
                              <span>
                                {(p?.fieldDisplayNameGroups?.length &&
                                  getDishItemLanguage(
                                    p.fieldDisplayNameGroups,
                                    language
                                  )) ||
                                  p.name}
                                :
                                <i>
                                  {this.showCollectOptions(
                                    p.selectedOptionList,
                                    p,
                                    isInFreeItem,
                                    isPromotionItem
                                  )}
                                </i>
                              </span>
                              <div className={styles.calcBox}>
                                <span>
                                  $
                                  {isInFreeItem || isPromotionItemFree
                                    ? '0.00'
                                    : (priceObj[item.id] &&
                                        priceObj[item.id]?.subList &&
                                        priceObj[item.id]?.subList?.[
                                          i
                                        ]?.toFixed(2)) ||
                                      '0.00'}
                                </span>
                                <i
                                  onClick={() =>
                                    this.handleRemoveItems(item.id, p, i)
                                  }
                                >
                                  -
                                </i>
                              </div>
                            </div>
                          );
                        })}

                      {currentOrderCombo[idx] &&
                        currentOrderCombo[idx].options &&
                        currentOrderCombo[idx].options.map((p, i) => {
                          return (
                            <div className={styles.item} key={p.id + '_' + i}>
                              <span>
                                {(p?.fieldDisplayNameGroups?.length &&
                                  getCurrentItemLanguage(
                                    p.fieldDisplayNameGroups,
                                    language
                                  )) ||
                                  p.name}
                              </span>
                              <div className={styles.calcBox}>
                                <span>
                                  $
                                  {isInFreeItem || isPromotionItemFree
                                    ? '0.00'
                                    : _?.round(p.price, 2)?.toFixed(2)}
                                </span>
                                <i
                                  onClick={() =>
                                    this.handleRemoveItems(item.id, p, i)
                                  }
                                >
                                  -
                                </i>
                              </div>
                            </div>
                          );
                        })}
                    </div>

                    {currentOrderCombo[idx] &&
                    currentOrderCombo[idx].sizeInfo &&
                    currentOrderCombo[idx].sizeInfo
                      .id ? null : currentOrderCombo[idx] &&
                      currentOrderCombo[idx].items ? (
                      isShowContinue ? (
                        <div className={styles.continue}>
                          <span>{t('continue-choose')}</span>
                          <i
                            onClick={() => {
                              this.handleJumpItems(currentOrderCombo[idx]);
                            }}
                          >
                            +
                          </i>
                        </div>
                      ) : null
                    ) : (
                      <div className={styles.continue}>
                        <span>{t('continue-choose')}</span>
                        <i
                          onClick={() => {
                            this.handleJumpItems(currentOrderCombo[idx]);
                          }}
                        >
                          +
                        </i>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* 购物车点击菜，编辑状态下（+ / -） */}
            {isReviewStatus && (
              <div className={styles.foot}>
                <div className={styles.countBtn}>
                  <Fab
                    disabled={chooseNum === 1}
                    aria-label="Remove"
                    className={
                      chooseNum > 1
                        ? `${styles.btnEn} animate-btn`
                        : styles.btnDis
                    }
                    onClick={() => this.changeChooseNum(false)}
                  >
                    <RemoveIcon className={styles.muiDiyIcon} />
                  </Fab>
                  <div className={styles.count}>{chooseNum}</div>
                  <Fab
                    disabled={chooseNum === _maxNum}
                    aria-label="Add"
                    className={
                      chooseNum !== _maxNum
                        ? `${styles.btnEn} animate-btn`
                        : styles.btnDis
                    }
                    onClick={() => this.changeChooseNum(true)}
                  >
                    <AddIcon className={styles.muiDiyIcon} />
                  </Fab>
                </div>
                <div
                  className={`${styles.addCart} linear-animate-btn`}
                  onClick={this.addOrder}
                >
                  <span>{t('confirm')}</span>
                  <div className={styles.price}>
                    {isInFreeItem ? (
                      <>
                        <img
                          src={POINT}
                          className={styles.pointImg}
                          alt="point"
                        />
                        <span>
                          {itemPoints} {t('pts')}
                        </span>
                      </>
                    ) : (
                      <span>
                        $
                        {getPromotionModalDisplayPrice({
                          isPromotionItem,
                          isExchangePurchase,
                          totalPrice,
                        })}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        }
        onClose={this.closePanel}
      />
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    isOrderEdit: state.orderEdit.isOrderEdit,
    currentItem: state.currentItem,
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    currentOrderCombo: state.currentOrderCombo,
    itemSizeList: state.itemSizeList,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    removeFootItemComboSection,
    removeFootOptComboSection,
    clearFootItemComboSection,
    replaceComboOrder,
    setEditComboQty,
  })(withTranslation()(ComboItemsDetailModal))
);
