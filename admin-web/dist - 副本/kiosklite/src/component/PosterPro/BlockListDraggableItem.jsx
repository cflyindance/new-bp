import styles from './BlockListDraggableItem.module.scss';
import { useTranslation } from 'react-i18next';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';

const BlockListDraggableItem = (props) => {
  const { t } = useTranslation();
  const { block } = props;

  const { setNodeRef, listeners, attributes, transform } = useDraggable({
    id: block.component,
  });

  return (
    <div
      id={`blockItem-${block.component}`}
      style={{
        transform: CSS.Translate.toString(transform),
      }}
      className={styles.blockItem}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      {t(block.label)}
    </div>
  );
};

export default BlockListDraggableItem;
