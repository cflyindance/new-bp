import React, { useMemo } from 'react';
import TextTag from './textTag';
import ImgTag from './imgTag';
// import MixTag from './mixTag';
import styles from './index.module.scss';

// const textTag = [
//   'CONTAIN_ALCOHOL',
//   'RAW_OR_UNDERCOOKED',
//   'COLD',
//   'HOT',
//   'VEGGIE',
//   'SHELLFISH',
// ];
const imgTag = ['SPICY', 'RECOMMENDED'];
const newTag = ['NEW'];

const DishTag = (props) => {
  const {
    tagsInfo: tagsInfoOrigin,
    isItemCard = true,
    textTagStyle,
    imgTagStyle,
    style,
  } = props;

  const tagsInfo = useMemo(() => {
    return tagsInfoOrigin.filter((tag) => 
      // 展示kiosk标签
      tag.isKioskTag
      // 展示pos标签
      || (!tag.hasOwnProperty('type') && (imgTag.includes(tag.name) || newTag.includes(tag.name)))
      // 排除商品中心统计标签
      || (tag.hasOwnProperty('type') && tag.type !== 3)
    );
  }, [tagsInfoOrigin]);

  // 图片标签
  const imgTags = useMemo(() => {
    if (!tagsInfo?.length) return [];
    return tagsInfo
      .filter((tag) => imgTag.includes(tag.name) || tag?.labelType === 'img')
      ?.sort((a, b) => b.name.length - a.name.length);
  }, [tagsInfo]);

  // new标签
  const spacialNewTag = useMemo(() => {
    if (!tagsInfo?.length) return [];
    return tagsInfo.filter(
      (tag) =>
        newTag.includes(tag.name) ||
        // 商品中心商品角标
        tag.type === 2
    );
  }, [tagsInfo]);

  // 文字标签
  const textTags = useMemo(() => {
    if (!tagsInfo?.length) return [];
    const excludeNames = new Set([
      ...imgTags.map((tag) => tag.name),
      ...spacialNewTag.map((tag) => tag.name),
    ]);
    return tagsInfo.filter((tag) => {
      // 非kiosk后台配置的文字标签 一律不展示【后期改成配置项】
      return !excludeNames.has(tag.name);
    });
  }, [tagsInfo, imgTags, spacialNewTag]);

  if (!imgTags?.length && !spacialNewTag?.length && !textTags?.length)
    return null;

  return (
    <div className={styles.tagWrapper} style={{ ...style }}>
      {imgTags.map((each, idx) => {
        return <ImgTag tagInfo={each} key={idx} imgTagStyle={imgTagStyle} />;
      })}
      {spacialNewTag.map((each, idx) => {
        return isItemCard ? (
          <div className={styles.new} key={idx}>
            <span className={styles.newText}>{each.name}</span>
          </div>
        ) : (
          <TextTag tagInfo={each} key={idx} textTagStyle={textTagStyle} />
        );
      })}
      {textTags.map((each, idx) => {
        return <TextTag tagInfo={each} key={idx} textTagStyle={textTagStyle} />;
      })}
    </div>
  );
};

export default DishTag;
