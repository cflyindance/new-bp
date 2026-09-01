import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import { VariableSizeList } from 'react-window';
import styles from './combo.module.scss';
import Toast from '@/component/toast';
import ItemCard from '@/component/itemCard';
import ComboItemInfo from './itemInfo';
import ComboCateyOptionItem from '@/container/comboPanel/fullComboPanel/ComboCateyOptionItem';
import ComboItemsDetailModal from '@/container/comboPanel/comboFooter/comboItemsDetailModal';
import ComboSelectionModal from '@/container/comboPanel/comboSelectionModal';
import NoActivityTag from '@/container/orderPage/noActivityTag';
import {
  addItem2ComboSection,
  changeDefaultDish,
  removeFootItemComboSection,
} from '@/actions';
import {
  getCurrentItemLanguage,
  getOneUncompletedSection,
  judegIsComboStatusAndIsPreSelected,
  judgeHasDetailInfo,
  allRangHandler,
  judegStepIsHasMustDish,
  getComboSectionInfo,
} from '@/utils/busTools';
import { getCachedImagePath } from '@/utils/imagePathCache';
import remToPx from '@/utils/CountRemToPx';
import { on, off } from '@/utils';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import { notifyItemCardListScroll } from '@/utils/itemCardScrollGuard';
import itemIsSoldOut from '@/utils/itemIsSoldOut';

class ComboContent extends Component {
  constructor(props) {
    super(props);
    this.state = {
      colNum: 2,
      cutPaddingTop: 0,
      childrenListHeightList: [], // 保存所有子节点的叠加高度
      selectedComboItem: {},
      isEditPreSelect: false,
      listHeight: 0,
      listWidth: 0,
      virtualData: [],
      virtualDataHeight: [],
      scrollEnabled: true,
      overscanCount: 5,
    };
    this.comboBoxPanel = React.createRef();
    this.comboItemModal = React.createRef();
    this.comboDetailModal = React.createRef();
    this.listRef = React.createRef();
  }

  openOrderDetailModal = (ref) => {
    this.comboItemModal = ref;
  };

  openComboDetailModal = (ref) => {
    this.comboDetailModal = ref;
  };

  // 判断当前步骤下的菜是否可以重复选择
  judegStepCanRepeated = (sideNavId) => {
    const { sideNavList } = this.props;
    return getComboSectionInfo(sideNavList, sideNavId)?.allowRepeatedItems;
  };

