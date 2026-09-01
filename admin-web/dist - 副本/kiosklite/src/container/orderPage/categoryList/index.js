import React from 'react';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './categoryList.module.scss';
import Icon from '../../../component/icon';
import { getCurrentCategory, setAllMenu, setCateyPageDomTop } from '@/actions';
import { off, on } from '@/utils';
import { getCurrentItemLanguage, lineBreakTransfer } from '@/utils/busTools';
import isEqual from 'lodash/isEqual';
import calcOrderTypeCount from '../../../utils/calcOrderTypeCount';
import getStandardCateDish from '../../../utils/getStandardCateDish';
import cloneDeep from 'lodash/cloneDeep';
import getVirtualListData from '@/utils/getVirtualListData';
import classNames from 'classnames';
import { EventBus } from '@/utils/EventBus';

class CategoryList extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isInitCatey: false,
      isScroll: false,
      offsetHeight: 0,
      isShowMore: false,
      areGroupsOpen: null,
      areCateHidden: null, // 隐藏类的id集合
      areGroupsHidden: null,
      allMenu: [],
      isReady: false,
    };
  }

  getCategoryOrderItemQuantity = (categoryId) => {
    let ctgQty = 0;
    const {
      currentOrder: { itemList },
    } = this.props;
    for (let item of itemList) {
      if (item.categoryId == categoryId) {
        ctgQty += item.quantity;
      }
    }
    return ctgQty;
  };

  countCurrentItemOrderedNum = (arr) => {
    let num = 0;
    arr.map((category) => {
      num += this.getCategoryOrderItemQuantity(category.id);
    });
    return num;
  };

  toggleMenuGroupWith({ id, cateyId, isSkipToggleMenu = false }) {
    const { areGroupsOpen } = this.state;
    const { menuGroup } = this.props;
    const preGroupId = this.props.currentCategory.groupId;
    // 要打开组时
    if (!areGroupsOpen[id]) {
      if (!cateyId) {
        if (preGroupId !== id) {
          let cateyDom = document.getElementById('category_' + id);
          cateyDom?.parentNode.scrollIntoViewIfNeeded(true);
          let cateyId = cateyDom.childNodes[0]?.getAttribute('datacategoryid');
          const _cateyId = isNaN(+cateyId) ? cateyId : +cateyId;
          //this.props.getCurrentCategory(+cateyId, 'clickCategoryNav');
          const groupFirstCate = menuGroup
            .find((group) => group.id === id)
            ?.menuCategories?.find((cate) => cate.id === _cateyId);
          this.handleChooseChildCate(groupFirstCate);
        }
      } else {
        const { cateyPageDomTop } = this.props;
        if (cateyPageDomTop) {
          this.scrollDom.scrollTop = cateyPageDomTop;
        }
      }
    }

    for (let key in areGroupsOpen) {
      const _key = isNaN(+key) ? key : +key;
      if (_key === id) {
        // 品类模式切换时, 一个组会在多个品类中存在，会导致默认关闭组
        if (!isSkipToggleMenu) {
          areGroupsOpen[id] = !areGroupsOpen[id];
        }
      } else {
        areGroupsOpen[key] = false;
      }
    }
    this.setState({ areGroupsOpen });
  }

  handleScrollTopCategoryMenu = (id) => {
    const topContainer = document.getElementById('topCategoryList');
    const topCategory = topContainer?.querySelector(
      `div[datacategoryid="${id}"]`
    );
    const { left, right, width } = topCategory.getBoundingClientRect();
    const rightDistance = window.innerWidth - right;
    if (left <= 200 || rightDistance <= 200) {
      // 滚动到中间
      const parentScrollLeft = topContainer.scrollLeft;
      const childCenter = left + width / 2;
      const parentCenter = window.innerWidth / 2;
      const scrollAmount = childCenter - parentCenter;
      topContainer.scrollTo({
        left: parentScrollLeft + scrollAmount,
        behavior: 'smooth',
      });
    }
  };

  // 点击组下面的子类
  handleChooseChildCate = (category) => {
    window.isManualScrolling = true;
    const { crm } = this.props;
    if (!category?.id) return;
    this.props.getCurrentCategory(category.id, 'clickCategoryNav');
    const { selfConfig, isTopMenu, freeListIsExpanded } = this.props;
    const isOpenLazyLoad = selfConfig?.configList?.find(
      (each) => each.id === 32
    )?.value;
    // 非瀑布流模式下需要自动滚动top menu
    if (!isOpenLazyLoad && isTopMenu) {
      this.handleScrollTopCategoryMenu(category.id);
    }
    const { allMenu } = this.state;
    const allCate = allMenu.map((group) => group.menuCategories)?.flat();
    const listData = getVirtualListData({
      allCateList: allCate,
      isTopMenu,
      selfConfig,
      isExpand: freeListIsExpanded,
      freeItemMenuPosition: crm?.freeItemMenuPosition,
    });
    const cateIdx = listData.findIndex((cate) => cate.id === category.id);
    let height = 0;
    for (let i = 0; i < cateIdx; i++) {
      height += listData[i].height;
    }
    this.props.listRef?.current?.scrollTo(height);
    const t = setTimeout(() => {
      window.isManualScrolling = false;
      clearTimeout(t);
    }, 800);
  };

  // dom元素滚动事件
  handleScroll = () => {
    if (!this.state.isScroll) {
      this.setState(
        {
          isScroll: true,
        },
        () => {
          off(this.scrollDom, 'scroll', this.handleScroll);
        }
      );
    }
  };

  // 组更新后，重新默认开启第一个组
  updateCateyIdByNewMenu = () => {
    const { menuGroup } = this.props;
    const { areGroupsOpen } = this.state;
    if (menuGroup?.length) {
      const fId = menuGroup[0].id;
      // 判断第一个组下面的id，是否true开启
      if (!areGroupsOpen[fId]) {
        this.setDefaultGroupIdCateyId();
      }
    }
  };

  setDefaultCateAndGroup = () => {
    if (this.scrollDom) {
      let childrenList = this.scrollDom?.childNodes;
      if (childrenList) {
        let groupId = childrenList[0]?.getAttribute('datagroupid');
        if (groupId) {
          let cateyDom = document.getElementById('category_' + groupId);
          let cateyId = cateyDom.childNodes[0]?.getAttribute('datacategoryid');
          const _cateyId = isNaN(+cateyId) ? cateyId : +cateyId;
          this.props.getCurrentCategory(_cateyId, 'clickCategoryNav');
        }
      }
    }
  };

  // 根据dom设置默认的groupId和cateyId
  setDefaultGroupIdCateyId = (isSkipToggleMenu = false) => {
    if (this.scrollDom) {
      let childrenList = this.scrollDom.childNodes;
      let groupId = childrenList[0]?.getAttribute('datagroupid');
      const _groupId = isNaN(+groupId) ? groupId : +groupId; // 能转成数字就用数字，否则用原值（字符串）
      if (_groupId) {
        this.toggleMenuGroupWith({ id: _groupId, isSkipToggleMenu });
        let cateyDom = document.getElementById('category_' + groupId);
        let cateyId = cateyDom.childNodes[0]?.getAttribute('datacategoryid');
        const _cateyId = isNaN(+cateyId) ? cateyId : +cateyId;
        this.props.getCurrentCategory(_cateyId, 'clickCategoryNav');
      }
    }
  };

  // 判断是否有类
  judgeHasCateyList = (menuCategories) => {
    let n = 0;
    const {
      currentOrder: { orderType },
    } = this.props;
    if (menuCategories && menuCategories.length) {
      for (let i = 0; i < menuCategories.length; i++) {
        let cateyList = menuCategories[i];
        if (cateyList?.saleItems?.length) {
          let c = calcOrderTypeCount(cateyList.saleItems, orderType);
          n += c;
        }
      }
    }
    return n > 0;
  };

  // 初始化 setCategory setGroup
  initSetGroupAndCategory = (isSkipToggleMenu = false) => {
    const isDefaultExpand = this.props.selfConfig?.configList?.find(
      (each) => each.id === 22
    )?.value;
    if (isDefaultExpand) {
      this.setDefaultGroupIdCateyId(isSkipToggleMenu);
    } else {
      this.setDefaultCateAndGroup();
    }
  };

  // 强制更新allMenu的方法
  forceUpdateAllMenu = () => {
    const allMenu = this.handleGetGroupBySearch();
    this.setState(
      {
        allMenu,
      },
      () => {
        this.props.setAllMenu(allMenu);
      }
    );
  };

  componentDidMount() {
    const { menuGroup, categoryList } = this.props;
    const allMenu = this.handleGetGroupBySearch();
    this.setState(
      {
        allMenu,
        ...this.reInitGroupStatus({ menuGroup, categoryList }),
      },
      () => {
        this.props.setAllMenu(allMenu);
        if (this.props.currentCategory?.id) {
          this.toggleMenuGroupWith({
            id: this.props.currentCategory.groupId,
            cateyId: true,
          });
          this.props.getCurrentCategory(
            this.props.currentCategory.id,
            'clickCategoryNav'
          );
          const { vListScrollHeight } = this.props;
          this.props.listRef?.current?.scrollTo(vListScrollHeight);
        } else {
          this.initSetGroupAndCategory();
        }

        if (this.scrollDom) {
          this.setState({
            offsetHeight: this.scrollDom.offsetHeight,
            isShowMore: !!(
              this.scrollDom?.scrollHeight > this.scrollDom.offsetHeight
            ),
          });
          on(this.scrollDom, 'scroll', this.handleScroll);
        }
      }
    );
    // 监听菜单更新事件
    EventBus.on('menu_group_updated', this.forceUpdateAllMenu);
  }

  judgeSameMenuById = (menu, oldMenu) => {
    const ids = menu.map((_) => _.id);
    const oIds = oldMenu.map((_) => _.id);
    return isEqual(ids, oIds);
  };

  reInitGroupStatus = ({ menuGroup, categoryList }) => {
    const areGroupsOpen = {};
    const areCateHidden = {};
    const areGroupsHidden = {};
    //if (state.areGroupsOpen === null) {
    if (menuGroup?.length) {
      menuGroup.forEach((group) => {
        if (group.menuCategories) {
          areGroupsOpen[group.id] = false;
          let visibleCateQty = 0;
          group.menuCategories.forEach((cate) => {
            if (cate?.saleItems?.length > 0) {
              let visibleItemQty = 0;
              cate.saleItems.forEach((item) => {
                if (cate?.id === 'promotion-deals-list') {
                  visibleItemQty = cate?.saleItems?.length;
                  return;
                }
                if (
                  item.hiddenItem === false ||
                  (item.hiddenItem === true && item.isFreeItem)
                ) {
                  visibleItemQty++;
                }
              });

              if (visibleItemQty == 0 || cate.hiddenCategory) {
                areCateHidden[cate.id] = true;
              }

              if (
                categoryList.filter((c) => c.id == cate.id).length > 0 &&
                visibleItemQty > 0
              ) {
                visibleCateQty++;
              }
            }
          });

          if (visibleCateQty == 0) {
            areGroupsHidden[group.id] = true;
          }
        }
      });
    }

    return {
      areGroupsOpen,
      areCateHidden,
      areGroupsHidden,
    };
  };

  componentDidUpdate(prevProps) {
    const { menuGroup } = this.props;
    const orderTypeChanged =
      prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType;

    if (orderTypeChanged) {
      const allMenu = this.handleGetGroupBySearch();
      this.setState({ allMenu }, () => {
        this.props.setAllMenu(allMenu);
      });
    }

    if (!this.judgeSameMenuById(menuGroup, prevProps.menuGroup)) {
      const allMenu = this.handleGetGroupBySearch();
      this.setState({
        allMenu,
      });
      this.props.setAllMenu(allMenu);
      const categoryList = menuGroup.map((g) => g.menuCategories).flat();
      this.setState(
        {
          ...this.reInitGroupStatus({ menuGroup, categoryList }),
        },
        () => {
          this.updateCateyIdByNewMenu();
        }
      );
    }

    // 检查组件是否真正准备好
    if (
      !this.state.isReady &&
      this.state.allMenu.length > 0 &&
      this.scrollDom
    ) {
      this.setState({ isReady: true }, () => {
        this.props.onReady && this.props.onReady();
      });
    }

    // 当前没有滚动过，判断是否提示more
    if (!this.state.isScroll) {
      let bool = !!(
        this.scrollDom?.scrollHeight - 10 >
        this.state.offsetHeight
      );
      if (bool != this.state.isShowMore) {
        this.setState({
          isShowMore: bool,
        });
      }
    }

    // 解决在不展示order type 页时，headerHeight更新不及时导致初始化时，右侧列表滑动问题
    if (prevProps.headerHeight !== this.props.headerHeight) {
      this.handleChooseChildCate(this.props.currentCategory);
    }

    if (
      prevProps.brandSetting.selectedBrand.id !==
      this.props.brandSetting.selectedBrand.id
    ) {
      const { areGroupsOpen } = this.state;
      const keys = Object.keys(areGroupsOpen);
      const newOpens = {};
      for (let i = 0; i < keys.length; i++) {
        let key = keys[i];
        newOpens[key] = false;
      }
      this.setState(
        {
          areGroupsOpen: {
            areGroupsOpen: newOpens,
          },
        },
        () => {
          // 品类模式切换时，根据配置默认打开第一个组
          this.initSetGroupAndCategory(true);
        }
      );
    }

    if (prevProps.currentCategory?.id !== this.props.currentCategory?.id) {
      if (!this.props.currentCategory?.id || !prevProps.currentCategory?.id)
        return;
      const isDefaultOpen = this.props.selfConfig?.configList?.find(
        (each) => each.id === 22
      )?.value;
      if (!isDefaultOpen) return;
      const cateId = this.props.currentCategory?.id;
      const group = menuGroup.find((group) =>
        group.menuCategories?.map((group) => group.id).includes(cateId)
      );
      const { id } = group;
      const { areGroupsOpen } = this.state;
      if (areGroupsOpen[id]) return;
      const newGroupsOpen = Object.keys(areGroupsOpen)?.reduce((pre, cur) => {
        pre[cur] = false;
        return pre;
      }, {});
      this.setState({
        areGroupsOpen: {
          ...newGroupsOpen,
          [id]: true,
        },
      });
    }

    if (
      prevProps.searchKeyWord !== this.props.searchKeyWord ||
      prevProps.brandSetting.selectedBrand.id !==
        this.props.brandSetting.selectedBrand.id
    ) {
      const allMenu = this.handleGetGroupBySearch();
      this.setState({
        allMenu,
      });
      this.props.setAllMenu(allMenu);
    }
  }

  componentWillUnmount() {
    off(this.scrollDom, 'scroll', this.handleScroll);
    // 取消监听菜单更新事件
    EventBus.off('menu_group_updated');
    const { history } = this.props;
    if (
      history.location.pathname.indexOf('/orderReview') > -1 ||
      history.location.pathname.indexOf('/comboPanel') > -1
    ) {
      let top = Math.floor(this.scrollDom?.scrollTop) || 0;
      this.props.setCateyPageDomTop(top);
    } else {
      this.props.setCateyPageDomTop(0);
    }
  }

  handleGetGroupBySearch = () => {
    const {
      menuGroup,
      searchItem,
      selfConfig,
      brandSetting,
      searchKeyWord,
      currentOrder: { orderType },
    } = this.props;
    // 有搜索字段 无内容
    if (searchKeyWord && !searchItem?.length) return [];
    const isOpenBrandSetting = selfConfig?.configMap?.id_26;
    const allMenu = isOpenBrandSetting ? brandSetting.brandMenu : menuGroup;
    const standardCateDish = getStandardCateDish({
      isOpenBrandSetting,
      brandMenu: brandSetting?.brandMenu || [],
      menuGroup, // : cloneDeep(menuGroup)
      orderType,
    });
    const uniqueGroupIds = [
      ...new Set(standardCateDish?.map((cate) => cate.groupId) || []),
    ];
    const cateIds = standardCateDish.map((cate) => cate.id);
    const standardMenu = allMenu
      .filter((group) => uniqueGroupIds.includes(group.id))
      ?.map((each) => {
        const newMenuCategory = each.menuCategories.filter((cate) =>
          cateIds.includes(cate.id)
        );
        return {
          ...each,
          menuCategories: newMenuCategory.map((c) => {
            const { id } = c;
            const actualSaleItems = standardCateDish.find(
              (sc) => sc.id === id
            )?.saleItems;
            return {
              ...c,
              saleItems: actualSaleItems,
            };
          }),
        };
      });
    if (!searchItem?.length) return standardMenu;
    const searchIds = searchItem
      .filter((i) => {
        return !i.hiddenItem || (i.hiddenItem && i.isFreeItem);
      })
      ?.map((item) => item.id);
    return standardMenu
      .map((group) => {
        const newMenuCategory = group.menuCategories
          .map((category) => {
            const newSaleItems = category.saleItems?.filter((item) =>
              searchIds.includes(item.id)
            );
            return { ...category, saleItems: newSaleItems };
          })
          .filter((c) => c.saleItems?.length > 0);
        return {
          ...group,
          menuCategories: newMenuCategory,
        };
      })
      ?.filter((group) => group?.menuCategories?.length);
  };

  render() {
    const { areGroupsOpen, areGroupsHidden, areCateHidden, allMenu } =
      this.state;
    const {
      i18n: { language },
      // menuGroup,
      currentCategory,
      selfConfig,
      // brandSetting,
      currentOrder: { orderType, itemList },
      headerHeight,
      isTopMenu,
    } = this.props;

    // 是否开通显示组（id:17）
    const isShowGroup = selfConfig?.configMap?.id_17;
    // const isOpenBrandSetting = selfConfig?.configMap?.id_26;

    const categories = allMenu.map((group) => {
      let isHasCateyList = this.judgeHasCateyList(group?.menuCategories);

      if (
        group?.menuCategories?.length &&
        areGroupsHidden[group.id] != true &&
        isHasCateyList
      ) {
        const choseNum = this.countCurrentItemOrderedNum(group.menuCategories);
        return (
          <div
            key={group.id}
            datagroupid={group.id}
            className={styles.groupBox}
          >
            {/* 组 */}
            {isShowGroup ? (
              <div
                id={'menuGroup_' + group.id}
                className={[
                  styles.menuGroup,
                  areGroupsOpen[group.id]
                    ? `${styles.menuGroupActived} animate-btn`
                    : '',
                ].join(' ')}
                onClick={() => this.toggleMenuGroupWith({ id: group.id })}
              >
                <div className={styles.title}>
                  {lineBreakTransfer(
                    getCurrentItemLanguage(
                      group.fieldDisplayNameGroups,
                      language
                    ) || group.name
                  )}
                </div>
                {choseNum ? (
                  <div className={styles.word}>{choseNum}</div>
                ) : (
                  <Icon
                    type="more"
                    size={4}
                    style={{
                      transform: areGroupsOpen[group.id]
                        ? 'rotate(90deg)'
                        : 'rotate(0)',
                    }}
                  />
                )}
              </div>
            ) : null}

            {/* 组下的子类 */}
            <div
              id={'category_' + group.id}
              className={
                isShowGroup
                  ? styles.categoryListContainer
                  : styles.categoryNoGroup
              }
              style={{
                display: isShowGroup
                  ? areGroupsOpen[group.id]
                    ? 'block'
                    : 'none'
                  : 'block',
              }}
            >
              {group?.menuCategories?.length
                ? group.menuCategories.map((category) => {
                    const isPromotionDealList =
                      category?.id === 'promotion-deals-list';
                    const bool =
                      category?.saleItems?.length &&
                      (category.saleItems.find((s) => {
                        return (
                          s.hiddenItem == false ||
                          (s.hiddenItem == true && s.isFreeItem)
                        );
                      }) ||
                        isPromotionDealList);
                    const isHasSaleItem =
                      calcOrderTypeCount(category?.saleItems || [], orderType) >
                      0;

                    if (
                      bool &&
                      isHasSaleItem &&
                      areCateHidden[category.id] != true
                    ) {
                      return (
                        <div
                          key={category.id}
                          datacategoryid={category.id}
                          className={[
                            styles.categoryBtn,
                            currentCategory.id == category.id
                              ? isShowGroup
                                ? styles.selectedCtg
                                : styles.selectedNoGroupCtg
                              : '',
                          ].join(' ')}
                          onClick={() => {
                            this.handleChooseChildCate(category);
                          }}
                        >
                          <div className={styles.categoryName}>
                            <span className={styles.categoryNameLabel}>
                              {lineBreakTransfer(
                                getCurrentItemLanguage(
                                  category.fieldDisplayNameGroups,
                                  language
                                ) || category.name
                              )}
                            </span>
                            {this.getCategoryOrderItemQuantity(category.id) >
                            0 ? (
                              <span className={styles.ctgItemQty}>
                                {this.getCategoryOrderItemQuantity(category.id)}
                              </span>
                            ) : null}
                          </div>
                        </div>
                      );
                    }
                  })
                : null}
            </div>
          </div>
        );
      }
    });
    let leftMenuSpace = headerHeight;
    const isOrderedItem = itemList.length > 0;
    if (!isTopMenu && isOrderedItem) {
      leftMenuSpace += 10;
    }

    return (
      <>
        {isTopMenu ? (
          <div
            className={styles.topMenu}
            id="topCategoryList"
            ref={(el) => (this.scrollDom = el)}
          >
            {allMenu.map((group) => {
              let isHasCateyList = this.judgeHasCateyList(
                group?.menuCategories
              );
              if (
                group?.menuCategories?.length &&
                areGroupsHidden[group.id] != true &&
                isHasCateyList
              ) {
                return (
                  <div
                    key={group.id}
                    datagroupid={group.id}
                    className={styles.outWrapper}
                  >
                    {/* 组下的子类 */}
                    <div
                      id={'category_' + group.id}
                      className={styles.groupWrapper}
                    >
                      {group?.menuCategories?.length
                        ? group.menuCategories.map((category) => {
                            const isPromotionDealList =
                              category?.id === 'promotion-deals-list';
                            const bool =
                              category?.saleItems?.length &&
                              (category.saleItems.find((s) => {
                                return (
                                  s.hiddenItem == false ||
                                  (s.hiddenItem == true && s.isFreeItem)
                                );
                              }) ||
                                isPromotionDealList);
                            const isHasSaleItem =
                              calcOrderTypeCount(
                                category?.saleItems || [],
                                orderType
                              ) > 0;

                            if (
                              bool &&
                              isHasSaleItem &&
                              areCateHidden[category.id] != true
                            ) {
                              return (
                                <div
                                  key={category.id}
                                  datacategoryid={category.id}
                                  onClick={() => {
                                    this.handleChooseChildCate(category);
                                  }}
                                  className={classNames(
                                    styles.categoryWrapper,
                                    currentCategory.id == category.id &&
                                      `${styles.select} animate-btn`
                                  )}
                                >
                                  <div>
                                    <span>
                                      {lineBreakTransfer(
                                        getCurrentItemLanguage(
                                          category.fieldDisplayNameGroups,
                                          language
                                        ) || category.name
                                      )}
                                    </span>
                                    {this.getCategoryOrderItemQuantity(
                                      category.id
                                    ) > 0 ? (
                                      <div className={styles.showQty}>
                                        {this.getCategoryOrderItemQuantity(
                                          category.id
                                        )}
                                      </div>
                                    ) : null}
                                  </div>
                                </div>
                              );
                            }
                          })
                        : null}
                    </div>
                  </div>
                );
              }
            })}
          </div>
        ) : (
          <div
            id="categoryListId"
            style={{ height: `calc(100vh - ${leftMenuSpace}rem)` }}
            className={styles.categoryList}
            ref={(el) => (this.scrollDom = el)}
          >
            {categories}
            <div className={styles.empty}></div>
            {/*{!this.state.isScroll && this.state.isShowMore && <MoreTip classname />}*/}
          </div>
        )}
      </>
    );
  }
}

function mapStateToProps(state) {
  return {
    categoryList: state.currentCategoryList,
    currentCategory: state.currentCategory,
    currentOrder: state.currentOrder,
    menuGroup: state.menuGroup,
    freeListIsExpanded: state.freeListIsExpanded,
    cateyPageDomTop: state.orderEdit.cateyPageDomTop,
    selfConfig: state.selfConfig,
    brandSetting: state.brandSetting,
    searchItem: state.searchItem,
    searchKeyWord: state.searchKeyWord,
    vListScrollHeight: state.orderEdit.vListScrollHeight,
    crm: state.crm,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    getCurrentCategory,
    setCateyPageDomTop,
    setAllMenu,
  })(withTranslation()(CategoryList))
);
