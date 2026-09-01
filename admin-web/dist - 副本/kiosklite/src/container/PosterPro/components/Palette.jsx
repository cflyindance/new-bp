import { connect } from 'react-redux';
import { useMemo } from 'react';
import DroppableCanvas from '@/component/PosterPro/DroppableCanvas';
import ResizeableBlock from '@/component/PosterPro/ResizeableBlock';
import DraggableBlock from '@/component/PosterPro/DraggableBlock';
import TooltipBar from '@/component/PosterPro/TooltipBar';
import {
  setCurrentBlock,
  setCurrentPage,
  editCurrentBlockStyle,
} from '@/actions/posterPro';
import { useDndMonitor } from '@dnd-kit/core';
import register from '@/utils/blockRegister';
import { nanoid } from 'nanoid';
import { checkPositionLeft, checkPositionTop } from '@/utils';

const allBlockKeys = [...register.getAllBlocks().keys()];

const Palette = (props) => {
  const { posterPro, setCurrentBlock, setCurrentPage, editCurrentBlockStyle } =
    props;
  const { currentPageData } = posterPro;

  const allEditableBlocks = useMemo(() => {
    return currentPageData?.children || [];
  }, [currentPageData]);

  const handleSelectBlock = (block) => {
    setCurrentBlock(block);
  };

  const handleChangeBlockNewStyle = (changedStyle) => {
    editCurrentBlockStyle(changedStyle);
  };

  const handleResizeOver = (data) => {
    const { width, height } = data;
    // 更新block大小
    handleChangeBlockNewStyle({ width, height });
  };

  const makeUpBlock = (block, event) => {
    const blockWidth = block.style?.width;
    const blockHeight = block.style?.height;
    const getTop = () => {
      return (
        event.activatorEvent.clientY -
        (event?.over?.rect?.top || 0) +
        event.delta.y -
        Number(blockHeight) / 2
      );
    };
    const getLeft = () => {
      return (
        event.activatorEvent.clientX -
        (event?.over?.rect?.left || 0) +
        event.delta.x -
        Number(blockWidth) / 2
      );
    };
    const blocksInfo = [];
    const blockInfo = {
      id: nanoid(),
      component: block.component,
      style: {
        ...block.style,
        position: 'absolute',
        top: checkPositionTop(block, getTop()),
        left: checkPositionLeft(block, getLeft()),
        zIndex: 1,
      },
      props: block.props,
    };
    blocksInfo.push(blockInfo);
    return blocksInfo;
  };

  const handelAddNewBlockToPage = (blockOriginalInfo, event) => {
    const newChildData = makeUpBlock(blockOriginalInfo, event);
    const newCurrentPageData = {
      ...currentPageData,
      children: [...(currentPageData?.children || []), ...newChildData],
    };
    setCurrentPage(newCurrentPageData);
    setCurrentBlock(newChildData[0]);
  };

  const handleBeforeDragBlock = (e) => {
    const { id } = e;
    // 新增组件
    if (allBlockKeys.includes(id)) return;
    // 拖动触发时设置当前block, 和点击为互斥事件
    const currentBlock =
      allEditableBlocks?.find((block) => block.id === id) || {};
    setCurrentBlock(currentBlock);
  };

  const handleDragBlockStart = (e) => {
    const { active } = e;
    // 新增组件
    if (allBlockKeys.includes(active.id)) return;
    // 拖动组件 更新zIndex
    const maxZIndexBlock = allEditableBlocks?.reduce((pre, cur) => {
      if (!pre.style?.zIndex) return cur;
      if (Number(cur.style.zIndex) > Number(pre.style.zIndex)) return cur;
      return pre;
    }, {});
    const maxZIndex = Number(maxZIndexBlock?.style?.zIndex || 0) + 1;
    handleChangeBlockNewStyle({ zIndex: maxZIndex });
  };

  const handleDragBlockEnd = (event) => {
    const { active, over, delta } = event;
    if (!over) return;
    // 新增组件
    if (allBlockKeys.includes(active.id)) {
      const blockOriginalInfo = register.getBlock(active.id);
      // 新增页面组件
      handelAddNewBlockToPage(blockOriginalInfo, event);
      return;
    }
    const oldBlock = allEditableBlocks?.find((block) => block.id === active.id);
    const oldBlockStyle = oldBlock?.style;
    // 更新block位置
    if (oldBlockStyle) {
      const newBlockPosition = {
        top: checkPositionTop(oldBlock, Number(oldBlockStyle.top) + delta.y),
        left: checkPositionLeft(oldBlock, Number(oldBlockStyle.left) + delta.x),
      };
      handleChangeBlockNewStyle(newBlockPosition);
    }
  };

  useDndMonitor({
    onDragPending: handleBeforeDragBlock,
    onDragStart: handleDragBlockStart,
    onDragEnd: handleDragBlockEnd,
  });

  if (!currentPageData?.id) return null;
  return (
    <DroppableCanvas id={currentPageData?.id}>
      {allEditableBlocks?.map((block) => {
        const blockInfo = register.getBlock(block.component);
        return (
          <ResizeableBlock
            key={block.id}
            block={block}
            onResizeOver={handleResizeOver}
          >
            <DraggableBlock block={block}>
              <TooltipBar
                block={block}
                isNeedTooltipBar={blockInfo.isNeedTooltipBar}
              >
                <div
                  style={{ width: '100%', height: '100%' }}
                  onClick={() => handleSelectBlock(block)}
                >
                  {blockInfo.render(block)}
                </div>
              </TooltipBar>
            </DraggableBlock>
          </ResizeableBlock>
        );
      })}
    </DroppableCanvas>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps, {
  setCurrentBlock,
  setCurrentPage,
  editCurrentBlockStyle,
})(Palette);