  // 打开combo中菜的详情
  selectedComboItemHandler = (e) => {
    const { sideNavList, currentOrderCombo, isPromotionItem, selfConfig } =
      this.props;
    const sideNavId = e.sideNavId;
    const preOrderCombo = cloneDeep(currentOrderCombo);
    // 获取价格规则
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    if (!sectionInfo) {
      return;
    }
    const {
      priceRule,
      maxNumOfSelectionAllowed,
      itemSelectionRule,
      freeQuantity,
    } = sectionInfo;
    const selectedDish = currentOrderCombo
      ?.find((sec) => sec?.id === sideNavId)
      ?.items?.find((item) => item?.id === e.id);
    let cloneItem = isPromotionItem
      ? cloneDeep(selectedDish || e)
      : cloneDeep(e);

    this.setState(
      {
        selectedComboItem: cloneItem,
      },
      () => {
        // 判断当前单菜，是否有详情等字段 或者 查找配置项id为61的开关状态为开，且该菜包含在选择的数组里
        const showSimpleDishDetail =
          selfConfig.configMap.id_61?.status &&
          selfConfig.configMap.id_61?.dishIds?.includes(cloneItem?.id);

        if (judgeHasDetailInfo(cloneItem, true) || showSimpleDishDetail) {
          this.comboDetailModal.viewOrderPanel();
        } else {
          cloneItem.remark = {
            optionName: '',
            optionType: 'NOTE',
            quantity: 1,
            price: 0,
          };
          cloneItem.quantity = 1;
          if (cloneItem.itemPrices?.length === 1) {
            cloneItem.selectedOptionList = [
              {
                id: -1,
                sizeInfo: Object.assign({}, cloneItem.itemPrices[0]),
              },
            ];
            cloneItem.price = 0;
          } else {
            cloneItem.selectedOptionList = [];
          }

          const addComboList = [];

          // 定义删除之前的项的函数 同一个子菜组的单选模式
          const removePreviousItems = (sideNavId) => {
            const result = currentOrderCombo.find((c) => c.id == sideNavId);
            if (result?.items.length > 0) {
              const indicesToRemove = result.items
                .map((item, idx) => {
                  return result.items.findIndex((i) => i.id == item.id) > -1
                    ? idx
                    : -1;
                })
                .filter((idx) => idx > -1);

              // 反向排序索引，以便从后往前删除，避免索引错位
              indicesToRemove.sort((a, b) => b - a);

              // 统一删除操作
              indicesToRemove.forEach((idx) => {
                this.props.removeFootItemComboSection({
                  sectionId: sideNavId,
                  idx,
                  sideNavList,
                });
              });
            }
          };

          // 非FIXED_UNTIL_MAX模式 + 单选模式 ，是可以自由切换单项的 所以每次切换需要把之前选择的同类目下的子菜删除
          if (
            maxNumOfSelectionAllowed === 1 &&
            priceRule !== 'FIXED_UNTIL_MAX'
          ) {
            removePreviousItems(sideNavId);
          }
          // 获取之前添加的菜数量
          const orderedItemQty = currentOrderCombo?.find(
            (sct) => sct?.id == sideNavId
          )?.items?.length;

          // 设置价格
          if (priceRule === 'FIXED_UNTIL_MAX') {
            if (orderedItemQty < maxNumOfSelectionAllowed) {
              cloneItem.price = 0;
            } else {
              cloneItem.price = e.price;
            }
            addComboList.push(cloneItem);
          } else if (priceRule === 'FIXED_PRICE') {
            cloneItem.price = 0;
            addComboList.push(cloneItem);
          } else if (freeQuantity > 0) {
            if (orderedItemQty < freeQuantity) {
              cloneItem.price = 0;
            } else {
              cloneItem.price = e.price;
            }
            addComboList.push(cloneItem);
          } else {
            addComboList.push(cloneItem);
          }

          // 添加自定义字段，用于combo中items排序
          if (addComboList.length > 0) {
            addComboList[0].id_sizeId = addComboList[0].id;
          }

          this.props.addItem2ComboSection(sideNavId, addComboList);

          // max为1 且 之前选择过
          if (
            maxNumOfSelectionAllowed === 1 &&
            orderedItemQty === 1 &&
            itemSelectionRule === 'MAX_NUM_LIMIT' &&
            priceRule !== 'FIXED_UNTIL_MAX'
          ) {
            // 且 两次选择的项一样
            const preOrderId = preOrderCombo.find((sct) => sct.id == sideNavId)
              ?.items[0]?.id;
            if (preOrderId === e.id) {
              const result = currentOrderCombo.find((c) => c.id === sideNavId);
              const idx = result?.items?.findIndex((i) => i.id === e.id);
              this.props.removeFootItemComboSection({
                sectionId: sideNavId,
                idx,
                sideNavList,
              });
            }
          }

          // 选择完成后，判断当前步骤是否完成（equal，max，range），自动跳下一步
          const sectionIdx =
            sideNavList?.findIndex((s) => s.id == sideNavId) ?? 0;
          let min = sectionInfo.minNumOfSelectionAllowed;
          let max = sectionInfo.maxNumOfSelectionAllowed;
          let obj = getOneUncompletedSection(sideNavList, currentOrderCombo);
          let isCompleted = obj[sideNavId]?.isCompleted;
          let isContinueChoose = obj[sideNavId]?.isContinueChoose;

          // 除-2的长度
          let len = sideNavList?.length ?? 0;
          let optIdx = sideNavList?.findIndex((p) => p.id == -2) ?? -1;
          if (optIdx > -1) {
            len--;
          }

          if (min == undefined) {
            // 至多选择max个
            if (isCompleted && !isContinueChoose) {
              // 当前不是最后一项
              if (sectionIdx < len - 1) {
                //this.props.setCurSectionId(sectionIdx + 1);
                //this.comboStepUpTop(sectionIdx + 1);
              }
            }
          } else if (max == undefined) {
            // 至少选则min个
            return false;
          } else if (min == max) {
            if (isCompleted && !isContinueChoose) {
              if (sectionIdx < len - 1) {
                //this.props.setCurSectionId(sectionIdx + 1);
                //this.comboStepUpTop(sectionIdx + 1);
              }
            }
          } else {
            // range: min < x < max
            if (isCompleted && !isContinueChoose) {
              if (sectionIdx < len - 1) {
                //this.props.setCurSectionId(sectionIdx + 1);
                //this.comboStepUpTop(sectionIdx + 1);
              }
            }
          }
        }
      }
    );
  };

