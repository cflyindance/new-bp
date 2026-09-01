import styles from './ConfigPanel.module.scss';
import BlockSetting from './BlockSetting';
import BlockList from './BlockList';
import { connect } from 'react-redux';

const ConfigPanel = (props) => {
  const { posterPro } = props;
  const { currentPageData, currentBlock } = posterPro;

  if (!currentPageData?.id) return null;
  return (
    <div className={styles.panelWrapper}>
      {currentBlock?.id ? <BlockSetting /> : <BlockList />}
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps)(ConfigPanel);
