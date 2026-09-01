import { memo } from 'react';
import ImageBlock from './ImageBlock';
import { ASPECT_RATIO } from '@/constants/posterPro';

const Page = (props) => {
  const { style, props: blockProps, component } = props;

  return (
    <ImageBlock
      imgUrl={blockProps?.imgUrl}
      style={{ ...style, aspectRatio: ASPECT_RATIO }}
      name={component}
    />
  );
};

export default memo(Page);
