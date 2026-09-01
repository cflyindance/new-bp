import { memo } from 'react';
import ImageBlock from './ImageBlock';

const ContinueOrder = (props) => {
  const { style, props: blockProps, component } = props;

  return (
    <ImageBlock
      imgUrl={blockProps?.imgUrl}
      style={style}
      name={component}
      fallbackSrc={blockProps?.defaultImg}
    />
  );
};

export default memo(ContinueOrder);