  // 计算出菜品右上角标
  getCurrentItemQty = (
    id,
    sideNavId,
    currentOrderCombo = this.props.currentOrderCombo
  ) => {
    let n = 0;
    if (sideNavId > 0) {
      let res = currentOrderCombo.find((c) => c.id == sideNavId);
      if (res && res.items) {
        res.items.forEach((f) => {
          if (f.id == id) {
            n += f.quantity;
          }
        });
      }
    }

    return n;
  };

  /**
   * 自选套餐点击角标，删除子菜：
   * 如果子菜个数=1，可直接删除，不弹items列表；
   * 如果子菜个数>1且子菜都相同，可直接删除(优先删除最后添加的子菜)，不弹items列表；
   * 如果子菜个数>1且子菜不相同，弹items列表，再选择具体删除哪一个子菜；
   */
  handleQtyClicked = (num, sectionId, itemInfo) => {
    const { currentOrderCombo, sideNavList } = this.props;
    if (num == 1) {
      let result = currentOrderCombo.find((c) => c.id == sectionId);
      let idx = result?.items?.findIndex((i) => i.id == itemInfo.id);
      if (idx > -1) {
        this.props.removeFootItemComboSection({ sectionId, idx, sideNavList });
      }
    } else {
      let isAllSame = true;
      let result = currentOrderCombo.find((c) => c.id == sectionId);
      let itemsArr = result?.items?.filter((i) => i.id == itemInfo.id);
      for (let k = 0; k < itemsArr.length - 1; k++) {
        let standard = itemsArr[0];
        let isSame = isEqual(standard, itemsArr[k + 1]);
        if (isSame) {
          continue;
        } else {
          isAllSame = false;
          break;
        }
      }
      // 子菜都一样
      if (isAllSame) {
        let idx = -1;
        for (let j = result.items.length - 1; j >= 0; j--) {
          if (result.items[j].id == itemInfo.id) {
            idx = j;
            break;
          }
        }
        if (idx > -1) {
          this.props.removeFootItemComboSection({
            sectionId,
            idx,
            sideNavList,
          });
        }
      } else {
        this.comboItemModal.viewOrderPanel({ sectionId, itemInfo });
      }
    }
  };

  // 子菜组自动滑动到下个组
  comboStepUpTop = (idx) => {
    const { childrenListHeightList } = this.state;
    if (!this.listRef.current) return;
    // 禁止响应滚动事件
    this.setState({ scrollEnabled: false }, () => {
      // 获取目标滚动位置
      const targetScrollTop = idx == 0 ? 0 : childrenListHeightList[idx];
      if (targetScrollTop > this.listRef.current.props.height / 2) {
        this.setState({ overscanCount: 10 });
      } else {
        this.setState({ overscanCount: 5 });
      }
      if (idx == 0 || idx >= childrenListHeightList.length) {
        this.scrollToTop();
      } else {
        this.listRef.current.scrollTo(childrenListHeightList[idx - 1], 'start');
        this.listRef.current.resetAfterIndex(0);
      }

      // 延迟恢复滚动事件响应
      window.scrollEnabledTimer && clearTimeout(window.scrollEnabledTimer);
      window.scrollEnabledTimer = setTimeout(() => {
        this.setState({ scrollEnabled: true });
        clearTimeout(window.scrollEnabledTimer);
      }, 300);
    });
  };

