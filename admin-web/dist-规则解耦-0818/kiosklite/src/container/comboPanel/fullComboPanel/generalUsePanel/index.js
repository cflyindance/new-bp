import React from 'react';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import styles from './generalUsePanel.module.scss';
import Toast from '../../../../component/toast';
import ItemCard from '../../../../component/itemCard';
import ComboItem from '../comboItem';
import { VariableSizeList } from 'react-window';
import ComboCateyOptionItem from '../ComboCateyOptionItem';
import ComboItemsDetailModal from '../../comboFooter/comboItemsDetailModal';
import ComboSelectionModal from '../../comboSelectionModal';
import {
  addItem2ComboSection,
  changeDefaultDish,
  removeFootItemComboSection,
  addCombo2Order,
  removeItemFromOrder,
} from '@/actions';
import {
  getCurrentItemLanguage,
  getOneUncompletedSection,
  judegIsComboStatusAndIsPreSelected,
  judgeHasDetailInfo,
  calcColNum,
  allRangHandler,
  judegStepIsHasMustDish,
  getComboSectionInfo,
} from '@/utils/busTools';
import remToPx from '@/utils/CountRemToPx';
import { on, off, getDeviceOrientation } from '@/utils';
import { getCachedImagePath } from '@/utils/imagePathCache';
import cloneDeep from 'lodash/cloneDeep';
import debounce from 'lodash/debounce';
import isEqual from 'lodash/isEqual';
import NoActivityTag from '@/container/orderPage/noActivityTag';
import { notifyItemCardListScroll } from '@/utils/itemCardScrollGuard';
import itemIsSoldOut from '@/utils/itemIsSoldOut';
import BottomToast from '@/component/bottomToast';

const isComboNavigationRow = (row) =>
  row?.type === 'comboItemsTitle' || row?.type === 'comboCateyOptionItem';

const setComboItemBasePrice = (item, price) => {
  const selectedSize = item.selectedOptionList?.find(
    (section) => section.id === -1
  );
  if (selectedSize?.sizeInfo) {
    item.price = 0;
    selectedSize.sizeInfo.price = price;
    return;
  }
  item.price = price;
};

export const buildComboSectionOffsets = (rows, heights) => {
  let offset = 0;
  const sectionOffsets = [0];
  rows.forEach((row, index) => {
    if (isComboNavigationRow(row)) {
      sectionOffsets.push(offset);
    }
    offset += heights[index] || 0;
  });
  return sectionOffsets;
};

export const getComboScrollTarget = (
  sectionOffset,
  heights,
  viewportHeight,
  headerHeight = 0
) => {
  const contentHeight = heights.reduce((sum, height) => sum + (height || 0), 0);
  const maxScrollTop = Math.max(0, contentHeight - viewportHeight);
  const titleScrollTop = Math.max(0, (sectionOffset || 0) - headerHeight);
  return Math.min(titleScrollTop, maxScrollTop);
};

