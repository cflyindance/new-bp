import styles from './BlockSetting.module.scss';
import { BlockPropertiesMap } from '@/constants/BlockProperties';
import register from '@/utils/blockRegister';
import { Space } from 'antd';
import { useMemo } from 'react';
import { connect } from 'react-redux';
import { useTranslation } from 'react-i18next';

const BlockSetting = (props) => {
  const { t } = useTranslation();
  const { posterPro } = props;
  const { currentBlock } = posterPro;

  const blockOriginInfo = useMemo(() => {
    return register.getBlock(currentBlock.component);
  }, [currentBlock]);


  return (
    <div id="block_setting" className={styles.ComponentPropertyWrapper}>
      <div className={styles.title}>
        <span>{t('poster-pro-components-attr')}</span>
      </div>
      <Space direction="vertical" size={8}>
        {blockOriginInfo?.properties?.map((originProperty) => {
          const property = originProperty;
          if (typeof property === 'string') {
            const Node = BlockPropertiesMap[property];
            return <Node key={property} />;
          }
          if ('style' in property) {
            const styleNodeKey = Object.keys(property.style);
            return styleNodeKey.map((key) => {
              if (key in BlockPropertiesMap.style) {
                const Node = BlockPropertiesMap.style[key];
                return (
                  <Node
                    key={key}
                    {...(currentBlock.props?.overWriteStyleProps?.[key] ||
                      property.style[key])}
                  />
                );
              }
            });
          }
        })}
      </Space>
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps)(BlockSetting);
