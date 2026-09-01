import styles from './TooltipBar.module.scss';
import { connect } from 'react-redux';
import DeleteBlock from './DeleteBlock';

const TooltipBar = (props) => {
  const { isNeedTooltipBar = true, children, block, posterPro } = props;
  const { currentBlock } = posterPro;

  return (
    <>
      {isNeedTooltipBar && currentBlock?.id === block?.id ? (
        <>
          <div className={styles.tooltipBar}>
            <DeleteBlock />
          </div>
          {children}
        </>
      ) : (
        children
      )}
    </>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps)(TooltipBar);
