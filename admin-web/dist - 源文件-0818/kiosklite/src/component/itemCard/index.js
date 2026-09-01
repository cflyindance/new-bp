import React, { memo } from 'react';
import DishTag from '@/component/DishTag';
import styles from './itemCard.module.scss';
import ImgCard from '@/component/imgCard';
import {
  getDishItemLanguage,
  judgeHasDetailInfo,
  getItemSizeName,
  getComboSectionInfo,
} from '@/utils/busTools';
import { itemIsUnavailable } from '@/utils/itemIsSoldOut';
import Counter from '@/component/Counter';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import ButtonBase from '@material-ui/core/ButtonBase';
import PromotionTagsWrap from '@/component/PromotionTagsWrap';
import POINT from '@/assets/images/star.png';
import Icon from '../icon';
import getItemDisplayPrice from '@/utils/getItemDisplayPrice';
import { isItemCardClickBlockedAfterScroll } from '@/utils/itemCardScrollGuard';
import { getRemainingStockNum } from '@/utils/validateItemStock';

const MemoDishTag = memo(DishTag);

class ItemCard extends React.Component {
  itemNameRef = React.createRef();

  /** 斜对角距离，计算的是平方数，比如想限制为2px，则此处写4，滑动与轻触区分 */
  TAP_MOVE_THRESHOLD_SQ = 100;

  componentWillUnmount() {
    this.teardownPointerTracking();
  }

  teardownPointerTracking = () => {
    if (this._pointerGestureEnd) {
      window.removeEventListener('pointermove', this._pointerGestureMove, true);
      window.removeEventListener('pointerup', this._pointerGestureEnd, true);
      window.removeEventListener(
        'pointercancel',
        this._pointerGestureEnd,
        true
      );
      this._pointerGestureMove = null;
      this._pointerGestureEnd = null;
    }
  };

  handlePointerDown = (e) => {
    if (!this.props.onClick) return;
    if (e.button != null && e.button !== 0) return;
    this.teardownPointerTracking();

    const startX = e.clientX;
    const startY = e.clientY;
    let tapMoved = false;
    const thresholdSq = this.TAP_MOVE_THRESHOLD_SQ;

    this._pointerGestureMove = (ev) => {
      const dx = ev.clientX - startX;
      const dy = ev.clientY - startY;
      if (dx * dx + dy * dy > thresholdSq) {
        tapMoved = true;
      }
    };
    this._pointerGestureEnd = () => {
      this.teardownPointerTracking();
      this._tapMoved = tapMoved;
    };

    window.addEventListener('pointermove', this._pointerGestureMove, true);
    window.addEventListener('pointerup', this._pointerGestureEnd, true);
    window.addEventListener('pointercancel', this._pointerGestureEnd, true);
  };

  tryFireItemClick = (isStoppedMark) => {
    if (isStoppedMark || !this.props.onClick) return;

    if (this._tapMoved) {
      this._tapMoved = false;
      return;
    }
    if (isItemCardClickBlockedAfterScroll()) return;
    this.props.onClick();
  };

  /*
   * price：现在售价
   * strikethroughPrice：划线价
   * 计算出划线价和售价的折扣  （划线价-现售价）/划线价
   */
  renderDiscount = (price, strikethroughPrice) => {
    if (
      strikethroughPrice === undefined ||
      strikethroughPrice === null ||
      price === undefined ||
      price === null
    )
      return null;
    return (
      <>
        <div className={styles.discount}>
          {'-' +
            ((strikethroughPrice - price) / strikethroughPrice).toFixed(2) *
              100 +
            '%'}
        </div>
      </>
    );
  };

  renderPrice = (price, isShowIcon) => {
    if (price === undefined || price === null) return;
    const { isComboType, selfConfig } = this.props;

    const zeroShow = selfConfig?.configMap?.id_51;
    if (!isComboType) {
      // 菜单页item - 根据kiosk配置确定是否展示0价菜
      if (!(zeroShow || price > 0)) return;
      return (
        <>
          <span>$</span>
          <span>{price.toFixed(2)}</span>
        </>
      );
    }
    return isShowIcon || price > 0 ? (
      <>
        <span>$</span>
        <span>{price.toFixed(2)}</span>
      </>
    ) : null;
  };

