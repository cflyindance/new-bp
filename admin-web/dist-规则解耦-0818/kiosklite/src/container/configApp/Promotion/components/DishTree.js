import React, { useMemo } from 'react';
import { TreeSelect } from 'antd';
import { getUniqueId, handleGetDishId } from '@/utils/handleGetDishId';
import {
  appendParentDishTreeIds,
  buyDishesToTreeSelectValue,
  normalizeStoredBuyDishes,
  transformTreeDishIds,
} from '@/utils/transformTreeMenu';

const DishTree = (props) => {
  const { kioskMenu, handleChange, value, changeKey, treeSelectConfig } = props;

  const kioskMenuWithSubCombo = useMemo(() => {
    return kioskMenu?.map((group) => {
      return {
        ...group,
        checkable: false,
        key: group.id,
        _id: 'group_' + group.id,
        children: group.children?.map((category) => {
          return {
            ...category,
            key: category.id,
            checkable: false,
            _id: 'category_' + category.id,
            children: category.children?.map((item) => {
              return item?.comboSections
                ? {
                    ...item,
                    key: item.id,
                    _id: 'dish_' + item.id,
                    children: item.comboSections?.map((sub) => {
                      return {
                        ...sub,
                        id: `${item.id}${sub.id}`,
                        key: `${item.id}${sub.id}`,
                        _id: 'dish_combo_' + `${item.id}${sub.id}`,
                      };
                    }),
                  }
                : {
                  ...item,
                  _id: 'dish_' + item.id,
                  key: item.id,
                };
            }),
          };
        }),
      };
    });
  }, [kioskMenu]);

  const treeSelectValue = useMemo(
    () => buyDishesToTreeSelectValue(value, kioskMenuWithSubCombo),
    [value, kioskMenuWithSubCombo]
  );

  return (
    <TreeSelect
      showCheckedStrategy="SHOW_ALL"
      maxTagCount={10}
      treeCheckable
      onChange={(v) => {
        const selectedWithParent = appendParentDishTreeIds(
          v,
          kioskMenuWithSubCombo
        );
        const stored = normalizeStoredBuyDishes(
          transformTreeDishIds(selectedWithParent, true),
          kioskMenuWithSubCombo
        );
        handleChange(changeKey, stored);
      }}
      value={treeSelectValue}
      fieldNames={{
        label: 'name',
        value: '_id',
        children: 'children',
      }}
      treeData={kioskMenuWithSubCombo}
      listHeight={660}
      showarrow="true"
      treeNodeFilterProp="name"
      getPopupContainer={(node) => node.parentNode}
      {...treeSelectConfig}
    />
  );
};

export default DishTree;
