import { Col, Row, TreeSelect } from 'antd';
import { connect } from 'react-redux';
import { editCurrentBlockProps } from '@/actions/posterPro';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { transformTreeDishId } from '@/utils/transformTreeMenu';

const BlockBindDish = (props) => {
  const { t } = useTranslation();
  const { posterPro, editCurrentBlockProps } = props;

  const { currentBlock, kioskMenuTree } = posterPro;

  const bindDishToCurrentBlock = (val) => {
    editCurrentBlockProps({ itemId: transformTreeDishId(val, true) });
  };

  return (
    <Row align="middle">
      <Col span={10}>{t('poster-pro-bind-dish')}:</Col>
      <Col span={14}>
        <TreeSelect
          classNames={{ popup: { root: 'kiosk_tree_select' } }}
          placeholder={t('poster-pro-bind-dish')}
          style={{ width: '100%' }}
          value={transformTreeDishId(currentBlock?.props?.itemId || undefined)}
          onChange={bindDishToCurrentBlock}
          fieldNames={{
            label: 'name',
            value: '_id',
            children: 'children',
          }}
          treeData={kioskMenuTree}
          listHeight={256}
          treeNodeFilterProp="name"
          showSearch
          getPopupContainer={(node) => node.parentNode}
        />
      </Col>
    </Row>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps, { editCurrentBlockProps })(
  BlockBindDish
);
