import ConfigPanel from './ConfigPanel';
import styles from './Vertical.module.scss';
import { connect } from 'react-redux';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { useEffect, useMemo } from 'react';
import UploadImage from '@/component/UploadImage';
import { Button } from 'antd';
import Palette from './Palette';
import {
  setCurrentPage,
  setPosterData,
  syncBlockDataToPage,
  syncPageDataToGlobal,
} from '@/actions/posterPro';
import register from '@/utils/blockRegister';
import { nanoid } from 'nanoid';
import { usePrevious } from 'ahooks';
import { ASPECT_RATIO } from '@/constants/posterPro';

const Vertical = (props) => {
  const {
    t,
    posterPro,
    setCurrentPage,
    setPosterData,
    syncBlockDataToPage,
    syncPageDataToGlobal,
  } = props;
  const { posterData, currentBlock, currentPageData } = posterPro;
  const pagePreviousData = usePrevious(currentPageData);

  const verticalPoster = useMemo(() => {
    return posterData.find((each) => each.direction === 'vertical');
  }, [posterData]);

  useEffect(() => {
    if (!pagePreviousData?.id && verticalPoster?.id) {
      setCurrentPage(verticalPoster);
    }
  }, [pagePreviousData, verticalPoster]);

  // 当前组件变化后保存到页面中
  useEffect(() => {
    if (currentBlock?.id) {
      syncBlockDataToPage(currentBlock);
    }
  }, [currentBlock]);

  // 页面数据变化后同步到全局
  useEffect(() => {
    if (currentPageData?.id) {
      syncPageDataToGlobal();
    }
  }, [currentPageData]);

  const handleAddNewPage = (imgUrl) => {
    const pageBlock = register.getBlock('Page');
    const newPage = {
      component: 'Container',
      id: nanoid(),
      direction: 'vertical',
      children: [
        {
          id: nanoid(),
          component: pageBlock.component,
          style: pageBlock.style || {},
          props: {
            imgUrl,
          },
        },
      ],
    };
    const newPosterData = [...posterData, newPage];
    setPosterData(newPosterData);
    setCurrentPage(newPage);
  };

  return (
    <div className={styles.verticalWrapper}>
      <div className={styles.verticalPalette}>
        {verticalPoster ? (
          <>
            <div className={styles.aspectRatio}>
              {t('poster-pro-aspectRatio')}：{ASPECT_RATIO}
            </div>
            <Palette />
          </>
        ) : (
          <div className={styles.noData}>
            <div className={styles.noDataContent}>
              <div className={styles.text}>{t('no-data')}</div>
              <UploadImage
                onChange={handleAddNewPage}
                uploadContent={
                  <Button type="primary"> + {t('poster-pro-add')}</Button>
                }
              />
            </div>
          </div>
        )}
      </div>
      <ConfigPanel />
    </div>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default withRouter(
  connect(mapStateToProps, {
    setCurrentPage,
    setPosterData,
    syncBlockDataToPage,
    syncPageDataToGlobal,
  })(withTranslation()(Vertical))
);
