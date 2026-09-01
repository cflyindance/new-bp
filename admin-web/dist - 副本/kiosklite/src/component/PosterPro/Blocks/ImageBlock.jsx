import { useMemo } from 'react';
import IMG_HOST from '@/utils/getImageHost';

const ImageBlock = (props) => {
  const { imgUrl, name, fallbackSrc, style, ...rest } = props;

  const src = useMemo(() => {
    if (imgUrl) {
      // 开发环境在 localhost:3000 根路径下，../img 无法直达 POS；与 screenSaver 等一致走 IMG_HOST
      if (process.env.NODE_ENV === 'development') {
        return `${IMG_HOST}${imgUrl}`;
      }
      return `../${imgUrl}`;
    }
    // 本地静态资源
    if (fallbackSrc?.includes('/images/')) {
      if (process.env.NODE_ENV === 'development') return fallbackSrc;
      return `../kiosklite/${fallbackSrc}`;
    }
    return fallbackSrc;
  }, [imgUrl, fallbackSrc]);

  return <img src={src} alt={`${name} block image`} style={style} {...rest} />;
};

export default ImageBlock;
