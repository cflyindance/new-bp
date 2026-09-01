import React, {
  useMemo,
  useState,
  useRef,
  useCallback,
  useEffect,
  useLayoutEffect,
} from 'react';
import { useTranslation, withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import {
  addCombo2Order,
  editOrderItemAction,
  fetchCloudGiftCardItem,
  getCurrentCategory,
  getCurrentItem,
  spliceOrderBySoldout,
} from '@/actions';
import styles from './bannerPro.module.scss';
import Toast from '@/component/toast';
import ImgCard from '@/component/imgCard';
import Fab from '@material-ui/core/Fab';
import AddIcon from '@material-ui/icons/Add';
import RemoveIcon from '@material-ui/icons/Remove';
import DeleteIcon from '@material-ui/icons/Delete';
import DetailModal from './components/detail';
import ComboModal from './components/combo/comboModal';
import BuyGiftCard from './components/buyGiftCard';
import SoldoutModal from '@/component/soldoutModal';
import Dialog from '@/component/dialog';
import Loading from '@/component/loading';
import { getCookie, getCssValue } from '@/utils';
import {
  getDishItemLanguage,
  judgeHasDetailInfo,
  getItemSizeName,
  judegOrderDishIsHasSoldout,
} from '@/utils/busTools';
import { getItemPrice } from '@/utils/priceCalculator';
import { getItemStoppedStatus } from '@/utils/itemIsSoldOut';
import { transformTreeDishId } from '@/utils/transformTreeMenu';
import { cloneDeep } from 'lodash';

const defaultMax = 99;

const EMPTY_POSTER_CHILDREN = [];

/** 与海报子项 img src 逻辑一致，供展示与预加载共用 */
const getBannerProImageSrc = (item) => {
  const basePath = process.env.NODE_ENV === 'development' ? '' : 'kiosklite';
  return (
    getCookie('kioskServerIP') +
    (item.props?.imgUrl || `${basePath}${item.props?.defaultImg}`)
  );
};

const BannerPro = (props) => {
  const {
    img,
    menuGroup,
    currentOrder,
    selfConfig,
    onClose,
    addCombo2Order,
    editOrderItemAction,
    fetchCloudGiftCardItem,
    getCurrentCategory,
    getCurrentItem,
    spliceOrderBySoldout,
    brandSetting,
    itemSizeList,
    menuItemList,
  } = props;
  const {
    t,
    i18n: { language },
  } = useTranslation();
  const { itemList } = currentOrder;
  const { posterData, viewportHeight, viewportWidth, aspectRatio } =
    img.bannerPro;
  const posterChildren = posterData?.[0]?.children ?? EMPTY_POSTER_CHILDREN;

  const posterImageUrls = useMemo(
    () => posterChildren.map((item) => getBannerProImageSrc(item)),
    [posterChildren]
  );

  const [posterPreloadLoading, setPosterPreloadLoading] = useState(false);

  useLayoutEffect(() => {
    if (posterImageUrls.length > 0) {
      setPosterPreloadLoading(true);
    } else {
      setPosterPreloadLoading(false);
    }
  }, [posterImageUrls]);

  useEffect(() => {
    if (!posterImageUrls.length) {
      return;
    }
    let cancelled = false;
    const loadOne = (src) =>
      new Promise((resolve) => {
        const image = new Image();
        image.onload = () => resolve();
        image.onerror = () => resolve();
        image.src = src;
      });

    Promise.all(posterImageUrls.map(loadOne)).then(() => {
      if (!cancelled) {
        setPosterPreloadLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [posterImageUrls]);

  const [cartShow, setCartShow] = useState(false);
  const [orderPanelShow, setOrderPanelShow] = useState(false);
  const [comboModalVisible, setComboModalVisible] = useState(false);
  const [tempItem, setTempItem] = useState({});
  const [isHasSoldoutDish, setIsHasSoldoutDish] = useState(false);
  const [dishMap, setDishMap] = useState({});

  const isOpenBrandSetting = selfConfig?.configMap?.id_26;
  const detailModal = useRef(null);

  useEffect(() => {
    fetchCloudGiftCardItem();
  }, [fetchCloudGiftCardItem]);

  useEffect(() => {
    const soldoutDishMap = judegOrderDishIsHasSoldout(
      cloneDeep(itemList || [])
    );
    if (soldoutDishMap?.slodoutList?.length) {
      setDishMap(soldoutDishMap);
      setIsHasSoldoutDish(true);
    }
  }, [itemList, selfConfig?.soldOut, menuItemList]);

  const continueReorder = () => {
    if (dishMap?.allSoldIds?.length) {
      spliceOrderBySoldout(dishMap.allSoldIds);
    }
    setIsHasSoldoutDish(false);
  };

  const openDetailModal = (ref) => {
    detailModal.current = ref;
  };

  const itemResources = useMemo(() => {
    const allMenu = isOpenBrandSetting ? brandSetting.brandMenu : menuGroup;
    return allMenu.flatMap((group) =>
      group.menuCategories.flatMap((category) => category.saleItems)
    );
  }, [isOpenBrandSetting, brandSetting.brandMenu, menuGroup]);

  const resolveBoundItemId = (itemId) => transformTreeDishId(itemId, true);

  const getCurrentItemQty = (itemId) => {
    const resolvedItemId = resolveBoundItemId(itemId);
    let itemQty = 0;
    for (let item of itemList) {
      if (item.id == resolvedItemId) {
        itemQty += item.quantity;
      }
    }
    return itemQty;
  };

  const cartQuantity = useMemo(
    () => itemList.reduce((sum, item) => sum + item.quantity, 0),
    [itemList]
  );

  const handleAdd = (itemInfo) => {
    if (!itemInfo) {
      Toast.info(t('banner-pro-not-bind-dish'), 1000);
      return;
    }
    const stoppedStatus = getItemStoppedStatus(itemInfo);
    if (stoppedStatus) {
      Toast.info(
        t(
          stoppedStatus === 'unavailable'
            ? 'dish-item-unavailable'
            : 'dish-sold-out',
          {
            item: itemInfo.name,
          }
        )
      );
      return;
    }

    setTempItem({
      ...itemInfo,
      remark: {
        optionName: '',
        optionType: 'NOTE',
        quantity: 1,
        price: 0,
      },
    });

    if (itemInfo.itemType === 'SALE_ITEM') {
      if (judgeHasDetailInfo(itemInfo)) {
        setOrderPanelShow(true);
      } else {
        const n = getCurrentItemQty(itemInfo.id);
        if (n >= defaultMax) {
          Toast.info(t('max-up', { rplc: defaultMax }), 1000);
          return;
        }

        const cloneItem = { ...itemInfo, quantity: 1 };
        if (cloneItem.itemPrices?.length === 1) {
          cloneItem.sectionDetail = [
            {
              id: -1,
              sizeInfo: Object.assign({}, cloneItem.itemPrices[0]),
            },
          ];
          cloneItem.price = 0;
        } else {
          cloneItem.sectionDetail = [];
        }
        addCombo2Order(cloneItem);
      }
    } else if (itemInfo?.comboType === 'FIXED_SELECTION') {
      setOrderPanelShow(true);
    } else {
      getCurrentCategory(itemInfo.categoryId);
      getCurrentItem(itemInfo.id);
      setComboModalVisible(true);
    }
  };

  const handleComponentClick = (item) => {
    switch (item.component) {
      case 'AddToCart': {
        const itemInfo = itemResources.find(
          (e) => e?.id == resolveBoundItemId(item?.props?.itemId)
        );
        handleAdd(itemInfo);
        break;
      }
      case 'ShoppingCart':
        setCartShow((prev) => !prev);
        break;
      case 'ContinueOrder':
        onClose();
        break;
      default:
        break;
    }
  };

  const renderImg = (item) => getBannerProImageSrc(item);

  const calcStyle = (item) => {
    if (item.component === 'Page') {
      return { ...item.style, aspectRatio };
    }

    const { width, height, left, top } = item.style;
    const x = (getCssValue(left) / viewportWidth).toFixed(2) * 100 + 'vw';
    const y = (getCssValue(top) / viewportHeight).toFixed(2) * 100 + 'vh';
    const w = (getCssValue(width) / viewportWidth.toFixed(2)) * 100 + 'vw';
    const h = (getCssValue(height) / viewportHeight).toFixed(2) * 100 + 'vh';
    return { ...item.style, left: x, top: y, width: w, height: h };
  };

  const CountableImage = useCallback(
    ({ item, quantity }) => {
      const { width } = item.style;
      const size = (getCssValue(width) / viewportWidth) * 40;

      return (
        <div style={calcStyle(item)} onClick={() => handleComponentClick(item)}>
          <div className={styles.countComp}>
            <img
              src={renderImg(item)}
              alt={item.component}
              className={styles.countImg}
            />
            {quantity > 0 && (
              <div
                className={styles.countNum}
                style={{
                  width: `${size}vw`,
                  height: `${size}vw`,
                  lineHeight: `${size}vw`,
                }}
              >
                {quantity}
              </div>
            )}
          </div>
        </div>
      );
    },
    [viewportWidth]
  );

  const cartItem = (item) => {
    let name = getDishItemLanguage(item.fieldDisplayNameGroups, language);
    const price = (getItemPrice(item) || 0).toFixed(2);
    const size = item?.sectionDetail.find((section) => section?.id === -1);
    let sizeName = '';

    if (item?.itemPrices?.length > 1) {
      sizeName = getItemSizeName(
        size?.sizeInfo?.sizeId,
        size?.sizeInfo?.size,
        itemSizeList,
        language
      );
      name += `(${sizeName})`;
    }

    return (
      <div className={styles.orderItem} key={`${item.sequence}-${item.id}`}>
        <div className={styles.orderItemInfo}>
          <div className={styles.orderItemImage}>
            <ImgCard itemInfo={item} selfConfig={selfConfig} />
          </div>
          <div className={styles.textInfo}>
            <div className={styles.name}>{name || item.name}</div>
            <div className={styles.price}>${price}</div>
          </div>
        </div>
        <QuantityControl item={item} />
      </div>
    );
  };

  const QuantityControl = ({ item }) => (
    <div className={styles.calcBox}>
      <Fab
        aria-label="Remove"
        className={item.quantity > 1 ? styles.btnEn : styles.btnDel}
        onClick={() => {
          editOrderItemAction({
            deleteSequence: item.sequence,
            isSub: true,
          });
        }}
      >
        {item.quantity > 1 ? (
          <RemoveIcon className={styles.muiDiyIcon} />
        ) : (
          <DeleteIcon className={styles.muiDiyIcon} />
        )}
      </Fab>
      <div className={styles.qty}>{item.quantity}</div>
      <Fab
        disabled={item.quantity >= defaultMax}
        aria-label="Add"
        className={
          item.quantity < defaultMax
            ? `${styles.btnEn} animate-btn`
            : styles.btnDis
        }
        onClick={() => {
          const stoppedStatus = getItemStoppedStatus(item, { fromOrder: true });
          if (stoppedStatus) {
            Toast.info(
              t(
                stoppedStatus === 'unavailable'
                  ? 'dish-item-unavailable'
                  : 'dish-sold-out',
                {
                  item: item.name,
                }
              )
            );
            return;
          }
          editOrderItemAction({
            deleteSequence: item.sequence,
            isSub: false,
          });
        }}
      >
        <AddIcon className={styles.muiDiyIcon} />
      </Fab>
    </div>
  );

  const cartContent = () => (
    <div className={styles.cartWrapper} onClick={(e) => e.stopPropagation()}>
      {itemList.length === 0 ? (
        <div className={styles.noData}>{t('no-data')}</div>
      ) : (
        <div className={styles.cartItemList}>
          {itemList.map((item) => cartItem(item))}
        </div>
      )}
      <div
        className={`${styles.continue}  linear-animate-btn`}
        onClick={onClose}
      >
        {t('see-full-menu')}
      </div>
    </div>
  );

  return (
    <div className={styles.bannerProBox}>
      <Loading visible={posterPreloadLoading} />
      {posterChildren.map((item) => {
        switch (item.component) {
          case 'AddToCart':
            return (
              <CountableImage
                key={item.id}
                item={item}
                quantity={getCurrentItemQty(item.props.itemId) || 0}
              />
            );
          case 'ShoppingCart':
            return (
              cartQuantity > 0 && (
                <CountableImage
                  key={item.id}
                  item={item}
                  quantity={cartQuantity}
                />
              )
            );
          case 'BuyGiftCard':
            return (
              <BuyGiftCard
                key={item.id}
                item={item}
                style={calcStyle(item)}
                src={renderImg(item)}
                onPosterClose={onClose}
              />
            );
          default:
            return (
              <img
                key={item.id}
                src={renderImg(item)}
                alt={item.component}
                style={calcStyle(item)}
                className={
                  item.component === 'ContinueOrder' ? styles.countComp : ''
                }
                onClick={() => handleComponentClick(item)}
              />
            );
        }
      })}

      <Dialog
        visible={cartShow}
        html={cartContent()}
        onClose={() => setCartShow(false)}
      />

      {orderPanelShow && (
        <DetailModal
          orderPanelShow={orderPanelShow}
          itemInfo={tempItem}
          isBannerPro={true}
          onRef={openDetailModal}
          onCloseModal={() => setOrderPanelShow(false)}
        />
      )}

      <Dialog
        visible={comboModalVisible}
        html={<ComboModal onCloseModal={() => setComboModalVisible(false)} />}
        onClose={() => {
          setComboModalVisible(false);
        }}
      />

      {isHasSoldoutDish ? (
        <SoldoutModal
          isHasSoldoutDish={isHasSoldoutDish}
          dishMap={dishMap}
          inOrderPage={true}
          continueReorder={continueReorder}
        />
      ) : null}
    </div>
  );
};

function mapStateToProps(state) {
  return {
    selfConfig: state.selfConfig,
    currentOrder: state.currentOrder,
    img: state.img,
    menuGroup: state.menuGroup,
    brandSetting: state.brandSetting,
    itemSizeList: state.itemSizeList,
    menuItemList: state.menuItemList,
  };
}

export default connect(mapStateToProps, {
  addCombo2Order,
  editOrderItemAction,
  fetchCloudGiftCardItem,
  getCurrentCategory,
  getCurrentItem,
  spliceOrderBySoldout,
})(withTranslation()(BannerPro));
