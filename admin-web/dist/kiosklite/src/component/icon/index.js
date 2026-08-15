import React from 'react';
import styles from './icon.module.scss';

const Icons = (props) => {
  const { type, size, color, style = {}, className, onClick } = props;

  let classname = '';
  if (Object.prototype.toString.call(className) === '[object Array]') {
    classname = className.join(',');
  } else {
    classname = className;
  }

  return (
    <i
      style={{
        color: color ? color : 'none',
        fontSize: size ? `${size}rem` : 'inherit',
        ...style,
      }}
      className={[styles.iconfont, styles[`icon-${type}`], classname].join(' ')}
      onClick={onClick ? onClick : null}
    ></i>
  );
};

export default Icons;
