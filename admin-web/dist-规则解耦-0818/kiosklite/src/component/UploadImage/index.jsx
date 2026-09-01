import React from 'react';
import { fetchCompanyProfile, postConfigUploadImg } from '@/api/kioskConfigApi';
import Toast from '@/component/toast';
import { useTranslation } from 'react-i18next';
import { Upload } from 'antd';

const UploadImage = (props) => {
  const { onChange, uploadContent } = props;
  const { t } = useTranslation();

  const beforeUploadImg = (file) => {
    const validPicType = ['image/png', 'image/jpg', 'image/jpeg'];
    const { type, size } = file;
    const isValidType = validPicType.includes(type);
    if (!isValidType) {
      Toast.info(t('palette.img_limit_format'));
      return false;
    }
    const isLt4M = size / 1024 / 1024 <= 4;
    if (!isLt4M) {
      Toast.info(t('palette.img_limit_size'));
      return false;
    }
    return isValidType && isLt4M;
  };

  const customRequest = async (option) => {
    let f = new FormData();
    f.set('file', option.file);
    const uid = option.file.uid;
    try {
      const res = await postConfigUploadImg(uid, f);
      if (res?.data === "Image has been successfully uploaded") {
        option.onSuccess();
        return;
      }
      option.onError();
    } catch (e) {
      option.onError();
    }
  };

  const handleChangeImg = async (info) => {
    if (info.file.status === 'done') {
      const res = await fetchCompanyProfile();
      if (res?.data?.result?.successful) {
        const { images } = res?.data?.company;
        const uid = info.file.uid;
        const currentImg = images.find((each) => each.name === uid);
        onChange?.(currentImg.url);
      }
      Toast.info(t('upload-success'));
    }
    if (info.file.status === 'error') {
      Toast.info(t('upload-error'));
    }
  };

  return (
    <Upload
      name="avatar"
      className="avatar-uploader"
      showUploadList={false}
      beforeUpload={(e) => beforeUploadImg(e)}
      onChange={(e) => handleChangeImg(e)}
      customRequest={customRequest}
    >
      {uploadContent}
    </Upload>
  );
};

export default UploadImage;
