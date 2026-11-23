import { d as __toESM, i as require_react, n as require_jsx_runtime } from "./toast-C8a1ReSo.js";
import { H as EventBus, d as on, u as off } from "./utils-Cdx9DbDR.js";
import { r as connect } from "./es-CFYDnMm2.js";
import { n as withRouter } from "./react-router-zXytb7Dz.js";
import { Er as lineBreakTransfer, Et as setCateyPageDomTop, da as require_cloneDeep, gt as searchItemHandler, j as getCurrentCategory, pr as getCurrentItemLanguage, vt as setAllMenu } from "./actions-BwRPwnFF.js";
import { t as withTranslation } from "./withTranslation-B2KLWeHY.js";
import { t as require_classnames } from "./classnames-CpUpjBdR.js";
import { t as Icons } from "./icon-CewZkCRp.js";
import { r as calcOrderTypeCount, t as getStandardCateDish } from "./getStandardCateDish-BKfAMpZF.js";
import { t as require_isEqual } from "./isEqual-PfNrN1Me.js";
import { a as getVirtualListData, i as preserveGroupOpenState, r as menuContainsCategory } from "./menuUpdatePosition-YdhPKLgg.js";
//#region source-snapshot/src/container/orderPage/categoryList/categoryList.module.scss
var import_react = /* @__PURE__ */ __toESM(require_react());
var categoryList_module_default = {
	categoryList: "categoryList___MEf-L",
	empty: "empty___Rd1Ra",
	categoryNoGroup: "categoryNoGroup___rvZqI",
	categoryBtn: "categoryBtn___xsofI",
	categoryNameLabel: "categoryNameLabel___Uul-M",
	groupBox: "groupBox___IClJT",
	groupSale: "groupSale___qA1aF",
	menuGroup: "menuGroup___NCWWD",
	title: "title___v2MrM",
	word: "word___6u-r-",
	menuGroupActived: "menuGroupActived___Ii9Ho",
	selectedCtg: "selectedCtg___Wjl57",
	selectedNoGroupCtg: "selectedNoGroupCtg___VSgVy",
	ctgItemQty: "ctgItemQty___SIyD3",
	categoryName: "categoryName___3JKdi",
	topMenu: "topMenu___JX-7x",
	outWrapper: "outWrapper___hpQK4",
	groupWrapper: "groupWrapper___Kxa-w",
	categoryWrapper: "categoryWrapper___DqQbE",
	select: "select___sLQSV",
	showQty: "showQty___AF5rC"
};
//#endregion
//#region source-snapshot/src/container/orderPage/categoryList/index.js
var import_isEqual = /* @__PURE__ */ __toESM(require_isEqual());
require_cloneDeep();
var import_classnames = /* @__PURE__ */ __toESM(require_classnames());
var import_jsx_runtime = require_jsx_runtime();
var CategoryList = class extends import_react.Component {
	constructor(props) {
		super(props);
		this.state = {
			isInitCatey: false,
			isScroll: false,
			offsetHeight: 0,
			isShowMore: false,
			areGroupsOpen: null,
			areCateHidden: null,
			areGroupsHidden: null,
			allMenu: [],
			isReady: false
		};
	}
	getCategoryOrderItemQuantity = (categoryId) => {
		let ctgQty = 0;
		const { currentOrder: { itemList } } = this.props;
		for (let item of itemList) if (item.categoryId == categoryId) ctgQty += item.quantity;
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
		if (!areGroupsOpen[id]) if (!cateyId) {
			if (preGroupId !== id) {
				let cateyDom = document.getElementById("category_" + id);
				cateyDom?.parentNode.scrollIntoViewIfNeeded(true);
				let cateyId = cateyDom.childNodes[0]?.getAttribute("datacategoryid");
				const _cateyId = isNaN(+cateyId) ? cateyId : +cateyId;
				const groupFirstCate = menuGroup.find((group) => group.id === id)?.menuCategories?.find((cate) => cate.id === _cateyId);
				this.handleChooseChildCate(groupFirstCate);
			}
		} else {
			const { cateyPageDomTop } = this.props;
			if (cateyPageDomTop) this.scrollDom.scrollTop = cateyPageDomTop;
		}
		for (let key in areGroupsOpen) if ((isNaN(+key) ? key : +key) === id) {
			if (!isSkipToggleMenu) areGroupsOpen[id] = !areGroupsOpen[id];
		} else areGroupsOpen[key] = false;
		this.setState({ areGroupsOpen });
	}
	handleScrollTopCategoryMenu = (id) => {
		const topContainer = document.getElementById("topCategoryList");
		const { left, right, width } = (topContainer?.querySelector(`div[datacategoryid="${id}"]`)).getBoundingClientRect();
		const rightDistance = window.innerWidth - right;
		if (left <= 200 || rightDistance <= 200) {
			const parentScrollLeft = topContainer.scrollLeft;
			const scrollAmount = left + width / 2 - window.innerWidth / 2;
			topContainer.scrollTo({
				left: parentScrollLeft + scrollAmount,
				behavior: "smooth"
			});
		}
	};
	handleChooseChildCate = (category) => {
		window.isManualScrolling = true;
		const { crm } = this.props;
		if (!category?.id) return;
		this.props.getCurrentCategory(category.id, "clickCategoryNav");
		const { selfConfig, isTopMenu, freeListIsExpanded } = this.props;
		if (!selfConfig?.configList?.find((each) => each.id === 32)?.value && isTopMenu) this.handleScrollTopCategoryMenu(category.id);
		const { allMenu } = this.state;
		const allCate = allMenu.map((group) => group.menuCategories)?.flat();
		const listData = this.props.listRef?.current?.props?.itemData?.virtualDataList || getVirtualListData({
			allCateList: allCate,
			isTopMenu,
			selfConfig,
			isExpand: freeListIsExpanded,
			freeItemMenuPosition: crm?.freeItemMenuPosition
		});
		const cateIdx = listData.findIndex((cate) => cate.id === category.id);
		let height = 0;
		for (let i = 0; i < cateIdx; i++) height += listData[i].height;
		this.props.listRef?.current?.scrollTo(height);
		const t = setTimeout(() => {
			window.isManualScrolling = false;
			clearTimeout(t);
		}, 800);
	};
	navigateToRequiredCategory = (categoryId) => {
		if (this.props.searchKeyWord) {
			this.pendingRequiredCategoryId = categoryId;
			this.props.searchItemHandler("");
			return;
		}
		const group = this.state.allMenu.find((item) => item.menuCategories?.some((category) => String(category.id) === String(categoryId)));
		const category = group?.menuCategories.find((item) => String(item.id) === String(categoryId));
		if (!category) return;
		this.handleChooseChildCate(category);
		const scrollToCategory = () => {
			(this.scrollDom?.querySelector(`[datacategoryid="${category.id}"]`))?.scrollIntoViewIfNeeded?.(true);
		};
		if (this.props.selfConfig?.configMap?.id_17 && group.id != null) this.setState(({ areGroupsOpen }) => ({ areGroupsOpen: Object.keys(areGroupsOpen).reduce((open, id) => {
			open[id] = String(id) === String(group.id);
			return open;
		}, {}) }), scrollToCategory);
		else scrollToCategory();
	};
	handleScroll = () => {
		if (!this.state.isScroll) this.setState({ isScroll: true }, () => {
			off(this.scrollDom, "scroll", this.handleScroll);
		});
	};
	updateCateyIdByNewMenu = () => {
		const { menuGroup } = this.props;
		const { areGroupsOpen } = this.state;
		if (menuGroup?.length) {
			if (!areGroupsOpen[menuGroup[0].id]) this.setDefaultGroupIdCateyId();
		}
	};
	setDefaultCateAndGroup = () => {
		if (this.scrollDom) {
			let childrenList = this.scrollDom?.childNodes;
			if (childrenList) {
				let groupId = childrenList[0]?.getAttribute("datagroupid");
				if (groupId) {
					let cateyId = document.getElementById("category_" + groupId).childNodes[0]?.getAttribute("datacategoryid");
					const _cateyId = isNaN(+cateyId) ? cateyId : +cateyId;
					this.props.getCurrentCategory(_cateyId, "clickCategoryNav");
				}
			}
		}
	};
	setDefaultGroupIdCateyId = (isSkipToggleMenu = false) => {
		if (this.scrollDom) {
			let groupId = this.scrollDom.childNodes[0]?.getAttribute("datagroupid");
			const _groupId = isNaN(+groupId) ? groupId : +groupId;
			if (_groupId) {
				this.toggleMenuGroupWith({
					id: _groupId,
					isSkipToggleMenu
				});
				let cateyId = document.getElementById("category_" + groupId).childNodes[0]?.getAttribute("datacategoryid");
				const _cateyId = isNaN(+cateyId) ? cateyId : +cateyId;
				this.props.getCurrentCategory(_cateyId, "clickCategoryNav");
			}
		}
	};
	judgeHasCateyList = (menuCategories) => {
		let n = 0;
		const { currentOrder: { orderType } } = this.props;
		if (menuCategories && menuCategories.length) for (let i = 0; i < menuCategories.length; i++) {
			let cateyList = menuCategories[i];
			if (cateyList?.saleItems?.length) {
				let c = calcOrderTypeCount(cateyList.saleItems, orderType);
				n += c;
			}
		}
		return n > 0;
	};
	initSetGroupAndCategory = (isSkipToggleMenu = false) => {
		if (this.props.selfConfig?.configList?.find((each) => each.id === 22)?.value) this.setDefaultGroupIdCateyId(isSkipToggleMenu);
		else this.setDefaultCateAndGroup();
	};
	forceUpdateAllMenu = () => {
		const allMenu = this.handleGetGroupBySearch();
		this.setState({ allMenu }, () => {
			this.props.setAllMenu(allMenu);
		});
	};
	componentDidMount() {
		const { menuGroup, categoryList } = this.props;
		const allMenu = this.handleGetGroupBySearch();
		this.setState({
			allMenu,
			...this.reInitGroupStatus({
				menuGroup,
				categoryList
			})
		}, () => {
			this.props.setAllMenu(allMenu);
			if (this.props.currentCategory?.id) {
				this.toggleMenuGroupWith({
					id: this.props.currentCategory.groupId,
					cateyId: true
				});
				this.props.getCurrentCategory(this.props.currentCategory.id, "clickCategoryNav");
				const { vListScrollHeight } = this.props;
				this.props.listRef?.current?.scrollTo(vListScrollHeight);
			} else this.initSetGroupAndCategory();
			if (this.scrollDom) {
				this.setState({
					offsetHeight: this.scrollDom.offsetHeight,
					isShowMore: !!(this.scrollDom?.scrollHeight > this.scrollDom.offsetHeight)
				});
				on(this.scrollDom, "scroll", this.handleScroll);
			}
		});
		EventBus.on("menu_group_updated", this.forceUpdateAllMenu);
		EventBus.on("navigate_to_required_category", this.navigateToRequiredCategory);
	}
	judgeSameMenuById = (menu, oldMenu) => {
		return (0, import_isEqual.default)(menu.map((_) => _.id), oldMenu.map((_) => _.id));
	};
	reInitGroupStatus = ({ menuGroup, categoryList }) => {
		const areGroupsOpen = {};
		const areCateHidden = {};
		const areGroupsHidden = {};
		if (menuGroup?.length) menuGroup.forEach((group) => {
			if (group.menuCategories) {
				areGroupsOpen[group.id] = false;
				let visibleCateQty = 0;
				group.menuCategories.forEach((cate) => {
					if (cate?.saleItems?.length > 0) {
						let visibleItemQty = 0;
						cate.saleItems.forEach((item) => {
							if (cate?.id === "promotion-deals-list") {
								visibleItemQty = cate?.saleItems?.length;
								return;
							}
							if (item.hiddenItem === false || item.hiddenItem === true && item.isFreeItem) visibleItemQty++;
						});
						if (visibleItemQty == 0 || cate.hiddenCategory) areCateHidden[cate.id] = true;
						if (categoryList.filter((c) => c.id == cate.id).length > 0 && visibleItemQty > 0) visibleCateQty++;
					}
				});
				if (visibleCateQty == 0) areGroupsHidden[group.id] = true;
			}
		});
		return {
			areGroupsOpen,
			areCateHidden,
			areGroupsHidden
		};
	};
	componentDidUpdate(prevProps) {
		const { menuGroup } = this.props;
		if (prevProps.currentOrder?.orderType !== this.props.currentOrder?.orderType) {
			const allMenu = this.handleGetGroupBySearch();
			this.setState({ allMenu }, () => {
				this.props.setAllMenu(allMenu);
			});
		}
		if (!this.judgeSameMenuById(menuGroup, prevProps.menuGroup)) {
			const allMenu = this.handleGetGroupBySearch();
			this.setState({ allMenu });
			this.props.setAllMenu(allMenu);
			const categoryList = menuGroup.map((g) => g.menuCategories).flat();
			const currentCategoryId = this.props.currentCategory?.id;
			const currentCategoryGroup = menuGroup.find((group) => group.menuCategories?.some((category) => `${category.id}` === `${currentCategoryId}`));
			const nextGroupStatus = this.reInitGroupStatus({
				menuGroup,
				categoryList
			});
			const shouldKeepCurrentCategory = menuContainsCategory(menuGroup, currentCategoryId);
			this.setState({
				...nextGroupStatus,
				areGroupsOpen: preserveGroupOpenState({
					menuGroup,
					previousOpenGroups: this.state.areGroupsOpen,
					currentGroupId: currentCategoryGroup?.id
				})
			}, () => {
				if (!shouldKeepCurrentCategory) this.updateCateyIdByNewMenu();
			});
		}
		if (!this.state.isReady && this.state.allMenu.length > 0 && this.scrollDom) this.setState({ isReady: true }, () => {
			this.props.onReady && this.props.onReady();
		});
		if (!this.state.isScroll) {
			let bool = !!(this.scrollDom?.scrollHeight - 10 > this.state.offsetHeight);
			if (bool != this.state.isShowMore) this.setState({ isShowMore: bool });
		}
		if (prevProps.headerHeight !== this.props.headerHeight) this.handleChooseChildCate(this.props.currentCategory);
		if (prevProps.brandSetting.selectedBrand.id !== this.props.brandSetting.selectedBrand.id) {
			const { areGroupsOpen } = this.state;
			const keys = Object.keys(areGroupsOpen);
			const newOpens = {};
			for (let i = 0; i < keys.length; i++) {
				let key = keys[i];
				newOpens[key] = false;
			}
			this.setState({ areGroupsOpen: { areGroupsOpen: newOpens } }, () => {
				this.initSetGroupAndCategory(true);
			});
		}
		if (prevProps.currentCategory?.id !== this.props.currentCategory?.id) {
			if (!this.props.currentCategory?.id || !prevProps.currentCategory?.id) return;
			if (!this.props.selfConfig?.configList?.find((each) => each.id === 22)?.value) return;
			const cateId = this.props.currentCategory?.id;
			const { id } = menuGroup.find((group) => group.menuCategories?.map((group) => group.id).includes(cateId));
			const { areGroupsOpen } = this.state;
			if (areGroupsOpen[id]) return;
			const newGroupsOpen = Object.keys(areGroupsOpen)?.reduce((pre, cur) => {
				pre[cur] = false;
				return pre;
			}, {});
			this.setState({ areGroupsOpen: {
				...newGroupsOpen,
				[id]: true
			} });
		}
		if (prevProps.searchKeyWord !== this.props.searchKeyWord || prevProps.brandSetting.selectedBrand.id !== this.props.brandSetting.selectedBrand.id) {
			const allMenu = this.handleGetGroupBySearch();
			this.setState({ allMenu }, () => {
				this.props.setAllMenu(allMenu);
				const isOpenLazyLoad = this.props.selfConfig?.configList?.find((each) => each.id === 32)?.value;
				if (this.props.searchKeyWord && !isOpenLazyLoad && !menuContainsCategory(allMenu, this.props.currentCategory?.id)) {
					const firstCategory = allMenu[0]?.menuCategories?.[0];
					if (firstCategory) this.handleChooseChildCate(firstCategory);
				}
				if (!this.props.searchKeyWord && this.pendingRequiredCategoryId != null) {
					const categoryId = this.pendingRequiredCategoryId;
					this.pendingRequiredCategoryId = null;
					this.navigateToRequiredCategory(categoryId);
				}
			});
		}
	}
	componentWillUnmount() {
		off(this.scrollDom, "scroll", this.handleScroll);
		EventBus.off("menu_group_updated");
		EventBus.off("navigate_to_required_category", this.navigateToRequiredCategory);
		const { history } = this.props;
		if (history.location.pathname.indexOf("/orderReview") > -1 || history.location.pathname.indexOf("/comboPanel") > -1) {
			let top = Math.floor(this.scrollDom?.scrollTop) || 0;
			this.props.setCateyPageDomTop(top);
		} else this.props.setCateyPageDomTop(0);
	}
	handleGetGroupBySearch = () => {
		const { menuGroup, searchItem, selfConfig, brandSetting, searchKeyWord, currentOrder: { orderType } } = this.props;
		if (searchKeyWord && !searchItem?.length) return [];
		const isOpenBrandSetting = selfConfig?.configMap?.id_26;
		const allMenu = isOpenBrandSetting ? brandSetting.brandMenu : menuGroup;
		const standardCateDish = getStandardCateDish({
			isOpenBrandSetting,
			brandMenu: brandSetting?.brandMenu || [],
			menuGroup,
			orderType
		});
		const uniqueGroupIds = [...new Set(standardCateDish?.map((cate) => cate.groupId) || [])];
		const cateIds = standardCateDish.map((cate) => cate.id);
		const standardMenu = allMenu.filter((group) => uniqueGroupIds.includes(group.id))?.map((each) => {
			const newMenuCategory = each.menuCategories.filter((cate) => cateIds.includes(cate.id));
			return {
				...each,
				menuCategories: newMenuCategory.map((c) => {
					const { id } = c;
					const actualSaleItems = standardCateDish.find((sc) => sc.id === id)?.saleItems;
					return {
						...c,
						saleItems: actualSaleItems
					};
				})
			};
		});
		if (!searchItem?.length) return standardMenu;
		const searchIds = searchItem.filter((i) => {
			return !i.hiddenItem || i.hiddenItem && i.isFreeItem;
		})?.map((item) => item.id);
		return standardMenu.map((group) => {
			const newMenuCategory = group.menuCategories.map((category) => {
				const newSaleItems = category.saleItems?.filter((item) => searchIds.includes(item.id));
				return {
					...category,
					saleItems: newSaleItems
				};
			}).filter((c) => c.saleItems?.length > 0);
			return {
				...group,
				menuCategories: newMenuCategory
			};
		})?.filter((group) => group?.menuCategories?.length);
	};
	render() {
		const { areGroupsOpen, areGroupsHidden, areCateHidden, allMenu } = this.state;
		const { i18n: { language }, currentCategory, selfConfig, currentOrder: { orderType, itemList }, headerHeight, isTopMenu } = this.props;
		const isShowGroup = selfConfig?.configMap?.id_17;
		const categories = allMenu.map((group) => {
			let isHasCateyList = this.judgeHasCateyList(group?.menuCategories);
			if (group?.menuCategories?.length && areGroupsHidden[group.id] != true && isHasCateyList) {
				const choseNum = this.countCurrentItemOrderedNum(group.menuCategories);
				return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					datagroupid: group.id,
					className: categoryList_module_default.groupBox,
					children: [isShowGroup ? /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
						id: "menuGroup_" + group.id,
						className: [categoryList_module_default.menuGroup, areGroupsOpen[group.id] ? `${categoryList_module_default.menuGroupActived} animate-btn` : ""].join(" "),
						onClick: () => this.toggleMenuGroupWith({ id: group.id }),
						children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: categoryList_module_default.title,
							children: lineBreakTransfer(getCurrentItemLanguage(group.fieldDisplayNameGroups, language) || group.name)
						}), choseNum ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
							className: categoryList_module_default.word,
							children: choseNum
						}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Icons, {
							type: "more",
							size: 4,
							style: { transform: areGroupsOpen[group.id] ? "rotate(90deg)" : "rotate(0)" }
						})]
					}) : null, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: "category_" + group.id,
						className: isShowGroup ? categoryList_module_default.categoryListContainer : categoryList_module_default.categoryNoGroup,
						style: { display: isShowGroup ? areGroupsOpen[group.id] ? "block" : "none" : "block" },
						children: group?.menuCategories?.length ? group.menuCategories.map((category) => {
							const isPromotionDealList = category?.id === "promotion-deals-list";
							const bool = category?.saleItems?.length && (category.saleItems.find((s) => {
								return s.hiddenItem == false || s.hiddenItem == true && s.isFreeItem;
							}) || isPromotionDealList);
							const isHasSaleItem = calcOrderTypeCount(category?.saleItems || [], orderType) > 0;
							if (bool && isHasSaleItem && areCateHidden[category.id] != true) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								datacategoryid: category.id,
								className: [categoryList_module_default.categoryBtn, currentCategory.id == category.id ? isShowGroup ? categoryList_module_default.selectedCtg : categoryList_module_default.selectedNoGroupCtg : ""].join(" "),
								onClick: () => {
									this.handleChooseChildCate(category);
								},
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
									className: categoryList_module_default.categoryName,
									children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: categoryList_module_default.categoryNameLabel,
										children: lineBreakTransfer(getCurrentItemLanguage(category.fieldDisplayNameGroups, language) || category.name)
									}), this.getCategoryOrderItemQuantity(category.id) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
										className: categoryList_module_default.ctgItemQty,
										children: this.getCategoryOrderItemQuantity(category.id)
									}) : null]
								})
							}, category.id);
						}) : null
					})]
				}, group.id);
			}
		});
		let leftMenuSpace = headerHeight;
		const isOrderedItem = itemList.length > 0;
		if (!isTopMenu && isOrderedItem) leftMenuSpace += 10;
		return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(import_jsx_runtime.Fragment, { children: isTopMenu ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
			className: categoryList_module_default.topMenu,
			id: "topCategoryList",
			ref: (el) => this.scrollDom = el,
			children: allMenu.map((group) => {
				let isHasCateyList = this.judgeHasCateyList(group?.menuCategories);
				if (group?.menuCategories?.length && areGroupsHidden[group.id] != true && isHasCateyList) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
					datagroupid: group.id,
					className: categoryList_module_default.outWrapper,
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
						id: "category_" + group.id,
						className: categoryList_module_default.groupWrapper,
						children: group?.menuCategories?.length ? group.menuCategories.map((category) => {
							const isPromotionDealList = category?.id === "promotion-deals-list";
							const bool = category?.saleItems?.length && (category.saleItems.find((s) => {
								return s.hiddenItem == false || s.hiddenItem == true && s.isFreeItem;
							}) || isPromotionDealList);
							const isHasSaleItem = calcOrderTypeCount(category?.saleItems || [], orderType) > 0;
							if (bool && isHasSaleItem && areCateHidden[category.id] != true) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
								datacategoryid: category.id,
								onClick: () => {
									this.handleChooseChildCate(category);
								},
								className: (0, import_classnames.default)(categoryList_module_default.categoryWrapper, currentCategory.id == category.id && `${categoryList_module_default.select} animate-btn`),
								children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", { children: lineBreakTransfer(getCurrentItemLanguage(category.fieldDisplayNameGroups, language) || category.name) }), this.getCategoryOrderItemQuantity(category.id) > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
									className: categoryList_module_default.showQty,
									children: this.getCategoryOrderItemQuantity(category.id)
								}) : null] })
							}, category.id);
						}) : null
					})
				}, group.id);
			})
		}) : /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			id: "categoryListId",
			style: { height: `calc(100vh - ${leftMenuSpace}rem)` },
			className: categoryList_module_default.categoryList,
			ref: (el) => this.scrollDom = el,
			children: [categories, /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", { className: categoryList_module_default.empty })]
		}) });
	}
};
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
		crm: state.crm
	};
}
var categoryList_default = withRouter(connect(mapStateToProps, {
	getCurrentCategory,
	searchItemHandler,
	setCateyPageDomTop,
	setAllMenu
})(withTranslation()(CategoryList)));
//#endregion
export { categoryList_default as default };