  // 滚动事件
  handleScroll = (e) => {
    notifyItemCardListScroll();
    if (!this.state.scrollEnabled) return;
    // 利用延时器模拟防抖 解决滑动速度过慢时 执行setCurSectionId导致闪屏问题
    window.comboScrollTimer && clearTimeout(window.comboScrollTimer);
    window.comboScrollTimer = setTimeout(() => {
      const { sideNavId, sideNavList } = this.props;
      let sectionIdx = sideNavList?.findIndex((s) => s.id == sideNavId) ?? 0;
      const { childrenListHeightList } = this.state;
      let currentIdx = 0;
      let scrollTop = Math.floor(e.scrollOffset);
      for (let i = 0; i < childrenListHeightList.length; i++) {
        if (scrollTop <= childrenListHeightList[0]) {
          currentIdx = 0;
          break;
        } else if (scrollTop < childrenListHeightList[i + 1]) {
          currentIdx = i + 1;
          break;
        }
      }
      if (currentIdx != sectionIdx) {
        this.props.setCurSectionId(currentIdx);
      }
      clearTimeout(window.comboScrollTimer);
    }, 100);
  };

  scrollToTop() {
    if (!this.listRef.current) return;
    this.listRef.current.scrollTo(0, 'start');
  }

  resizeload = debounce(() => {
    this.updateListWidth();
    this.updateListHeight();
  }, 500);

  componentDidMount() {
    on(window, 'resize', this.resizeload);

    this.props.onRef(this);
    this.updateListWidth();
    this.updateListHeight();
    this.getvirtualData();
  }

