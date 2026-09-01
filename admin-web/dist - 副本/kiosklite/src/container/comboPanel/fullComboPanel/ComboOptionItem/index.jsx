//   可以选择二级的可选项（菜）列表页面
import React, { useRef, useState, useEffect, useMemo } from 'react';
import styles from './ComboOptionItem.module.scss';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import { getDishItemLanguage } from '@/utils/busTools';
import { addOption, removeOneOption } from '@/actions';
import Toast from '@/component/toast';
import Icon from '@/component/icon';
import Counter from '@/component/Counter';

const ComboOptionItem = (props) => {
  const [checkedMap, setCheckedMap] = useState({});
  const [checkedIds, setCheckedIds] = useState({});
  const [hasNoSubList, setHasNoSubList] = useState([]);
  const [hasSubList, setHasSubList] = useState([]);
  const [isShowComboSideNav, setIsShowComboSideNav] = useState(false);
  const [maxNum] = useState(99);
  const itemNameRefList = useRef({});

  const {
    t,
    i18n: { language },
    currentItem,
    currentOrderCombo,
    comboOptionList,
    isInFreeItem,
    isPromotionItem,
    selfConfig,
  } = props;

  useEffect(() => {
    return () => {
      itemNameRefList.current = {};
    };
  }, []);

  // kiosk后台配置菜价为0是否展示开关
  const zeroShow = useMemo(() => {
    return selfConfig?.configMap?.id_51;
  }, [selfConfig]);

  const getNoSubList = () => {
    let sub = [];
    let pri = [];
    comboOptionList?.forEach((item) => {
      if (!item?.subOptions?.length) {
        sub.push(item);
      } else {
        pri.push(item);
      }
    });
    setHasNoSubList(sub);
    setHasSubList(pri);
  };

  useEffect(() => {
    getNoSubList();
  }, [comboOptionList]);

  useEffect(() => {
    setIsShowComboSideNav(selfConfig?.configMap?.id_19);
  }, []);

  // 计算options添加的总个数
  const getAddOptionsTotal = () => {
    const getQuantityFromOption = (id) => {
      const option = currentOrderCombo?.find((c) => c.id === id);
      return option?.options?.reduce((total, f) => total + f.quantity, 0) || 0;
    };

    const total = getQuantityFromOption(-2) + getQuantityFromOption(-3);
    return total;
  };

  const handleClick = (obj, mode = 1) => {
    const currentCheckCate = comboOptionList?.find(
      (c) => c.id === (obj.itemOptionId || obj.id)
    );

    if (!currentCheckCate) return;

    const checkCount = checkedMap[currentCheckCate.id];
    const isCurrentIdMatched = checkedIds[currentCheckCate.id] === obj.id;
    const itemOptMax = currentItem.numOfItemOptionAllowed;
    const maxLimit = itemOptMax || maxNum; // 使用 itemOptMax 或 maxNum 作为最大限制

    const handleOptionAdd = (quantity) => {
      const addOpTotal = getAddOptionsTotal() + quantity;
      if (addOpTotal > maxLimit) {
        Toast.info(t('max-up', { rplc: maxLimit }), 1000);
        return false;
      }
      return true;
    };

    const updateCheckedMapAndIds = (quantity, id) => {
      setCheckedMap((prev) => ({
        ...prev,
        [currentCheckCate.id]: quantity,
      }));
      setCheckedIds((prev) => ({
        ...prev,
        [currentCheckCate.id]: id,
      }));
    };

    if (obj.itemOptionId) {
      // 二级option
      const price = 
        obj.id !== currentCheckCate.id
          ? obj.price + currentCheckCate.price
          : obj.price;

      if (checkCount && isCurrentIdMatched) {
        // 取消选中
        updateCheckedMapAndIds(0, null);
        props.removeOneOption({ sideNavId: -2, id: obj.id });
      } else if (!checkCount) {
        // 选中二级option
        if (!handleOptionAdd(1)) return; // 检查是否超过最大限制
        updateCheckedMapAndIds(1, obj.id);

        props.addOption(-2, { ...obj, price, quantity: 1, itemOption: currentCheckCate });
      } else if (!isCurrentIdMatched) {
        props.removeOneOption({
          sideNavId: -2,
          id: checkedIds[currentCheckCate.id],
        });
        props.addOption(-2, { ...obj, price, quantity: 1, itemOption: currentCheckCate });
        updateCheckedMapAndIds(1, obj.id);
      }
    } else {
      // 一级option
      if (mode === 1) {
        // 加
        if (checkCount && isCurrentIdMatched) {
          // 选中时一级option数量+1
          if (!handleOptionAdd(1)) return; // 检查是否超过最大限制
          updateCheckedMapAndIds(checkCount + 1, obj.id);

          const price = 
            obj.id !== currentCheckCate.id
              ? obj.price + currentCheckCate.price
              : obj.price;

          props.addOption(-2, { ...obj, price, quantity: 1 });
        } else {
          // 未选中时
          if (!handleOptionAdd(1)) return; // 检查是否超过最大限制
          updateCheckedMapAndIds(1, obj.id);

          const price = 
            obj.id !== currentCheckCate.id
              ? obj.price + currentCheckCate.price
              : obj.price;

          props.addOption(-2, { ...obj, price, quantity: 1 });
        }
      } else {
        // 减
        if (checkCount && isCurrentIdMatched) {
          // 选中时一级option数量-1
          const newQuantity = checkCount - 1;
          updateCheckedMapAndIds(newQuantity, newQuantity > 0 ? obj.id : null);
          props.removeOneOption({ sideNavId: -2, id: obj.id });
        }
      }
    }
  };

  // 获取当前选择的选项
  const getCurrentItem = () => {
    const opt = currentOrderCombo?.find((c) => c.id === -2);
    if (!opt || !opt.options) return;
    // 使用 reduce 方法统计每个 id 的出现次数
    const countById = opt.options.reduce((acc, item) => {
      if (!acc[item.itemOptionId || item.id]) {
        acc[item.itemOptionId || item.id] = 0;
      }
      acc[item.itemOptionId || item.id] += 1; // 增加计数

      return acc;
    }, {});

    opt.options.forEach((f) => {
      const id = f.itemOptionId || f.id;
      setCheckedMap((prev) => ({ ...prev, [id]: countById[id] }));
      setCheckedIds((prev) => ({ ...prev, [id]: f.id }));
    });
  };

  useEffect(() => {
    getCurrentItem();
  }, [currentOrderCombo]);

  // 渲染单个项的卡片
  const renderItemCard = (item, isActive, isDisabled, onClick) => {
    const handleRemoveClick = () => {
      onClick(item, -1); // 传递 -1 表示减少数量
    };

    const handleAddClick = () => {
      onClick(item);
    };

    // 获取或创建当前 item 的 ref
    if (!itemNameRefList.current[item.id]) {
      itemNameRefList.current[item.id] = React.createRef();
    }

    let isWrapped = false;
    if (itemNameRefList.current[item.id].current) {
      const el = itemNameRefList.current[item.id].current;
      // scrollHeight > clientHeight 表示有换行
      isWrapped = el.scrollHeight > el.clientHeight;
    }

    return (
      <div
        key={item.id}
        className={`${styles.itemCard} ${isActive ? styles.actived : ''} ${isDisabled ? styles.disabled : ''} ${!item.itemOptionId ? styles.multiItem : ''} ${isWrapped ? styles.wrappedItem : ''}`}
        onClick={() => onClick(item)}
        style={
          !item.itemOptionId && isShowComboSideNav
            ? { width: `100%`, margin: `0 0 2rem 0` }
            : {}
        }
      >
        {isActive && (
          <Icon type="check" size={5.5} className={styles.checkIcon} />
        )}

        <div className={`${styles.itemPrice}`}>
          <div
            className={styles.itemName}
            ref={itemNameRefList.current[item.id]}
          >
            {getDishItemLanguage(item.fieldDisplayNameGroups, language) ||
              item.name}
          </div>
          {(zeroShow || item.price > 0) && (
            <span className={styles.priceText}>
              $
              {isInFreeItem || isPromotionItem ? '0.00' : item.price.toFixed(2)}
            </span>
          )}
        </div>

        {
          //选中并且是一级option时才显示数量
          isActive && !item.itemOptionId && checkedMap[item.id] > 0 && (
            <Counter
              iconSize={5.1}
              plusVersion={true}
              quantity={checkedMap[item.id]}
              handleReduce={handleRemoveClick}
              handleAdd={handleAddClick}
            />
          )
        }
      </div>
    );
  };

  const handleItemClick = (item, mode) => {
    handleClick(item, mode);
  };

  // 渲染没有子选项的列表
  const renderNoSubOptions = () => (
    <div>
      <div className={styles.title}>{t('item_option')}</div>
      <div className={styles.itemCardList}>
        {hasNoSubList?.map((item) =>
          renderItemCard(
            item,
            checkedIds[item.id] === item.id,
            checkedMap[item.id] && checkedIds[item.id] !== item.id,
            handleItemClick
          )
        )}
      </div>
    </div>
  );

  // 渲染子选项
  const renderSubOptions = (itemInfo) => {
    const itemName =
      getDishItemLanguage(itemInfo.fieldDisplayNameGroups, language) ||
      itemInfo.name;

    return (
      <div key={itemInfo.id}>
        <div className={styles.title}>
          {itemName}
          {(zeroShow || itemInfo.price > 0) && (
            <span className={styles.titlePrice}>
              ($
              {isInFreeItem || isPromotionItem
                ? '0.00'
                : itemInfo.price.toFixed(2)}
              )
            </span>
          )}
        </div>
        <div className={styles.itemCardList}>
          {itemInfo?.subOptions?.map((item) =>
            renderItemCard(
              item,
              checkedIds[itemInfo.id] === item.id,
              checkedMap[itemInfo.id] && checkedIds[itemInfo.id] !== item.id,
              handleItemClick
            )
          )}
        </div>
      </div>
    );
  };

  // 合并渲染逻辑
  const renderItemList = () =>
    hasSubList?.map((itemInfo) => renderSubOptions(itemInfo));

  // 主组件的返回部分
  return (
    <>
      {hasSubList.length > 0 && renderItemList()}
      {hasNoSubList.length > 0 && renderNoSubOptions()}
    </>
  );
};

function mapStateToProps(state) {
  return {
    currentItem: state.currentItem,
    currentOrderCombo: state.currentOrderCombo,
    selfConfig: state.selfConfig,
  };
}

export default connect(mapStateToProps, { addOption, removeOneOption })(
  withTranslation()(ComboOptionItem)
);
