import register from '@/utils/blockRegister';
import styles from './BlockList.module.scss';
import BlockListDraggableItem from '@/component/PosterPro/BlockListDraggableItem';
import { useTranslation } from 'react-i18next';

const BlockList = () => {
  const { t } = useTranslation();
  return (
    <div className={styles.blockList}>
      <div className={styles.title}>{t('poster-pro-components')}</div>
      <div>
        {[...(register.getAllBlocks()?.entries() || [])]
          .filter(([, block]) => {
            return !block.isHideInList;
          })
          ?.map(([key, blockProps]) => {
            return <BlockListDraggableItem key={key} block={blockProps} />;
          })}
      </div>
    </div>
  );
};

export default BlockList;
