import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import classNames from 'classnames';
import { Checkbox, Upload, Button, Input, Row, Col } from 'antd';
import styles from './brandInfo.module.scss';
import defaultImage from '@/assets/images/sushi.jpg';
import { getRestaurantHour, postConfigUploadImg, fetchCompanyProfile } from '@/api/kioskConfigApi';
import Toast from '@/component/toast';
import IMG_HOST from '@/utils/getImageHost';
import getBsTime from '@/utils/getBsTime';

const { Group } = Checkbox;

class BrandInfo extends Component {
  componentDidMount() {
    this.initBsHour();
  }

  state = {
    hourInfo: [],
    name: null,
    imgSrc: null,
    bsTime: [],
    imgId: null,
    id: null,
  };

  static getDerivedStateFromProps(props, preState) {
    if (props.brandInfo && props.brandInfo.id !== preState.id) {
      const { name, imgSrc, bsTime, id } = props.brandInfo;
      return {
        name,
        imgSrc,
        bsTime,
        id,
      };
    }
    return null;
  }

  initBsHour = async () => {
    const res = await getRestaurantHour();
    if (res?.data?.msg === 'success') {
      const { data } = res.data;
      const { hours } = data;
      const filteredHours = hours.filter((each) => each.type === 'OTHER' || !Object.hasOwnProperty.call(each, 'type'));
      const newHours = getBsTime(filteredHours);
      this.setState({
        hourInfo: newHours,
      });
    }
  };

  handleInputName = (e) => {
    const val = e.target.value;
    this.setState({
      name: val,
    });
  };

  beforeUploadImg = (file) => {
    const { t } = this.props;
    const validPicType = ['image/png', 'image/jpg', 'image/jpeg'];
    const { type, size } = file;
    const isValidType = validPicType.includes(type);
    if (!isValidType) {
      Toast.info(t('img-limit-format'));
      return false;
    }
    const isLt1M = size / 1024 / 1024 <= 1;
    if (!isLt1M) {
      Toast.info(t('img-limit-size'));
      return false;
    }
    return isValidType && isLt1M;
  };

  customRequest = async (option) => {
    let f = new FormData();
    f.set('file', option.file);
    const uid = option.file.uid;
    try {
      const res = await postConfigUploadImg(uid, f);
      if (res?.statusText === 'OK') {
        this.setState({
          imgId: uid,
        });
        option.onSuccess();
        return;
      }
      option.onError();
    } catch (e) {
      option.onError();
    }
  };

  handleChangeImg = async (info) => {
    const { t } = this.props;
    if (info.file.status === 'done') {
      const { imgId } = this.state;
      const res = await fetchCompanyProfile();
      if (res?.data?.result?.successful) {
        const { images } = res?.data?.company;
        const currentImg = images.find((each) => each.name === imgId);
        this.setState({
          imgSrc: currentImg?.url,
        });
      }
      Toast.info(t('upload-success'));
    }
    if (info.file.status === 'error') {
      Toast.info(t('upload-error'));
    }
  };

  handleSelectHour = (val) => {
    const { hourInfo } = this.state;
    const bsTime = hourInfo.filter((each) => val.includes(each.id));
    this.setState({
      bsTime,
    });
  };

  handleConfirm = () => {
    const { onClose, t } = this.props;
    const { bsTime, name, imgSrc, id } = this.state;
    const item = {
      name,
      imgSrc,
      bsTime,
      id: id || undefined,
    };
    if (!name) return Toast.info(t('validate-brand-name'));
    if (!bsTime?.length) return Toast.info(t('validate-brand-bsTime'));
    onClose?.(item);
  };

  render() {
    const { hourInfo, bsTime, name, imgSrc } = this.state;
    const { onClose, t } = this.props;
    return (
      <div className={styles.brandInfo}>
        <Row>
          <Col span={4}>{t('table-name')}:</Col>
          <Col span={20}>
            <Input showCount maxLength={50} value={name} onChange={this.handleInputName} />
          </Col>
        </Row>
        <Row>
          <Col span={4}>{t('table-img')}:</Col>
          <Col span={20}>
            <Upload
              name="avatar"
              listType="picture-card"
              className="avatar-uploader"
              showUploadList={false}
              beforeUpload={this.beforeUploadImg}
              onChange={this.handleChangeImg}
              customRequest={this.customRequest}
            >
              <img
                className={styles.uploadImg}
                src={imgSrc ? `${IMG_HOST}/${imgSrc}` : defaultImage}
                alt="brand img"
              />
            </Upload>
          </Col>
        </Row>
        <Row>
          <Col span={4}>{t('table-bsTime')}:</Col>
          <Col span={20}>
            <Group value={bsTime.map((each) => each.id)} onChange={this.handleSelectHour}>
              {hourInfo.map((each, idx) => {
                return (
                  <Row key={idx}>
                    <Col span={24}>
                      <div className={styles.hourRow}>
                        <Checkbox value={each.id}>{each.name}</Checkbox>
                        <span>{each.from}</span>
                        <span> to </span>
                        <span>{each.to} </span>
                        <div className={styles.bsDay}>
                          {['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'].map((day) => {
                            return (
                              <div
                                className={classNames(
                                  styles.dayItem,
                                  each.bsDay.includes(day) && styles.work,
                                )}
                                key={day}
                              >
                                {day}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </Col>
                  </Row>
                );
              })}
            </Group>
          </Col>
        </Row>
        <Row className={styles.footerBtn}>
          <Button onClick={() => onClose?.(false)}>{t('operate-cancel')}</Button>
          <Button type="primary" onClick={this.handleConfirm}>
            {t('operate-confirm')}
          </Button>
        </Row>
      </div>
    );
  }
}

export default withTranslation()(BrandInfo);
