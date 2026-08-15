import React from 'react';
import Recommend from '@/assets/images/recommend.png';
import Spicy from '@/assets/images/spicy.png';
import styles from './imgTag.module.scss';
import IMG_HOST from '@/utils/getImageHost';

const imgMap = {
  SPICY: Spicy,
  RECOMMENDED: Recommend,
};

const ImgTag = (props) => {
  const { tagInfo, imgTagStyle } = props;

  return (
    <>
      <img
        className={styles.imgTag}
        style={{ ...imgTagStyle }}
        src={
          tagInfo?.labelImg?.length
            ? `${tagInfo.labelImg[0]?.url}`
            : imgMap[tagInfo.name]
        }
        alt={tagInfo.name}
      />
      {/* {tagInfo?.labelImg && `${tagInfo.labelImg[0]?.url}` } */}
    </>
  );
};

export default ImgTag;
