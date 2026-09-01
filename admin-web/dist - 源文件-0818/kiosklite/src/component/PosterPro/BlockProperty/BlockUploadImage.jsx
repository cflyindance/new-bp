import UploadImage from '../../UploadImage';
import ImageBlock from '../Blocks/ImageBlock';
import { editCurrentBlockProps } from '@/actions/posterPro';
import { useTranslation } from 'react-i18next';
import { Col, Row } from 'antd';
import { connect } from 'react-redux';
import styles from './BlockUploadImage.module.scss';

const Uploader = (props) => {
  const { t } = useTranslation();
  const { posterPro, editCurrentBlockProps } = props;
  const { currentBlock } = posterPro;

  const uploadImageToCurrentBlock = (val) => {
    editCurrentBlockProps({ imgUrl: val, defaultImg: undefined });
  };

  return (
    <Row align="middle">
      <Col span={10}>{t('upload-image')}:</Col>
      <Col span={14}>
        <UploadImage
          onChange={uploadImageToCurrentBlock}
          uploadContent={
            <div className={styles.imageWrapper}>
              <ImageBlock
                imgUrl={currentBlock?.props?.imgUrl}
                fallbackSrc={currentBlock?.props?.defaultImg}
                name="block upload property"
              />
            </div>
          }
        />
      </Col>
    </Row>
  );
};

const mapStateToProps = (state) => {
  return {
    posterPro: state.posterPro,
  };
};

export default connect(mapStateToProps, { editCurrentBlockProps })(Uploader);
