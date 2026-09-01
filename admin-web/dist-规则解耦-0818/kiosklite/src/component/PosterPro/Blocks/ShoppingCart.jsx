import { memo } from 'react';
import ImageBlock from './ImageBlock';

const ShoppingCart = (props) => {
  const { style, props: blockProps, component } = props;

  return (
    <ImageBlock
      imgUrl={blockProps?.imgUrl}
      style={style}
      fallbackSrc={blockProps?.defaultImg}
      name={component}
    />
  );
};

export default memo(ShoppingCart);
