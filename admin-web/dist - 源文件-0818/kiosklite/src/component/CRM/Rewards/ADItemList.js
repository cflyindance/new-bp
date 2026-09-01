import React, {
  useMemo,
  memo,
  useRef,
  useCallback,
  useEffect,
  useState,
} from 'react';
import styles from './FreeItemList.module.scss';
import remToPx from '@/utils/CountRemToPx';
import DishItem from '@/component/CRM/Rewards/DishItem';
import classNames from 'classnames';
import { useTranslation } from 'react-i18next';
import FilterList from './FilterList';
import { VariableSizeList as List } from 'react-window';
import dayjs from 'dayjs';

const MemoDishItem = memo(DishItem);
const PADDING_SIZE = 12; // px
const EXTRA_TOP_MARGIN = 2; // rem
const ITEM_CARD_SIZE = 48; // rem
const CATE_TITLE_SIZE = 5; // rem
const CATE_DESC_SIZE = 7;
const FILTER_HEIGHT = 12;

const ADItemList = (props) => {
  const { ruleWithItem, countRow, handleClickItem, orderSubtotal, crmType } =
    props;
  const listRef = useRef();
  const { t, i18n } = useTranslation();

  const [filterType, setFilterType] = useState('all');

  // 选项卡点击
  const handleFilterChange = useCallback((typeChoosed) => {
    setFilterType(typeChoosed);
    listRef.current?.scrollTo(0);
  }, []);

  // 过滤的数据
  const ruleList = useMemo(() => {
    if (filterType === 'all') return [...ruleWithItem];
    return ruleWithItem.filter(
      (rule) => rule?.rewardRule?.redeemRule?.parameters?.points === filterType
    );
  }, [ruleWithItem, filterType]);

  const loyaltyItem = useMemo(() => {
    return ruleList?.filter((item) => item.adItemType === 'loyalty');
  }, [ruleList]);

  const voucherItem = useMemo(() => {
    return ruleWithItem?.filter((item) => {
      if (!item.hasOwnProperty('extSkuMapping')) return false;

      const minSpend = item.voucherRules?.minSpend;
      if (minSpend !== undefined && minSpend !== null) {
        return orderSubtotal > minSpend;
      }
      // 如果没有 minSpend，则只判断 extSkuMapping 即可
      return true;
    });
  }, [ruleWithItem, orderSubtotal]);

  const allItem = useMemo(() => {
    const count = countRow.count;
    const loyaltySets = loyaltyItem?.length
      ? [
          { listType: 'filterList' },
          { listType: 'cateTitle', title: t('AdPointRedeem') },
        ]
      : [];
    for (let i = 0; i < loyaltyItem.length; i += count) {
      loyaltySets.push(loyaltyItem.slice(i, i + count));
    }
    const voucherSets = voucherItem?.length
      ? [
          {
            listType: 'cateTitle',
            title: t('AdVoucherRedeem'),
            extraTopMargin: true,
          },
        ]
      : [];
    voucherItem.forEach((each) => {
      const item = { listType: 'cateDesc', ...each };
      voucherSets.push(item);
      const { extSkuMapping } = item;
      for (let i = 0; i < extSkuMapping.length; i += count) {
        voucherSets.push(extSkuMapping.slice(i, i + count));
      }
    });
    const bottomBlock = { listType: 'bottom' };

    return [...loyaltySets, ...voucherSets, bottomBlock];
  }, [loyaltyItem, voucherItem, countRow, i18n.language]);

  const getItemSize = useCallback(
    (index) => {
      const row = allItem[index];
      if (Array.isArray(row)) return remToPx(ITEM_CARD_SIZE) + PADDING_SIZE;
      if (row?.listType === 'filterList') return remToPx(FILTER_HEIGHT);
      if (row?.listType === 'cateTitle') {
        return (
          (row?.extraTopMargin
            ? remToPx(CATE_TITLE_SIZE + EXTRA_TOP_MARGIN)
            : remToPx(CATE_TITLE_SIZE)) + PADDING_SIZE
        );
      }
      if (row?.listType === 'cateDesc')
        return remToPx(CATE_DESC_SIZE) + 29 + PADDING_SIZE;
      if (row?.listType === 'bottom') {
        return remToPx(20);
      }
      return 0;
    },
    [allItem]
  );

  useEffect(() => {
    if (listRef.current && allItem?.length > 0) {
      listRef.current.resetAfterIndex(0);
    }
  }, [allItem, listRef.current, filterType]);

  // 语言切换时强制重新渲染虚拟列表
  useEffect(() => {
    if (listRef.current) {
      listRef.current.resetAfterIndex(0);
    }
  }, [i18n.language]);

  // 渲染 cateDesc 的函数
  const renderCateDesc = useCallback((row) => {
    const { name, extSkuMapping, voucherRules, useEndTime = '' } = row;
    const { minSpend, option, value, quantity } = voucherRules;
    
    // 过期时间
    const expires = useEndTime
      ? t('voucher_period', {
          value: dayjs(useEndTime).format('YYYY/MM/DD'),
        })
      : t('permanently_voucher');
    // 最低门槛
    const threshold = minSpend
      ? t('use_voucher_condition', { value: `$${minSpend}` })
      : t('all_order_voucher');
    // 数量
    const count = t('item_voucher_dishes', {
      value: extSkuMapping?.length,
    });
    // 面值
    const voucherVal = () => {
      if (option === 'itemOff') {
        return t('free_voucher');
      }
      if (option === 'dollarOff') {
        return t('voucher_discount', {
          value: `$${value}`,
        });
      }
      if (option === 'percentageOff') {
        return t('voucher_discount', {
          value: `${value}%`,
        });
      }
    };
    // 剩余数量
    const memberVoucherNum = quantity;
    const leftNum = t('voucher_count', { value: memberVoucherNum });
    
    return (
      <div className={styles.cateDesc}>
        <div className={styles.rightCol}>
          <div className={styles.name}>{name}</div>
          <div className={styles.threshold}>
            {threshold}, {count}, {expires}
          </div>
        </div>
        <div className={styles.leftCol}>
          <div className={styles.val}>{voucherVal()}</div>
          <div className={styles.leftNum}>{leftNum}</div>
        </div>
      </div>
    );
  }, [t, i18n.language]);

  return (
    <List
      width={window.innerWidth - 24}
      height={window.innerHeight - remToPx(50)}
      itemCount={allItem?.length}
      itemSize={getItemSize}
      ref={listRef}
      style={{ overflowX: 'hidden' }}
      overscanCount={1}
    >
      {({ index, style }) => {
        const row = allItem[index];
        if (Array.isArray(row)) {
          return (
            <div
              key={index}
              style={{
                ...style,
              }}
            >
              <div
                className={styles.freeItemRow}
                style={{
                  gridTemplateColumns: `repeat(${countRow.count}, ${countRow.widthRate}%)`,
                }}
              >
                {row.map((item, i) => {
                  return (
                    <MemoDishItem
                      key={`${item.id || i}-${i18n.language}`}
                      item={item}
                      rowIndex={index}
                      itemIndex={i}
                      handleClickItem={handleClickItem}
                    />
                  );
                })}
              </div>
            </div>
          );
        }
        if (row?.listType === 'filterList') {
          return (
            <FilterList
              filterType={filterType}
              ruleWithItem={ruleWithItem}
              crmType={crmType}
              onclick={handleFilterChange}
            />
          );
        }
        if (row?.listType === 'cateTitle') {
          return (
            <div style={{ ...style }}>
              <div
                style={{
                  marginTop: `${EXTRA_TOP_MARGIN}rem`,
                }}
                className={styles.cateTitle}
              >
                {row.title}
              </div>
            </div>
          );
        }
        if (row?.listType === 'cateDesc') {
          return (
            <div style={{ ...style }}>
              {renderCateDesc(row)}
            </div>
          );
        }
        return null;
      }}
    </List>
  );
};

export default ADItemList;
