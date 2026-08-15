import { useDroppable } from '@dnd-kit/core';
import styles from './DroppableCanvas.module.scss';
import { useClickAway } from 'ahooks';
import { connect } from 'react-redux';
import { setCurrentBlock } from '@/actions/posterPro';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '@/constants/posterPro';

const DroppableCanvas = (props) => {
  const { id, children, setCurrentBlock } = props;
  const { setNodeRef, node } = useDroppable({ id });

  useClickAway(() => {
    setCurrentBlock(null);
  }, [
    node,
    document.getElementById('block_setting'),
    () => {
      const node = document.getElementsByClassName('kiosk_tree_select')[0];
      return node || document.getElementById('block_setting');
    },
  ]);

  return (
    <div
      ref={setNodeRef}
      className={styles.viewport}
      style={{
        width: VIEWPORT_WIDTH,
        height: VIEWPORT_HEIGHT,
      }}
    >
      {children}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {};
};

export default connect(mapStateToProps, { setCurrentBlock })(DroppableCanvas);