  // promotion标签统一整理
  renderPromotionTags = () => {
    const { isComboType, itemInfo, promotion } = this.props;
    return (
      <PromotionTagsWrap
        itemInfo={itemInfo}
        promotion={promotion}
        isComboType={isComboType}
      />
    );
  };

  renderPoint = (point, isComboType) => {
    const { isInFreeItem, t } = this.props;
    if (isComboType) {
      return (
        <>
          <span>$</span>
          <span>0.00</span>
        </>
      );
    } else if (isInFreeItem && point > 0) {
      return (
        <>
          <img src={POINT} alt="point" />
          <span>{`${point} ${t('pts')}`}</span>
        </>
      );
    }

    return null;
  };

  render() {
    const {
      t,
      i18n: { language },
      isComboType,
      isThumbPath,
      currentOrder,
      itemInfo,
      currentCategoryList,
      selfConfig,
      isSimpleMode,
      isInFreeItem,
      isPromotionItem,
      menuItemList,
      sideNavList,
      sideNavId,
      currentOrderCombo,
      isSoldoutMark,
      isUnavailableMark: propsUnavailableMark,
    } = this.props;

    // 获取价格规则
    const sectionInfo = getComboSectionInfo(sideNavList, sideNavId);
    const priceRule = sectionInfo?.priceRule;
    const orderItem = currentOrderCombo?.find(
      (item) => item.id === sideNavId
    )?.items;
    const orderItemQty = orderItem?.length ?? 0;
    const currentOrderItemQty =
      orderItem?.filter((item) => item.id === itemInfo.id)?.length ?? 0;
    let addLimit;
    if (sectionInfo) {
      if (sectionInfo.mergeDisplay && itemInfo.itemPrices?.length) {
        addLimit = itemInfo.itemPrices.reduce((acc, item) => {
          let _addLimit = item.originalComboSectionSaleItem?.addLimit;
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
        addLimit = sectionInfo.comboSectionSaleItems?.find(
          (item) => item.saleItemId === itemInfo.id
        )?.addLimit;
      }
    }

    // 最大选择数量
    const counterMax = isComboType
      ? Math.min(
          addLimit ?? sectionInfo?.maxNumOfSelectionAllowed,
          sectionInfo?.maxNumOfSelectionAllowed -
            (orderItemQty - currentOrderItemQty)
        )
      : undefined;

    // 选择规则为最大最多选x份
    const isMaxNumLimit =
      sectionInfo?.itemSelectionRule === 'MAX_NUM_LIMIT' || addLimit > 0;
    // 是否为单选模式 (最多选择一个，且计价方式不为FIXED_UNTIL_MAX)
    const isSingleMaxChosen =
      sectionInfo?.maxNumOfSelectionAllowed === 1 &&
      priceRule !== 'FIXED_UNTIL_MAX';
    // 是否有详情
    const isHasDetail = judgeHasDetailInfo(itemInfo, isComboType);
    // 菜的序号
    const itemNumber = itemInfo.itemNumber;
    // 菜的名称
    let itemName =
      getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
      itemInfo.name;
    // 对接商品中心 多规格菜品需要加上规格名称（多规格子菜会被拆成多个
    let sizeName = '';
    if (isComboType && itemInfo?.itemPrices?.length === 1) {
      sizeName = getItemSizeName(
        itemInfo.itemPrices[0]?.sizeId,
        itemInfo.itemPrices[0]?.size,
        this.props?.itemSizeList,
        language
      );
      itemName += `(${sizeName})`;
    }

    // 库存数量（显示剩余可售数量）
    const stockNum = getRemainingStockNum({
      itemInfo,
      itemList: currentOrder?.itemList,
      menuItemList,
    });

    const { price, isShowIcon } = getItemDisplayPrice({
      itemInfo,
      isComboType,
      currentOrder,
      currentCategoryList,
      sideNavList,
      sideNavId,
      currentOrderCombo,
    });
    //判断是不是有自定义标签 处理自定义标签和属性标签
    const isPropertyVisible = selfConfig?.configList?.find(
      (i) => i.id === 54
    )?.value;
    const propertyArr = isPropertyVisible
      ? selfConfig?.configList?.find((i) => i.id === 38)?.value
      : [];
    let property = [];
    propertyArr.map((item) => {
      if (
        item.dish.includes(itemInfo.id) ||
        item.dish.includes(itemInfo?.oId)
      ) {
        property.push({
          name: item.labelName,
          displayName: item.labelName,
          labelType: item.labelType,
          labelImg: item.labelImg,
          labelBgColor: item.labelBgColor || '#fffbf2',
          labelTextColor: item.labelTextColor || '#f26e21',
          isKioskTag: true,
        });
      }
    });
    if (Array.isArray(itemInfo.properties)) {
      property = [...itemInfo.properties, ...property];
    }

    const simpleNoProperty = isSimpleMode && !property.length;
    // 单选模式下 1.不是最多选择xx份,2.是最多选择xx份但是没有详情,才是选中卡片模式的样式
    // isSingleMaxChosen &&
    // (!isMaxNumLimit || (isMaxNumLimit && !isHasDetail)) && （新ui全改选中为卡片样式）

    let isWrapped = false;
    if (this.itemNameRef.current) {
      const el = this.itemNameRef.current;
      // scrollHeight > clientHeight 表示有换行
      isWrapped = el.scrollHeight > el.clientHeight;
    }

    const isUnavailableMark =
      propsUnavailableMark !== undefined
        ? propsUnavailableMark
        : itemIsUnavailable(itemInfo);
    const isStoppedMark = isUnavailableMark || isSoldoutMark;
    const { onClick } = this.props;
    const rippleEnabled = Boolean(onClick) && !isStoppedMark;

    return (
      <div
        className={classNames(
          styles.itemCard,
          isSimpleMode && styles.simpleItemCard,
          isComboType && styles.comboCard,
          isComboType && this.props.itemQty > 0 && styles.singleMaxChosen,
          simpleNoProperty && styles.bannerProCard
        )}
      >
        <ButtonBase
          component="div"
          tabIndex={-1}
          focusRipple={false}
          disableRipple={!rippleEnabled}
          className={classNames(
            styles.itemCardRippleHost,
            rippleEnabled && styles.itemCardRippleHostInteractive
          )}
          onPointerDown={this.handlePointerDown}
          onClick={() => this.tryFireItemClick(isStoppedMark)}
        >
          {isStoppedMark && (
            <span className={styles.soldOut}>
              {isUnavailableMark ? t('item-unavailable') : t('sold-out')}
            </span>
          )}

          {/*{isPreSelected && <div className={styles.preSel}>{t('required')}</div>}*/}

          <div className={styles.itemCardInner}>
            {/* 图片 */}
            {isThumbPath ? (
              <div className={styles.itemImage}>
                <ImgCard selfConfig={selfConfig} itemInfo={itemInfo} />
                {stockNum !== undefined && (
                  <div className={styles.stockNum}>
                    {t('item-stock-num', { stockNum })}
                  </div>
                )}
              </div>
            ) : null}
            {simpleNoProperty && isSingleMaxChosen && (
              <div
                className={`${styles.bannerProName} ${this.props.itemQty ? styles.bannerProNameChecked : ''} ${isWrapped ? styles.wrappedItem : ''} `}
              >
                {this.props.itemQty > 0 && (
                  <Icon type="check" size={5.5} className={styles.checkIcon} />
                )}
                <div className={styles.bannerProItem}>
                  <span className={styles.itemName} ref={this.itemNameRef}>
                    {itemName}
                  </span>
                  {(price > 0 || stockNum !== undefined) && (
                    <div className={styles.bannerProPrice}>
                      {price > 0 && (
                        <div className={styles.priceText}>
                          {this.renderDiscount(
                            itemInfo.price,
                            itemInfo.strikethroughPrice
                          )}
                          {this.renderPrice(price, isShowIcon)}
                          {isShowIcon && <i className={styles.min}>+</i>}
                        </div>
                      )}
                      {stockNum !== undefined && (
                        <div className={styles.stockNum}>
                          {t('item-stock-num', { stockNum })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}
            {simpleNoProperty && !isSingleMaxChosen && (
              <div
                className={`${styles.itemDetails} ${this.props.itemQty ? styles.itemDetailsChecked : ''} ${isWrapped ? styles.wrappedItem : ''} `}
              >
                {this.props.itemQty > 0 && (
                  <Icon type="check" size={5.5} className={styles.checkIcon} />
                )}
                <div className={styles.bannerProDetailsPrice}>
                  <div className={styles.itemName} ref={this.itemNameRef}>
                    {selfConfig?.configMap?.id_16 && itemNumber ? (
                      <span>{itemNumber}.</span>
                    ) : null}
                    <span>{itemName}</span>
                  </div>
                  {(price > 0 || stockNum !== undefined) && (
                    <div className={styles.itemPrice}>
                      {price > 0 && (
                        <div className={styles.priceText}>
                          {this.renderDiscount(
                            itemInfo.price,
                            itemInfo.strikethroughPrice
                          )}
                          {this.renderPrice(price, isShowIcon)}

                          {isShowIcon && <i className={styles.min}>+</i>}
                          {itemInfo?.strikethroughPrice !== undefined && (
                            <div className={styles.strikethroughPrice}>
                              <span>$</span>
                              {itemInfo.strikethroughPrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                      )}
                      {stockNum !== undefined && (
                        <div className={styles.stockNum}>
                          {t('item-stock-num', { stockNum })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
                {this.props.itemQty > 0 &&
                  (!isSingleMaxChosen ||
                    (isSingleMaxChosen && isMaxNumLimit && isHasDetail)) && (
                    <Counter
                      iconSize={5.1}
                      needGreyBg
                      plusVersion
                      quantity={this.props.itemQty}
                      handleReduce={() => this.props.onQtyClicked()}
                      handleAdd={() => this.tryFireItemClick(isStoppedMark)}
                      max={
                        (isInFreeItem && !isComboType) ||
                        (isSingleMaxChosen && isMaxNumLimit)
                          ? 1
                          : !isSingleMaxChosen && isMaxNumLimit
                            ? counterMax
                            : undefined
                      }
                    />
                  )}
              </div>
            )}
            {(!isSimpleMode || property.length > 0) && (
              <>
                <div className={styles.itemName}>
                  {selfConfig?.configMap?.id_16 && itemNumber ? (
                    <span>{itemNumber}.</span>
                  ) : null}
                  <span>{itemName}</span>
                </div>

                {property.length > 0 && (
                  <div className={styles.itemProperty}>
                    <MemoDishTag tagsInfo={property} />
                  </div>
                )}
                {this.renderPromotionTags()}
                <div className={styles.itemPrice}>
                  <div className={styles.leftPrice}>
                    {isInFreeItem || isPromotionItem ? (
                      this.renderPoint(itemInfo.itemPoints, isComboType)
                    ) : (
                      <>
                        {this.renderDiscount(
                          itemInfo.price,
                          itemInfo.strikethroughPrice
                        )}
                        {this.renderPrice(price, isShowIcon)}

                        {isShowIcon && <i className={styles.min}>+</i>}
                        {itemInfo?.strikethroughPrice !== undefined && (
                          <div className={styles.strikethroughPrice}>
                            <span>$</span>
                            {itemInfo.strikethroughPrice.toFixed(2)}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                  {this.props.itemQty > 0 &&
                    (!isSingleMaxChosen ||
                      (isSingleMaxChosen && isMaxNumLimit && isHasDetail)) && (
                      <Counter
                        iconSize={5.1}
                        needGreyBg
                        plusVersion
                        quantity={this.props.itemQty}
                        handleReduce={() => this.props.onQtyClicked()}
                        handleAdd={() => this.tryFireItemClick(isStoppedMark)}
                        max={
                          (isInFreeItem && !isComboType) ||
                          (isSingleMaxChosen && isMaxNumLimit)
                            ? 1
                            : !isSingleMaxChosen && isMaxNumLimit
                              ? counterMax
                              : undefined
                        }
                      />
                    )}
                </div>
              </>
            )}
          </div>
        </ButtonBase>
      </div>
    );
  }
}

export default withTranslation()(ItemCard);
