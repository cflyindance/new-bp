import React, { useMemo, useState } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './FilterList.module.scss';
import classNames from 'classnames';

const FilterList = (props) => {
  const {
    ruleWithItem,
    discountRules = [],
    t,
    onclick,
    crmType,
    filterType,
  } = props;

  const pointsSet = useMemo(() => {
    const crmPonintList = new Set(
      [...discountRules, ...ruleWithItem]
        .filter(
          (allRule) =>
            allRule.items?.length > 0 ||
            allRule.name === 'percentageOff' ||
            allRule.name === 'fixedAmount'
        )
        .map((rule) => rule.redeemRule.parameters.points)
        .sort((a, b) => a - b)
    );

    const adPonintList = new Set(
      ruleWithItem
        .filter((allRule) => allRule?.adItemType === 'loyalty')
        .map((rule) => rule?.rewardRule?.redeemRule?.parameters?.points)
        .sort((a, b) => a - b)
    );

    let pointArr =
      crmType === 1 ? crmPonintList : crmType === 2 ? adPonintList : [];

    if (pointArr.size === 0) return [];

    return ['all', ...pointArr];
  }, [ruleWithItem, discountRules]);

  const handleFilterItem = (type) => {
    onclick(type);
  };

  if (pointsSet.length === 0) return null;
  return (
    <div className={styles.filterList}>
      {pointsSet?.map((each) => {
        return (
          <div
            onClick={() => handleFilterItem(each)}
            className={classNames(
              styles.filterItem,
              each === filterType && `${styles.selectedType} animate-btn`
            )}
            key={each}
          >
            {each === 'all' ? t(each) : `${each}${t('pts')}`}
          </div>
        );
      })}
    </div>
  );
};

export default withTranslation()(FilterList);