class GeneralUsePanel extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      colNum: 2,
      cutPaddingTop: 0,
      selectedComboItem: {},
      isEditPreSelect: false,
      listWidth: 0,
      virtualData: [],
      virtualDataHeight: [],
      childrenListHeightList: [],
      scrollEnabled: true,
      overscanCount: 5,
      isListReady: false,
    };
    this.comboBoxPanel = React.createRef();
    this.comboItemModal = React.createRef();
    this.comboDetailModal = React.createRef();
    this.preMeasureRef = React.createRef();
    this.listRef = React.createRef();
    this._lastScrollOffset = 0;
    this._activeSectionIdx = 0;
    this._measuredRowElements = new Map();
    this._measuredRowIndexes = new WeakMap();
  }

  setActiveSectionIdx = (idx) => {
    this._activeSectionIdx = idx;
  };

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
  selectedComboItemHandler = (e, currentSubDishList = []) => {
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
    // 获取之前添加的菜数量
    const orderedItemQty = currentOrderCombo?.find(
      (sct) => sct?.id == sideNavId
    )?.items?.length;
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
          const selectedSizePrice = cloneItem.selectedOptionList?.find(
            (section) => section.id === -1
          )?.sizeInfo?.price;
          const chargeableBasePrice = selectedSizePrice ?? e.price;

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

          // 设置价格
          if (priceRule === 'FIXED_UNTIL_MAX') {
            if (orderedItemQty < maxNumOfSelectionAllowed) {
              setComboItemBasePrice(cloneItem, 0);
            } else {
              setComboItemBasePrice(cloneItem, chargeableBasePrice);
            }
            addComboList.push(cloneItem);
          } else if (priceRule === 'FIXED_PRICE') {
            setComboItemBasePrice(cloneItem, 0);
            addComboList.push(cloneItem);
          } else if (freeQuantity > 0) {
            // 获取之前添加的菜数量[商品中心需要实时获取菜品数量]
            const orderedItemQty = currentOrderCombo?.find(
              (sct) => sct?.id == sideNavId
            )?.items?.length;
            if (orderedItemQty < freeQuantity) {
              setComboItemBasePrice(cloneItem, 0);
            } else {
              setComboItemBasePrice(cloneItem, chargeableBasePrice);
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
      // combo 子菜：从 currentOrderCombo 获取数量
      let res = currentOrderCombo.find((c) => c.id == sideNavId);
      if (res && res.items) {
        res.items.forEach((f) => {
          if (f.id == id) {
            n += f.quantity;
          }
        });
      }
    } else if (sideNavId === -98 || sideNavId === -99) {
      // Sides/Drinks：从购物车 currentOrder.itemList 获取数量
      const { currentOrder } = this.props;
      if (currentOrder?.itemList) {
        currentOrder.itemList.forEach((item) => {
          if (item.id === id) {
            n += item.quantity || 1;
          }
        });
      }
    }

    return n;
  };

  /**
   * 自选套餐点击角标，删除子菜：
   * 如果子菜个数=1，可直接删除，不弹items列表；
   * 如果子菜个数>1且子菜都相同,且都是非详情菜，可直接删除(优先删除最后添加的子菜)，不弹items列表；
   * 如果子菜个数>1且子菜不相同，或是详情菜，弹items列表，再选择具体删除哪一个子菜；
   */
  handleQtyClicked = (num, sectionId, itemInfo) => {
    const { currentOrderCombo, sideNavList } = this.props;
    // Sides/Drinks (-98, -99): 从购物车删除
    if (sectionId === -98 || sectionId === -99) {
      this.props.removeItemFromOrder(itemInfo.id);
      return;
    }

    // combo 子菜逻辑
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
      const hasDetail = judgeHasDetailInfo(itemInfo, true);
      for (let k = 0; k < itemsArr.length - 1; k++) {
        let standard = itemsArr[0];
        let isSame = isEqual(standard, itemsArr[k + 1]);
        if (isSame || !hasDetail) {
          // 直接删除
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

  // 根据各行高度计算 section 滚动阈值
  buildChildrenListHeightList = (heights, rows = this.state.virtualData) =>
    buildComboSectionOffsets(rows, heights);

  hasTallMainComboContent = () => {
    const { currentItem } = this.props;
    return (
      currentItem?.categoryOptions?.length > 0 ||
      currentItem?.itemPrices?.length > 0 ||
      currentItem?.itemOptions?.length > 0
    );
  };

  // 主菜含 option/size 时可能超一屏，估算高度不得低于视口，避免列表总高度塌陷
  getEstimatedItemHeight = (item) => {
    if (!item) return remToPx(10);
    switch (item.type) {
      case 'comboItem': {
        if (this.hasTallMainComboContent()) {
          return Math.max(remToPx(40), window.innerHeight - remToPx(12));
        }
        return remToPx(40);
      }
      case 'comboItemsTitle':
        return remToPx(6.3);
      case 'comboItemsBox': {
        const sideDishList = item.data?.sideDishList || [];
        const dishCount = sideDishList.length;
        if (!dishCount) return remToPx(10);
        const colNum = this.state.colNum || calcColNum();
        const isSimpleMode = sideDishList.every(
          (each) => !getCachedImagePath(each.id) && !each.thumbPath
        );
        const sideNavId = item.data?.sideNameMap?.id;
        const maxNumOfSelectionAllowed = getComboSectionInfo(
          this.props.sideNavList,
          sideNavId
        )?.maxNumOfSelectionAllowed;
        const isSideNavPortraitSingleColumn =
          isSimpleMode &&
          maxNumOfSelectionAllowed !== 1 &&
          this.props.selfConfig?.configMap?.id_19 &&
          getDeviceOrientation() === 'vertical';

        const columns = isSideNavPortraitSingleColumn
          ? 1
          : isSimpleMode
            ? 2
            : colNum;
        const rows = Math.ceil(dishCount / columns);
        const itemHeight = isSimpleMode ? 11 : 32;
        return remToPx(4 + rows * itemHeight + Math.max(0, rows - 1) * 2);
      }
      case 'comboCateyOptionItem':
        return remToPx(15);
      default:
        return remToPx(10);
    }
  };

  // 测量一行内自然撑开的内容高度
  measureElementHeight = (el) => {
    if (!el) return 0;
    let totalHeight = 0;
    const children = el.children;
    for (let i = 0; i < children.length; i++) {
      const child = children[i];
      const style = window.getComputedStyle(child);
      const marginTop = parseFloat(style.marginTop) || 0;
      const marginBottom = parseFloat(style.marginBottom) || 0;
      totalHeight += (child?.offsetHeight || 0) + marginTop + marginBottom;
    }
    return totalHeight;
  };

  // 列表显示前先在隐藏容器中测量全部行，避免未挂载行依赖估算高度
  startInitialPreMeasure = () => {
    this._preMeasureAttempts = 0;
    this._stablePreMeasureCount = 0;
    this._lastPreMeasureSignature = '';
    clearTimeout(this._preMeasureTimer);
    this._preMeasureTimer = setTimeout(() => {
      requestAnimationFrame(() => {
        this.applyInitialPreMeasure();
      });
    }, 0);
  };

  applyInitialPreMeasure = () => {
    if (!this._isMounted) return;
    const container = this.preMeasureRef.current;
    const { virtualData } = this.state;
    const rowElements = [...(container?.children || [])];
    const measuredHeights = virtualData.map((row, index) => {
      if (row.type === 'top') return remToPx(10);
      if (row.type === 'bottom') return remToPx(20);
      return this.measureElementHeight(rowElements[index]);
    });
    const signature = measuredHeights.join(',');
    this._stablePreMeasureCount =
      signature === this._lastPreMeasureSignature
        ? this._stablePreMeasureCount + 1
        : 0;
    this._lastPreMeasureSignature = signature;
    this._preMeasureAttempts += 1;

    const hasPendingCategoryOption =
      (this.props.currentItem?.categoryOptions?.length || 0) > 0 &&
      measuredHeights.some(
        (height, index) =>
          virtualData[index]?.type === 'comboCateyOptionItem' && height === 0
      );
    const isStable =
      this._preMeasureAttempts >= 3 &&
      this._stablePreMeasureCount >= 2 &&
      !hasPendingCategoryOption;

    if (!isStable && this._preMeasureAttempts < 20) {
      clearTimeout(this._preMeasureTimer);
      this._preMeasureTimer = setTimeout(() => {
        requestAnimationFrame(() => {
          this.applyInitialPreMeasure();
        });
      }, 50);
      return;
    }

    const resolvedHeights = measuredHeights.map((height, index) =>
      height > 0 ? height : this.getEstimatedItemHeight(virtualData[index])
    );
    this.setState(
      {
        virtualDataHeight: resolvedHeights,
        childrenListHeightList: this.buildChildrenListHeightList(
          resolvedHeights,
          virtualData
        ),
      },
      () => {
        this.finishInitialLayout();
      }
    );
  };

  finishInitialLayout = () => {
    if (!this._isMounted) return;
    this._isUserScrolling = false;
    this.setState({ isListReady: true }, () => {
      requestAnimationFrame(() => {
        if (this.listRef.current) {
          this.listRef.current.resetAfterIndex(0, true);
        }
      });
    });
  };

  // 滚动结束后应用推迟的高度 layout 刷新
  flushPendingHeightReset = () => {
    const pending = this._pendingHeightReset;
    if (!pending) return;
    this._pendingHeightReset = null;
    const list = this.listRef.current;
    if (!list) return;
    list.resetAfterIndex(pending.minChangedIndex, false);
  };

  // 更新虚拟行高度；滚动中推迟 resetAfterIndex，避免 scrollTop 被钳位到 ~1387
  updateVirtualHeights = (
    newHeights,
    minChangedIndex = 0,
    hasHeightIncrease = false
  ) => {
    const childrenListHeightList = this.buildChildrenListHeightList(newHeights);

    this.setState(
      { virtualDataHeight: newHeights, childrenListHeightList },
      () => {
        const list = this.listRef.current;
        if (!list) return;

        if (this._isUserScrolling && !hasHeightIncrease) {
          this._pendingHeightReset = { minChangedIndex };
          return;
        }

        list.resetAfterIndex(minChangedIndex, false);
      }
    );
  };

  // 子菜组自动滑动到下个组
  comboStepUpTop = (idx) => {
    const { childrenListHeightList, virtualDataHeight } = this.state;
    if (!this.listRef.current) return;
    this._activeSectionIdx = idx;
    this.setState({ scrollEnabled: false }, () => {
      const sectionOffset = idx === 0 ? 0 : childrenListHeightList[idx];
      const targetScrollTop = getComboScrollTarget(
        sectionOffset,
        virtualDataHeight,
        this.listRef.current.props.height,
        remToPx(8.8)
      );
      if (idx === 0 || idx >= childrenListHeightList.length) {
        this.scrollToTop();
      } else {
        this.listRef.current.scrollTo(targetScrollTop);
        this._lastScrollOffset = targetScrollTop;
      }
      clearTimeout(this._scrollEnabledTimer);
      this._scrollEnabledTimer = setTimeout(() => {
        if (this._isMounted) {
          this.setState({ scrollEnabled: true });
        }
      }, 300);
    });
  };

  // 根据 scrollTop 计算当前 section 索引
  getSectionIdxFromScrollTop = (scrollTop, childrenListHeightList) => {
    if (!childrenListHeightList?.length) return 0;
    let currentIdx = childrenListHeightList.length - 1;
    for (let i = childrenListHeightList.length - 1; i >= 0; i--) {
      if (scrollTop >= childrenListHeightList[i]) {
        currentIdx = i;
        break;
      }
    }
    return currentIdx;
  };

  // 滚动事件：仅联动 sideNav 高亮，不触发列表重渲染
  handleScroll = (e) => {
    notifyItemCardListScroll();
    if (!this.state.scrollEnabled) return;
    const scrollTop = Math.floor(e.scrollOffset);
    this.props.onScroll?.(scrollTop);
    const prevOffset = this._lastScrollOffset;
    const isRealScroll = scrollTop !== prevOffset;
    this._lastScrollOffset = scrollTop;

    // 忽略挂载时的初始 onScroll(scrollTop=0)，避免误判为用户滚动
    if (isRealScroll) {
      this._isUserScrolling = true;
      clearTimeout(this._userScrollEndTimer);
      this._userScrollEndTimer = setTimeout(() => {
        this._isUserScrolling = false;
        this.flushPendingHeightReset();
      }, 200);
    }
    window.comboScrollTimer && clearTimeout(window.comboScrollTimer);
    window.comboScrollTimer = setTimeout(() => {
      const { sideNavList } = this.props;
      const { childrenListHeightList } = this.state;
      const currentIdx = this.getSectionIdxFromScrollTop(
        scrollTop,
        childrenListHeightList
      );
      if (currentIdx !== this._activeSectionIdx) {
        this._activeSectionIdx = currentIdx;
        this.props.onScrollSectionChange?.(currentIdx, sideNavList);
      }
      clearTimeout(window.comboScrollTimer);
    }, 100);
  };

  scrollToTop() {
    if (!this.listRef.current) return;
    this.listRef.current.scrollTo(0, 'start');
    this._lastScrollOffset = 0;
  }

  resizeload = debounce(() => {
    const colNum = calcColNum();
    this.setState({ colNum }, () => {
      this.updateListWidth();
      this.getvirtualData();
    });
  }, 500);

  componentDidMount() {
    this._isMounted = true;
    if (window.ResizeObserver) {
      this._rowResizeObserver = new window.ResizeObserver((entries) => {
        entries.forEach((entry) => {
          const measuredRow = this._measuredRowIndexes.get(entry.target);
          if (measuredRow) {
            this.measureRef(measuredRow.el, measuredRow.index);
          }
        });
      });
    }
    const colNum = calcColNum();
    on(window, 'resize', this.resizeload);

    this.props.onRef(this);
    this.setState({ colNum }, () => {
      this.updateListWidth();
      this.getvirtualData();
    });
  }

  componentWillUnmount() {
    this._isMounted = false;
    if (this._measureRafId) {
      cancelAnimationFrame(this._measureRafId);
    }
    clearTimeout(this._scrollEnabledTimer);
    clearTimeout(this._userScrollEndTimer);
    clearTimeout(this._preMeasureTimer);
    this._rowResizeObserver?.disconnect();
    this._measuredRowElements.clear();
    off(window, 'resize', this.resizeload);
  }

  componentDidUpdate(prevProps) {
    if (!isEqual(prevProps.comboAllChildDish, this.props.comboAllChildDish)) {
      this.getvirtualData();
    }
    if (!isEqual(prevProps.currentOrderCombo, this.props.currentOrderCombo)) {
      this.listRef.current?.resetAfterIndex(0);
    }
  }

  // 整理虚拟列表数据
  getvirtualData = () => {
    const data = [];
    data.push({
      type: 'top',
      data: [],
    });
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
    if (this.props.currentItem?.categoryOptions?.length > 0) {
      data.push({
        type: 'comboCateyOptionItem',
        data: [],
      });
    }
    data.push({
      type: 'bottom',
      data: [],
    });

    const estimatedHeights = data.map((row) => {
      if (row.type === 'bottom') return remToPx(20);
      if (row.type === 'top') return remToPx(10);
      return this.getEstimatedItemHeight(row);
    });
    const initialHeights = estimatedHeights;
    this.setState(
      {
        virtualData: data,
        virtualDataHeight: initialHeights,
        childrenListHeightList: this.buildChildrenListHeightList(
          initialHeights,
          data
        ),
        isListReady: false,
        overscanCount: 5,
      },
      () => {
        this._activeSectionIdx = 0;
        this._lastScrollOffset = 0;
        this.updateListWidth();
        this.startInitialPreMeasure();
      }
    );
  };

  // 获取动态高度
  getItemSize = (index) => {
    const { virtualDataHeight, virtualData } = this.state;
    const item = virtualData[index];

    const measured = virtualDataHeight[index];
    if (measured > 0) return measured;
    if (item.type === 'bottom') return remToPx(20);
    if (item.type === 'top') return remToPx(10);
    return this.getEstimatedItemHeight(item);
  };

  // 虚拟列表行渲染
  renderRow = ({ index, style, data }) => {
    const item = data.virtualData[index];
    if (!item) {
      return <div style={style} />;
    }

    return (
      <div
        style={style}
        ref={(el) => this.setMeasureRef(el, index)}
        key={`virtual-row-${index}`}
      >
        {this.renderContentItem(item, data.currentOrderCombo)}
      </div>
    );
  };

  // 通过 ref 测量高度
  setMeasureRef = (el, index) => {
    const previousRow = this._measuredRowElements.get(index);
    if (previousRow && previousRow.el !== el) {
      this._rowResizeObserver?.unobserve(previousRow.target);
      this._measuredRowElements.delete(index);
    }
    if (!el) return;
    if (this.state.virtualData[index]?.type === 'comboItem') return;

    const target = el.firstElementChild || el;
    this._measuredRowElements.set(index, { el, target });
    this._measuredRowIndexes.set(target, { el, index });
    this._rowResizeObserver?.observe(target);
    this.measureRef(el, index);
  };

  measureRef = (el, index) => {
    if (!el || !this.state.virtualData[index]) return;
    if (this.state.virtualData[index].type === 'comboItem') return;

    const totalHeight = this.measureElementHeight(el);

    if (
      totalHeight > 0 &&
      this.state.virtualDataHeight[index] !== totalHeight
    ) {
      this._pendingHeights = this._pendingHeights || {};
      this._pendingHeights[index] = totalHeight;
      if (this._measureRafId) return;
      this._measureRafId = requestAnimationFrame(() => {
        this._measureRafId = null;
        if (!this._isMounted) return;
        const pending = this._pendingHeights || {};
        this._pendingHeights = null;
        const newHeights = [...this.state.virtualDataHeight];
        let hasChange = false;
        let hasHeightIncrease = false;
        let minChangedIndex = Infinity;
        Object.keys(pending).forEach((key) => {
          const idx = Number(key);
          if (newHeights[idx] !== pending[key]) {
            hasHeightIncrease ||= pending[key] > newHeights[idx];
            newHeights[idx] = pending[key];
            hasChange = true;
            minChangedIndex = Math.min(minChangedIndex, idx);
          }
        });
        if (!hasChange) return;
        this.updateVirtualHeights(
          newHeights,
          minChangedIndex === Infinity ? 0 : minChangedIndex,
          hasHeightIncrease
        );
      });
    }
  };

  updateListWidth = () => {
    if (this.comboBoxPanel?.current) {
      const width = this.comboBoxPanel.current.offsetWidth;
      this.setState({ listWidth: width });
    }
  };

  // 内容渲染
  renderContentItem = (item, currentOrderCombo) => {
    const {
      isInFreeItem,
      isSpecialItem,
      itemPoints,
      itemVoucherPrice,
      isPromotionItem,
      isExchangePurchase = false,
      showRequireId,
    } = this.props;
    switch (item.type) {
      case 'comboItem':
        // 详情、价格、图片等
        return (
          <ComboItem
            setCurSectionId={this.props.setCurSectionId}
            comboStepUpTop={this.comboStepUpTop}
            isInFreeItem={isInFreeItem}
            isSpecialItem={isSpecialItem}
            itemPoints={itemPoints}
            itemVoucherPrice={itemVoucherPrice}
            isPromotionItem={isPromotionItem && !isExchangePurchase}
            showRequireId={showRequireId}
            showDescModal={this.props.showDescModal}
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
        return (
          <ComboCateyOptionItem
            sideNavList={this.props.sideNavList}
            isInFreeItem={isInFreeItem}
            isSpecialItem={isSpecialItem}
            isPromotionItem={isPromotionItem && !isExchangePurchase}
          />
        );
      case 'bottom':
        return <BottomToast />;
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
      isInFreeItem,
      isPromotionItem,
    } = this.props;

    const chooseTipMap = allRangHandler(sideNavList, t, {
      isInFreeItem,
      isPromotionItem,
    });
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
      <div
        className={styles.comboItemsTitle}
        // style={isSimpleMode ? { padding: '1rem 1rem 0', fontSize: '2.8rem' } : {}}
      >
        <span className={styles.sectionName}>{sectionName}</span>
        {!isShowComboSideNav &&
          showRequireId !== sideItemInfo.sideNameMap.id && (
            <i className={styles.comboItemsRule}>
              {chooseTipMap[sideItemInfo.sideNameMap.id] || ''}
            </i>
          )}
        {!isShowComboSideNav &&
          !o[sideItemInfo.sideNameMap.id] &&
          ![-98, -99].includes(sideItemInfo.sideNameMap.id) && (
            <i className={styles.comboItemsMust}>
              ({t('must-select-pre-dish')})
            </i>
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
    const {
      t,
      sideNavList,
      isInFreeItem,
      isSpecialItem,
      isPromotionItem,
      isExchangePurchase = false,
      selfConfig,
    } = this.props;
    const isCompleteObj = getOneUncompletedSection(
      sideNavList,
      currentOrderCombo
    );
    // 判断是否开启自主套餐sideNav（id:19）
    const isShowComboSideNav = selfConfig?.configMap?.id_19;

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

    const isVertical = getDeviceOrientation() === 'vertical';

    return (
      <div
        className={styles.comboItemsBox}
        style={
          isSimpleMode
            ? {
                paddingBottom: 0,
              }
            : {}
        }
      >
        <div className={styles.comboItemsList}>
          {sideItemInfo.sideDishList?.length
            ? sideItemInfo.sideDishList.map((sideDish) => {
                const sectionInfo = getComboSectionInfo(
                  sideNavList,
                  sideDish.sideNavId
                );
                // Sides/Drinks (-98, -99) 使用 saleItems，没有 comboSectionSaleItems
                const isSidesOrDrinks =
                  sectionInfo?.id === -98 || sectionInfo?.id === -99;
                const comboSectionSaleItems =
                  sectionInfo?.comboSectionSaleItems;
                const comboSectionSaleItem = isSidesOrDrinks
                  ? null
                  : comboSectionSaleItems?.find(
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
                // 简单模式下，最多选x个
                const isSimpleMulChoose = max !== 1;
                // 是否是售罄菜
                const isSoldoutMark = itemIsSoldOut(itemInfo);

                return (
                  <div
                    className={[
                      styles.comboItems,
                      isSimpleMode && styles.simpleModeItems,
                      isDisabled && !isSoldoutMark && styles.disabled,
                    ].join(' ')}
                    key={sideItemInfo.sideNameMap.id + '_' + itemInfo.id}
                    style={
                      isSimpleMode
                        ? isSimpleMulChoose && isShowComboSideNav && isVertical
                          ? {
                              width: `100%`,
                              margin: `0 0 2rem 0`,
                            }
                          : {}
                        : {
                            width: `calc(((100% - 2rem) - 2rem * ${colNum}) / ${colNum})`,
                          }
                    }
                  >
                    <ItemCard
                      {...this.props}
                      isSimpleMode={isSimpleMode}
                      sideNavId={sideItemInfo.sideNameMap.id}
                      isThumbPath={sideItemInfo.hasThumbPath}
                      isComboType
                      itemInfo={itemInfo}
                      isPreSelected={isPreSelected}
                      itemQty={itemQty}
                      isInFreeItem={isInFreeItem}
                      isSpecialItem={isSpecialItem}
                      isPromotionItem={isPromotionItem && !isExchangePurchase}
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

                        // Sides/Drinks (-98, -99) 作为普通菜，直接加到购物车
                        // TODO: 暂时不考虑有详情的情况，如需支持详情可在此处扩展
                        if (
                          sectionInfo?.id === -98 ||
                          sectionInfo?.id === -99
                        ) {
                          let cloneItem = { ...itemInfo, quantity: 1 };
                          if (cloneItem.itemPrices?.length === 1) {
                            cloneItem.sectionDetail = [
                              {
                                id: -1,
                                sizeInfo: Object.assign(
                                  {},
                                  cloneItem.itemPrices[0]
                                ),
                              },
                            ];
                            cloneItem.price = 0;
                          } else {
                            cloneItem.sectionDetail = [];
                          }
                          this.props.addCombo2Order(cloneItem);
                          return;
                        }

                        // 普通 combo 子菜逻辑
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
      listWidth,
      virtualData,
      overscanCount,
      isListReady,
    } = this.state;
    const {
      isInFreeItem,
      isPromotionItem,
      isExchangePurchase = false,
      isSpecialItem,
    } = this.props;
    const panelWidth =
      listWidth || this.comboBoxPanel.current?.offsetWidth || 0;

    return (
      <React.Fragment>
        <div
          className={styles.panelBox}
          ref={this.comboBoxPanel}
          style={
            !isListReady
              ? { minHeight: window.innerHeight - remToPx(10) }
              : undefined
          }
        >
          {!isListReady ? (
            <div
              className={styles.preMeasureBox}
              ref={this.preMeasureRef}
              style={{ width: panelWidth || '100%' }}
            >
              {virtualData.map((item, index) => (
                <div key={`pre-measure-row-${index}`}>
                  {this.renderContentItem(item, this.props.currentOrderCombo)}
                </div>
              ))}
            </div>
          ) : (
            <VariableSizeList
              ref={this.listRef}
              height={window.innerHeight - remToPx(10)}
              width={panelWidth || 0}
              itemCount={virtualData.length}
              itemSize={this.getItemSize}
              itemData={{
                virtualData,
                currentOrderCombo: this.props.currentOrderCombo,
              }}
              onScroll={this.handleScroll}
              overscanCount={overscanCount}
            >
              {this.renderRow}
            </VariableSizeList>
          )}
        </div>

        {/* 子菜详情 option, size */}
        <ComboSelectionModal
          sideNavList={this.props.sideNavList}
          itemInfo={selectedComboItem}
          onRef={this.openComboDetailModal}
          setCurSectionId={this.props.setCurSectionId}
          comboStepUpTop={this.comboStepUpTop}
          isEditPreSelect={this.state.isEditPreSelect}
          isInFreeItem={isInFreeItem}
          isSpecialItem={isSpecialItem}
          isPromotionItem={isPromotionItem}
          isExchangePurchase={isExchangePurchase}
          onCloseEffect={() => {
            this.setState({
              isEditPreSelect: false,
            });
          }}
          showDescModal={this.props.showDescModal}
        />

        {/* combo items的详细 */}
        <ComboItemsDetailModal
          sideNavList={this.props.sideNavList}
          onRef={this.openOrderDetailModal}
          setCurSectionId={this.props.setCurSectionId}
          handleChildUpTop={this.comboStepUpTop}
          isInFreeItem={isInFreeItem}
          isSpecialItem={isSpecialItem}
          isPromotionItem={isPromotionItem}
          isExchangePurchase={isExchangePurchase}
        />
      </React.Fragment>
    );
  }
}

function mapStateToProps(state, ownProps) {
  return {
    currentOrderCombo: state.currentOrderCombo,
    currentOrder: state.currentOrder,
    sideNavList: ownProps.sideNavList || state.sideNav.sideNavList,
    sideNavId: ownProps.sideNavId ?? state.sideNav.sideNavId,
    selfConfig: state.selfConfig,
    promotion: state.promotion,
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
  addCombo2Order,
  removeItemFromOrder,
})(withTranslation()(GeneralUsePanel));
