import React from 'react';
import styles from './textTag.module.scss';
import { useTranslation } from 'react-i18next';

const TextTag = (props) => {
  const { tagInfo, textTagStyle } = props;
  const { t } = useTranslation();

  return (
    <span
      className={styles.textTag}
      style={{
        backgroundColor: tagInfo.labelBgColor,
        color: tagInfo.labelTextColor,
        ...textTagStyle,
      }}
    >
      {t(tagInfo.name)}
    </span>
  );
};

export default TextTag;
