import PixelStyleChanger from './PixelStyleChanger';
import { connect } from 'react-redux';
import { editCurrentBlockStyle } from '@/actions/posterPro';
import { VIEWPORT_WIDTH, VIEWPORT_HEIGHT } from '@/constants/posterPro';
import { getCssValue } from '@/utils';

const ChangePosition = (props) => {
  const { cssKey = ['left', 'top'], posterPro, editCurrentBlockStyle } = props;
  const { currentBlock } = posterPro;

  const onPositionChange = (newSize) => {
    editCurrentBlockStyle(newSize);
  };

  return (
    <PixelStyleChanger
      cssKey={cssKey}
      onChange={onPositionChange}
      data={{
        style: currentBlock.style,
        max: {
          left: VIEWPORT_WIDTH - getCssValue(currentBlock.style.width),
          top: VIEWPORT_HEIGHT - getCssValue(currentBlock.style.height),
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

export default connect(mapStateToProps, { editCurrentBlockStyle })(
  ChangePosition
);