  componentWillUnmount() {
    off(window, 'resize', this.resizeload);
    window.comboScrollTimer && clearTimeout(window.comboScrollTimer);
    window.scrollEnabledTimer && clearTimeout(window.scrollEnabledTimer);
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.comboAllChildDish, this.props.comboAllChildDish)) {
      this.getvirtualData();
    }
    if (!isEqual(prevProps.currentOrderCombo, this.props.currentOrderCombo)) {
      if (this.listRef.current) {
        this.listRef.current.resetAfterIndex(0);
      }
    }
  }

  // 整理虚拟列表数据
  getvirtualData = () => {
    const data = [];
    const { comboAllChildDish } = this.props;
    data.push({
      type: 'comboItem',
      data: [],
    });
    if (comboAllChildDish.length > 0) {
      comboAllChildDish.forEach((sideItemInfo) => {
        data.push({
          data: sideItemInfo,
          type: 'comboItemsTitle',
        });
        data.push({
          data: sideItemInfo,
          type: 'comboItemsBox',
        });
      });
    }
    data.push({
      type: 'comboCateyOptionItem',
      data: [],
    });
    data.push({
      type: 'bottom',
      data: [],
    });

    this.setState(
      {
        virtualData: data,
        // 重置高度数组
        virtualDataHeight: new Array(data.length).fill(0),
      },
      () => {
        // 数据更新后强制重置列表
        if (this.listRef.current) {
          this.listRef.current.resetAfterIndex(0);
        }
      }
    );
  };

  // 获取动态高度
  getItemSize = (index) => {
    const { virtualDataHeight, virtualData } = this.state;
    const item = virtualData[index];

    if (item.type === 'bottom') {
      return remToPx(22);
    } else {
      return virtualDataHeight[index];
    }
  };

  // 虚拟列表行渲染
  renderRow = ({ index, style, data }) => {
    const item = data.virtualData[index];
    return (
      <div style={style} ref={(el) => this.measureRef(el, index)}>
        {this.renderContentItem(item, data.currentOrderCombo)}
      </div>
    );
  };

  // 通过 ref 测量高度
  measureRef = (el, index) => {
    if (!el || !this.state.virtualData[index]) return;

    let totalHeight = 0;
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = window.getComputedStyle(child);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      totalHeight += child?.offsetHeight + marginTop + marginBottom;
    }

    if (this.state.virtualDataHeight[index] !== totalHeight) {
      const newHeights = [...this.state.virtualDataHeight];
      newHeights[index] = totalHeight;
      let sum = 0;
      let childrenListHeightList = [];
      for (let i = 0; i < newHeights.length; i++) {
        sum += newHeights[i - 1] || 0;
        if (i % 2 === 1) {
          childrenListHeightList.push(sum);
        }
      }
      this.setState(
        { virtualDataHeight: newHeights, childrenListHeightList },
        () => {
          if (this.listRef.current) {
            this.listRef.current.resetAfterIndex(0);
          }
        }
      );
    }
  };

  updateListHeight = () => {
    const height = window.innerHeight * 0.9 - remToPx(9);
    this.setState({ listHeight: height });
  };

  updateListWidth = () => {
    if (this.comboBoxPanel?.current) {
      const width = this.comboBoxPanel.current.offsetWidth;
      this.setState({ listWidth: width });
    }
  };

  // 内容渲染
  renderContentItem = (item, currentOrderCombo) => {
    const { showRequireId } = this.props;
    switch (item.type) {
      case 'comboItem':
        // 详情、价格、图片等
        return (
          <ComboItemInfo
            setCurSectionId={this.props.setCurSectionId}
            comboStepUpTop={this.comboStepUpTop}
            showRequireId={showRequireId}
          />
        );
      case 'comboItemsTitle':
        // 标题
        return this.renderComboItemsTitle(item.data);
      case 'comboItemsBox':
        // 菜品内容
        return this.renderComboItemsBox(item.data, currentOrderCombo);
      case 'comboCateyOptionItem':
        //  类的options（-3）
        return <ComboCateyOptionItem />;
      default:
        return null;
    }
  };

  // 标题
  renderComboItemsTitle = (sideItemInfo) => {
    const {
      t,
      i18n: { language },
      selfConfig,
      sideNavList,
      currentOrderCombo,
      itemId,
      showRequireId,
    } = this.props;

    const chooseTipMap = allRangHandler(sideNavList, t);
    const isShowComboSideNav = selfConfig?.configMap?.id_19;
    const o = judegStepIsHasMustDish(sideNavList, currentOrderCombo);

    const isRequestSubDish = sideItemInfo.isRequestSubDish;
    let sectionName = '';
    if (sideItemInfo.sideNameMap?.fieldDisplayNameGroups?.length) {
      sectionName =
        getCurrentItemLanguage(
          sideItemInfo.sideNameMap.fieldDisplayNameGroups,
          language
        ) || sideItemInfo.sideNameMap.name;
    }

    // 是否可以选择重复的菜
    let isCanRepeated = this.judegStepCanRepeated(sideItemInfo.sideNameMap.id);

    return (
      <div className={styles.comboItemsTitle}>
        <span className={styles.sectionName}>{sectionName}</span>
        {!isShowComboSideNav &&
          showRequireId !== sideItemInfo.sideNameMap.id && (
            <i className={styles.comboItemsRule}>
              {chooseTipMap[sideItemInfo.sideNameMap.id] || ''}
            </i>
          )}
        {!isShowComboSideNav && !o[sideItemInfo.sideNameMap.id] && (
          <i className={styles.comboItemsMust}>({t('must-select-pre-dish')})</i>
        )}
        {/* {!isShowComboSideNav && !isCanRepeated && (
          <i className={styles.noAllow}>({t('no-allow-repeated-item')})</i>
        )} */}
        <NoActivityTag itemId={itemId} sideItemInfo={sideItemInfo} />
        {isRequestSubDish && showRequireId === sideItemInfo.sideNameMap.id && (
          <div className={styles.required}>
            {`${t('required')}: ${chooseTipMap[sideItemInfo.sideNameMap.id] || ''}`}
          </div>
        )}
      </div>
    );
  };

  // 菜品
  renderComboItemsBox = (sideItemInfo, currentOrderCombo) => {
    const { colNum } = this.state;
    const { t, sideNavList } = this.props;
    const isCompleteObj = getOneUncompletedSection(
      sideNavList,
      currentOrderCombo
    );

    // 子菜组中 所有子菜都没有图片 以简单模式展示
    const isSimpleMode = sideItemInfo.sideDishList.every(
      (each) => !getCachedImagePath(each.id) && !each.thumbPath
    );

    // 当前步骤是否可以重复选择
    const allowRepeatedItems = getComboSectionInfo(
      sideNavList,
      sideItemInfo.sideNameMap.id
    )?.allowRepeatedItems;

    // 当前步骤下的菜，是否可以继续选择
    let isContinueChoose =
      isCompleteObj[sideItemInfo.sideNameMap.id]?.isContinueChoose;

    return (
      <div className={styles.comboItemsBox}>
        <div className={styles.comboItemsList}>
          {sideItemInfo.sideDishList?.length
            ? sideItemInfo.sideDishList.map((sideDish) => {
                const sectionInfo = getComboSectionInfo(
                  sideNavList,
                  sideDish.sideNavId
                );
                const comboSectionSaleItems =
                  sectionInfo?.comboSectionSaleItems;
                const comboSectionSaleItem = comboSectionSaleItems?.find(
                  (item) => item.saleItemId == sideDish?.id
                );
                const itemInfo = {
                  ...sideDish,
                  price: comboSectionSaleItem?.addPrice ?? sideDish.price,
                  itemPrices: sideDish.itemPrices?.map((item) => {
                    return {
                      ...item,
                      price: comboSectionSaleItem?.addPrice ?? item.price,
                    };
                  }),
                };

                // 是否是必选菜
                let isPreSelected = judegIsComboStatusAndIsPreSelected(
                  itemInfo,
                  sideNavList,
                  sideItemInfo.sideNameMap.id,
                  currentOrderCombo
                );
                // 菜的角标
                const itemQty = this.getCurrentItemQty(
                  itemInfo.id,
                  sideItemInfo.sideNameMap.id,
                  currentOrderCombo
                );
                // 当前套餐项的数量限制
                let max = sectionInfo?.maxNumOfSelectionAllowed;
                // 是否禁用状态
                let isDisabled = !itemQty && !isContinueChoose && max !== 1;

                // 是否有被系统选择的预选菜
                const selectedDish = currentOrderCombo
                  ?.find((sec) => sec.id === itemInfo.sideNavId)
                  ?.items?.find((item) => item.id === itemInfo.id);
                const isHasDefaultBySystem = selectedDish?.isDefaultSelect;
                // 是否是售罄菜
                const isSoldoutMark = itemIsSoldOut(itemInfo);

                return (
                  <div
                    className={[
                      styles.comboItems,
                      isDisabled && !isSoldoutMark && styles.disabled,
                    ].join(' ')}
                    key={sideItemInfo.sideNameMap.id + '_' + itemInfo.id}
                    style={{
                      width: `calc((100% - 1rem * ${colNum}) / ${colNum})`,
                    }}
                  >
                    <ItemCard
                      {...this.props}
                      isBannerPro={true}
                      isSimpleMode={isSimpleMode}
                      sideNavId={sideItemInfo.sideNameMap.id}
                      isThumbPath={sideItemInfo.hasThumbPath}
                      isComboType
                      itemInfo={itemInfo}
                      isPreSelected={isPreSelected}
                      itemQty={itemQty}
                      isSoldoutMark={isSoldoutMark}
                      onClick={() => {
                        // 系统预选菜且有详情
                        if (
                          isHasDefaultBySystem &&
                          judgeHasDetailInfo(selectedDish, true)
                        ) {
                          // 将isDefaultSelect置为false
                          this.props.changeDefaultDish(
                            itemInfo.sideNavId,
                            itemInfo.id
                          );
                          let cloneItem = cloneDeep(selectedDish);
                          this.setState(
                            {
                              selectedComboItem: {
                                ...cloneItem,
                                isDefaultSelect: false,
                              },
                              isEditPreSelect: true,
                            },
                            () => {
                              this.comboDetailModal.viewOrderPanel();
                            }
                          );
                          return;
                        }

                        const currentComboSectionItem =
                          sectionInfo?.comboSectionSaleItems?.find(
                            (item) => item.saleItemId === itemInfo.id
                          );

                        let addLimit;
                        if (
                          sectionInfo?.mergeDisplay &&
                          itemInfo.itemPrices?.length
                        ) {
                          addLimit = itemInfo.itemPrices.reduce((acc, item) => {
                            let _addLimit =
                              item.originalComboSectionSaleItem?.addLimit;
                            if (_addLimit) {
                              if (acc) {
                                acc = acc + _addLimit;
                              } else {
                                acc = _addLimit;
                              }
                            }
                            return acc;
                          }, undefined);
                        } else {
                          addLimit = currentComboSectionItem?.addLimit;
                        }
                        if (
                          (isContinueChoose &&
                            (!addLimit > 0 || itemQty < addLimit)) ||
                          max === 1
                        ) {
                          if (!allowRepeatedItems && itemQty >= 1) {
                            // 提示不可重复选择
                            Toast.info(t('no-allow-repeated-item'), 1000);
                            return;
                          } else {
                            this.selectedComboItemHandler(
                              itemInfo,
                              sideItemInfo.sideDishList
                            );
                          }
                        }
                      }}
                      onQtyClicked={() => {
                        let sectionId = sideItemInfo.sideNameMap.id;
                        this.handleQtyClicked(itemQty, sectionId, itemInfo);
                      }}
                    />
                  </div>
                );
              })
            : null}
        </div>
      </div>
    );
  };

  render() {
    const {
      selectedComboItem,
      listHeight,
      listWidth,
      virtualData,
      overscanCount,
    } = this.state;

    return (
      <React.Fragment>
        <div className={styles.panelBox} ref={this.comboBoxPanel}>
          <VariableSizeList
            ref={this.listRef}
            height={listHeight}
            width={listWidth || 0}
            itemCount={virtualData.length}
            itemSize={this.getItemSize}
            itemData={{
              virtualData,
              currentOrderCombo: this.props.currentOrderCombo,
            }}
            onScroll={this.handleScroll}
            overscanCount={overscanCount}
            useIsScrolling={true}
          >
            {this.renderRow}
          </VariableSizeList>
        </div>

        {/* 子菜详情 option, size */}
        <ComboSelectionModal
          sideNavList={this.props.sideNavList}
          itemInfo={selectedComboItem}
          onRef={this.openComboDetailModal}
          setCurSectionId={this.props.setCurSectionId}
          comboStepUpTop={this.comboStepUpTop}
          isEditPreSelect={this.state.isEditPreSelect}
          onCloseEffect={() => {
            this.setState({
              isEditPreSelect: false,
            });
          }}
        />

        {/* combo items的详细 */}
        <ComboItemsDetailModal
          sideNavList={this.props.sideNavList}
          onRef={this.openOrderDetailModal}
          setCurSectionId={this.props.setCurSectionId}
          handleChildUpTop={this.comboStepUpTop}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    currentOrder: state.currentOrder,
    currentOrderCombo: state.currentOrderCombo,
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    sideNavId: ownProps.sideNavId ?? state.sideNav.sideNavId,
    selfConfig: state.selfConfig,
    currentItem: state.currentItem,
    itemSizeList: state.itemSizeList,
    menuItemList: state.menuItemList,
    crm: state.crm,
  };
}

export default connect(mapStateToProps, {
  addItem2ComboSection,
  removeFootItemComboSection,
  changeDefaultDish,
})(withTranslation()(ComboContent));
