import React from 'react';
import styles from './mixTag.module.scss';
import IMG_HOST from '@/utils/getImageHost';

const MixTag = (props) => {
  const { tagInfo } = props;

  return (
    <div className={styles.tagItem}>
      <span
        className={styles.textTag}
        style={{
          backgroundColor: tagInfo.labelBgColor,
          color: tagInfo.labelTextColor,
        }}
      >
        {tagInfo.name}
      </span>
      {tagInfo?.labelImg?.length > 0 && (
        <img
          className={styles.imgTag}
          src={`${tagInfo.labelImg[0]?.url}`}
          alt={tagInfo.name}
        />
      )}
    </div>
  );
};

export default MixTag;
