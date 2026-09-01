import React from 'react';
import { withTranslation } from 'react-i18next';
import { Upload } from 'antd';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { fetchCompanyProfile, postConfigUploadImg } from '@/api/kioskConfigApi';
import Toast from '@/component/toast';
import { isImage } from '@/utils';
import IMG_HOST from '@/utils/getImageHost';
import styles from './numberPlateImageItem.module.scss';

const IMAGE_FIELDS = [
  {
    key: 'horizontalImg',
    label: 'number-plate-horizontal-image',
    size: '700*700px',
  },
  {
    key: 'verticalImg',
    label: 'number-plate-vertical-image',
    size: '700*450px',
  },
];

const NumberPlateImageItem = ({ visible, configInfo, onChange, t }) => {
  if (!visible) return null;

  const updateImage = (key, imageUrl) => {
    onChange(configInfo.id, {
      ...configInfo.value,
      [key]: imageUrl,
    });
  };

  const beforeUpload = (file) => {
    if (!isImage(file.type)) {
      Toast.info(t('illegal_input'));
      return false;
    }
    if (file.size / 1024 / 1024 > 5) {
      Toast.info(t('img-max-size', { size: '5M' }));
      return false;
    }
    return true;
  };

  const customRequest = async (option, imageKey) => {
    const formData = new FormData();
    formData.set('file', option.file);
    const uid = option.file.uid;

    try {
      const uploadRes = await postConfigUploadImg(uid, formData);
      if (uploadRes?.statusText !== 'OK') {
        option.onError();
        return;
      }

      const profileRes = await fetchCompanyProfile();
      const images = profileRes?.data?.company?.images || [];
      const currentImage = images.find((image) => image.name === uid);
      if (!profileRes?.data?.result?.successful || !currentImage?.url) {
        option.onError();
        return;
      }

      updateImage(imageKey, currentImage.url);
      option.onSuccess();
    } catch (error) {
      option.onError(error);
    }
  };

  return (
    <div className={styles.imageList}>
      {IMAGE_FIELDS.map((image) => {
        const imageUrl = configInfo.value[image.key];
        return (
          <div className={styles.imageItem} key={image.key}>
            <div
              className={`${styles.preview} ${
                image.key === 'verticalImg' ? styles.verticalPreview : ''
              }`}
            >
              {imageUrl ? <img src={`${IMG_HOST}/${imageUrl}`} alt="" /> : null}
            </div>
            <div className={styles.imageInfo}>
              <div className={styles.imageTitle}>{t(image.label)}</div>
              <div>{t('pic-dimensions', { size: image.size })}</div>
              <div>{t('pic-tip')}</div>
              <div>{t('pic-size', { size: '4M' })}</div>
              <Upload
                name={image.key}
                showUploadList={false}
                maxCount={1}
                beforeUpload={beforeUpload}
                customRequest={(option) => customRequest(option, image.key)}
              >
                <div className={styles.uploadButton}>
                  <CloudUploadIcon className={styles.uploadIcon} />
                  <span>{t('upload-image')}</span>
                </div>
              </Upload>
              <div
                className={styles.deleteButton}
                onClick={() => updateImage(image.key, '')}
              >
                {t('delete-image')}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default withTranslation()(NumberPlateImageItem);
