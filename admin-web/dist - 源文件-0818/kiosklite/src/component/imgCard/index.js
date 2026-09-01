import React, { useMemo, memo, useState, useEffect } from 'react';
import styles from './imgCard.module.scss';
import { serverURL } from '@/api/ip';
import defaultImage from '@/assets/images/noimage-dish.png';
import { getDishItemLanguage } from '@/utils/busTools';
import { withTranslation } from 'react-i18next';
import {
  getCachedImagePath,
  hasCachedNoImage,
  setCachedImagePath,
  setCachedNoImage,
} from '@/utils/imagePathCache';

const possibleExtensions = ['png', 'jpeg', 'jpg', 'PNG', 'JPEG', 'JPG'];
const ImgCard = (props) => {
  const { itemInfo, selfConfig, t } = props;

  // 使用visibility在加载时隐藏图片
  // 1.解决img图片和background-image两个图片出现时间不一致的情况
  // 2.解决图片加载完成之前一直在闪的问题
  const [isLoading, setIsLoading] = useState(true);
  const [tryTimes, setTryTimes] = useState(0);
  const [imgUrl, setImgUrl] = useState(defaultImage);

  // 获取商品id，用于缓存key
  const itemId = useMemo(() => {
    return itemInfo?.id || itemInfo?.oId || null;
  }, [itemInfo]);

  // 判断图片显示效果（id:18）
  const objectFit = useMemo(() => {
    return selfConfig?.configMap?.id_18 ? 'cover' : 'contain';
  }, [selfConfig]);

  // 菜名 用来找图片的 统一只取多语言里英文的
  const itemName = useMemo(() => {
    return (
      getDishItemLanguage(itemInfo.fieldDisplayNameGroups, 'en') ||
      itemInfo.name
    );
  }, [itemInfo]);

  // 更新 imgUrl，优先从缓存读取
  useEffect(() => {
    // 重置状态
    setIsLoading(true);
    setTryTimes(0);
    // 已确认无真实图片，直接使用默认图
    if (itemId && hasCachedNoImage(itemId)) {
      setImgUrl(defaultImage);
      return;
    }

    // 先尝试从缓存读取真实图片路径
    const cachedPath = itemId ? getCachedImagePath(itemId) : null;
    if (cachedPath) {
      setImgUrl(cachedPath);
      // 从缓存读取的图片也需要等待加载完成，在onLoad中设置isLoading为false
      return;
    }

    // 缓存中没有，优先使用接口返回的路径
    if (itemInfo.thumbPath) {
      setImgUrl(serverURL + itemInfo.thumbPath);
      // thumbPath存在时，tryTimes保持为0，如果加载失败会在onError中开始尝试本地图片
    } else {
      // 如果没有thumbPath，直接尝试本地图片（从第一个扩展名开始）
      if (itemName) {
        const imageExtend = possibleExtensions[0];
        const imageName = `${itemName}.${imageExtend}`;
        const newImgUrl = `${serverURL}img/gallery/kiosk/${imageName}`;
        setImgUrl(encodeBackgroundImageUrl(newImgUrl));
        setTryTimes(1); // 设置为1，表示已经尝试了第一个扩展名
      } else {
        // 如果连菜品名称都没有，直接使用默认图并标记为无真实图片
        if (itemId) {
          setCachedNoImage(itemId);
        }
        setImgUrl(defaultImage);
      }
    }
  }, [itemInfo.thumbPath, itemId, itemName]);

  function encodeBackgroundImageUrl(path) {
    // 处理反斜杠、特殊字符及非 ASCII 字符
    // 先处理反斜杠转正斜杠
    let sanitizedPath = path.replace(/\\/g, '/');

    // 检查是否已经编码过（包含%字符）
    if (sanitizedPath.includes('%')) {
      // 如果已经编码过，直接返回（避免二次编码）
      return sanitizedPath;
    }

    // 将路径拆分为基础路径和文件名部分
    const lastSlashIndex = sanitizedPath.lastIndexOf('/');
    if (lastSlashIndex === -1) {
      // 如果没有路径分隔符，直接编码整个字符串
      return encodeURIComponent(sanitizedPath);
    }

    const basePath = sanitizedPath.substring(0, lastSlashIndex + 1);
    const fileName = sanitizedPath.substring(lastSlashIndex + 1);

    // 对文件名部分进行更严格的编码，处理所有特殊字符（包括点、空格、括号等）
    // encodeURIComponent 会正确处理所有特殊字符，包括空格、点、括号等
    const encodedFileName = encodeURIComponent(fileName);

    // 基础路径部分通常不需要编码（因为服务器路径是标准的），但为了安全起见，只编码非标准字符
    // 实际上，对于服务器URL的基础路径，通常不需要编码，只需要编码文件名
    return basePath + encodedFileName;
  }

  // 检查是否有手动放的图片
  const onErrorTryAgain = (e) => {
    e.target.onerror = null;

    // 如果没有菜品名称，或者已经尝试完所有扩展名，使用默认图
    if (!itemName || tryTimes >= possibleExtensions.length) {
      // 如果最终使用默认图，标记为无真实图片，避免重复查找
      if (itemId) {
        setCachedNoImage(itemId);
      }
      setImgUrl(defaultImage);
      // 默认图可能在浏览器缓存中，需要手动触发加载完成
      // 使用setTimeout确保DOM更新后再检查
      setTimeout(() => {
        const img = e.target;
        if (img.complete && img.naturalHeight !== 0) {
          setIsLoading(false);
          setTryTimes(0);
        }
      }, 0);
      return;
    }

    // 尝试下一个扩展名
    // 注意：当thumbPath不存在时，tryTimes已经是1（因为已经尝试了第一个扩展名）
    // 当thumbPath存在但加载失败时，tryTimes是0，会尝试第一个扩展名
    const imageExtend = possibleExtensions[tryTimes];
    const imageName = `${itemName}.${imageExtend}`;
    const newImgUrl = `${serverURL}img/gallery/kiosk/${imageName}`;
    setImgUrl(encodeBackgroundImageUrl(newImgUrl)); // 编码特殊字符，包括空格、点、括号等
    setTryTimes((prev) => prev + 1);
  };

  return (
    <div
      className={styles.imgBox}
      style={{ visibility: isLoading ? 'hidden' : 'visible' }}
    >
      {objectFit === 'contain' && (
        <div
          className={styles.imgBg}
          style={{
            backgroundImage: `url(${imgUrl})`,
          }}
        />
      )}
      <img
        src={imgUrl}
        alt={itemName || t('label_dish')}
        className={`${objectFit === 'cover' ? styles.imgCover : styles.imgContain} ${styles.itemImg}`}
        onLoad={(e) => {
          setIsLoading(false);
          setTryTimes(0);
          // 图片加载成功，存入缓存
          const loadedUrl = e.target.src;
          if (itemId && loadedUrl && loadedUrl !== defaultImage) {
            setCachedImagePath(itemId, loadedUrl);
          }
        }}
        onError={(e) => {
          onErrorTryAgain(e);
        }}
      />
    </div>
  );
};

export default withTranslation()(memo(ImgCard));
