import PixelStyleChanger from './PixelStyleChanger';
import { connect } from 'react-redux';
import { editCurrentBlockStyle } from '@/actions/posterPro';

const ChangeSize = (props) => {
  const {
    cssKey = ['width', 'height'],
    posterPro,
    editCurrentBlockStyle,
  } = props;
  const { currentBlock } = posterPro;

  const onSizeChange = (newSize) => {
    editCurrentBlockStyle(newSize);
  };

  return (
    <PixelStyleChanger
      cssKey={cssKey}
      onChange={onSizeChange}
      data={{
        style: currentBlock.style,
        min: {
          width: currentBlock.style.minWidth,
          height: currentBlock.style.minHeight,
        },
      }}
    />
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps, { editCurrentBlockStyle })(ChangeSize);
