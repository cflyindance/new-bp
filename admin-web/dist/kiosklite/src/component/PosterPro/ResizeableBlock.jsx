import { Resizable } from 're-resizable';
import { useMemo } from 'react';

import register from '@/utils/blockRegister';
import { withRouter } from 'react-router-dom';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';

const ResizeableBlock = (props) => {
  const { block, children, onResizeOver, posterPro } = props;
  const { currentBlock } = posterPro;

  const handleResizeStop = (_, __, elementRef) => {
    onResizeOver({
      blockId: block.id,
      width: elementRef.style.width,
      height: elementRef.style.height,
    });
  };

  const isEnableResize = useMemo(() => {
    if (!currentBlock?.id || !block?.id) return false;
    const blockOriginalInfo = register.getBlock(currentBlock.component);
    if (!blockOriginalInfo.resizable) return false;
    return currentBlock.id === block.id
      ? {
          right: true,
          bottom: true,
          bottomRight: true,
        }
      : false;
  }, [currentBlock, block]);

  return (
    <Resizable
      size={{
        width: block.style.width,
        height: block.style.height,
      }}
      minWidth={block.style.minWidth}
      minHeight={block.style.minHeight}
      enable={isEnableResize}
      onResizeStop={handleResizeStop}
      style={{
        position: block.style.position,
        left: block.style.left,
        top: block.style.top,
        visibility: block.style.visibility || 'visible',
      }}
    >
      {children}
    </Resizable>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps)(ResizeableBlock);
