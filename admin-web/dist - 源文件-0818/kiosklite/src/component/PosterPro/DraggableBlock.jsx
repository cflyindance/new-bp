import { useMemo } from 'react';
import { useDraggable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import styles from './DraggableBlock.module.scss';
import register from '@/utils/blockRegister';
import { connect } from 'react-redux';

const DraggableBlock = (props) => {
  const { children, block, posterPro } = props;

  const isDraggable = useMemo(() => {
    if (!block.component) return false;
    const blockOriginalInfo = register.getBlock(block.component);
    return blockOriginalInfo.draggable;
  }, [block?.component]);

  const { setNodeRef, listeners, attributes, transform, isDragging } =
    useDraggable({
      id: block.id,
      disabled: !isDraggable,
    });
  const { currentBlock } = posterPro;

  return (
    <div
      className={
        currentBlock?.id === block?.id
          ? styles.currentResizeBlock
          : styles.resizeBlock
      }
      style={{
        position: 'static',
        left: 0,
        top: 0,
        width: '100%',
        height: '100%',
        cursor: isDraggable ? 'grab' : 'default',
        transform: CSS.Translate.toString(transform),
      }}
      ref={setNodeRef}
      {...listeners}
      {...attributes}
    >
      {children}
    </div>
  );
};
const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps)(DraggableBlock);
