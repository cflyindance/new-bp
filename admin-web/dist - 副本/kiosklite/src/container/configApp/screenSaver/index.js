import React, { Component, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import styles from './screenSaver.module.scss';
import Snackbar from '@material-ui/core/Snackbar';
import Alert from '@material-ui/lab/Alert';
import ConfigHeader from '../../../component/configHeader';
import ConfigFooter from '../../../component/configFooter';
import { getCookie } from '@/utils';
import { selfConfigList } from '@/constants/selfConfig';
import {
  Switch,
  TextField,
  MenuItem,
  Typography,
  Box,
} from '@material-ui/core';
import {
  postMarginappConfig,
  getMarginappFetchKioskConfig,
  postConfigUploadImg,
  fetchCompanyProfile,
  fetchEffectiveScreen,
} from '@/api/kioskConfigApi';
import { cloudLayoutHasContent } from '@/container/mainPage/components/mapEffectiveScreenLayout';
import {
  normalizeScreenSaverDataSource,
  SCREENSAVER_DATA_SOURCE,
} from '@/utils/screenSaverConfig';
import { on, off } from '@/utils';
import { Radio } from 'antd';
import _ from 'lodash';
import { Button, Space, Tooltip, Upload } from 'antd';
import { DeleteOutlined, EyeOutlined } from '@ant-design/icons';

import defaultHImage from '@/assets/images/screen-h.png';
import defaultVImage from '@/assets/images/screen-v.png';

import Toast from '@/component/toast';
import IMG_HOST from '@/utils/getImageHost';

const transitionEffects = [
  { label: 'slide', value: 'slide' },
  { label: 'fade', value: 'fade' },
  { label: 'zoom', value: 'zoom' },
  { label: 'rotate', value: 'rotate' },
  { label: 'bounce', value: 'bounce' },
  { label: 'flip', value: 'flip' },
];

const DELAYTIME = 60;
const SWIPERTIME = 3;
class ScreenSaver extends Component {
  constructor() {
    super();
    this.state = {
      isLoad: true,
      msg: '',
      open: false,
      errorApiMsg: '',
      errorApiShow: false,
      screenSaverData: {
        status: true, //是否开启屏保
        dataSource: SCREENSAVER_DATA_SOURCE.CLOUD,
        showHomePage: true, //是否展示首页
        delayTime: DELAYTIME, //进入屏保的时间
        imageAnimation: 'fadeIn', //图片动画效果
        swiperTime: SWIPERTIME, //图片轮播时间
        horizontalData: {
          //横屏数据
          type: 'image', //图片（image）or视频(video)
          imageList: [{ url: '../../../assets/images/screen-h.jpg' }], //图片列表
          videoList: [], //视频列表
        },
        verticalityData: {
          //竖屏数据
          type: 'image', //图片（image）or视频(video)
          imageList: [{ url: '../../../assets/images/screen-v.jpg' }], //图片列表
          videoList: [], //视频列表
        },
      },
      allKioskConfig: {},
      cloudLayoutEffective: false,
    };
    this.isComponentMounted = false;
    this.timer = null;
  }

  refreshCloudEffective = async () => {
    try {
      const profileRes = await fetchCompanyProfile();
      if (
        !profileRes?.data?.result?.successful ||
        !profileRes?.data?.company?.merchantId
      ) {
        this.setState({ cloudLayoutEffective: false });
        return;
      }
      const res = await fetchEffectiveScreen({
        merchantId: String(profileRes.data.company.merchantId),
        channel: 'KIOSK',
        atTime: dayjs().format('YYYY-MM-DD HH:mm:ss'),
      });
      const layout = res?.data?.data;
      this.setState({
        cloudLayoutEffective: cloudLayoutHasContent(layout),
      });
    } catch (_) {
      this.setState({ cloudLayoutEffective: false });
    }
  };

  initConfigList = (params) => {
    if (!this.isComponentMounted) {
      return Promise.resolve();
    }
    getMarginappFetchKioskConfig(params)
      .then((res) => {
        if (!this.isComponentMounted) {
          return;
        }
        if (res.data.result.successful) {
          let list = res.data.marginAppConfigTypes;
          let obj = list?.find((l) => l.product == 'KIOSKLITE');
          let arr = JSON.parse(obj?.data);
          let screenData = {};
          // 本地js和数据库对比
          let screenDataIndex = arr?.configList?.findIndex(
            (item) => item.id === 35
          );
          if (screenDataIndex === -1) {
            selfConfigList.configList.forEach((item) => {
              if (item.id === 35) screenData = item.value; //设置默认的屏保数据
            });
          } else {
            screenData = arr.configList[screenDataIndex].value; //获取之前配置的参数
            // 确保 showHomePage 字段存在，如果不存在则设置默认值
            if (screenData.showHomePage === undefined) {
              screenData.showHomePage = true;
            }
          }
          const normalized = normalizeScreenSaverDataSource(
            _.cloneDeep(screenData)
          );
          this.setState(
            {
              isLoad: false,
              allKioskConfig: arr,
              screenSaverData: normalized,
            },
            () => {
              if (normalized.dataSource === SCREENSAVER_DATA_SOURCE.CLOUD) {
                this.refreshCloudEffective();
              } else {
                this.setState({ cloudLayoutEffective: false });
              }
            }
          );
        }
        off(window, 'message', this.getData);
      })
      .catch((err) => {
        this.showApiModalTip(err?.message);
        this.setState({
          isLoad: false,
        });
        off(window, 'message', this.getData);
      });
  };
  // 接口报错提示
  showApiModalTip = (errMsg) => {
    this.setState({
      errorApiMsg: errMsg,
      errorApiShow: true,
    });
    this.timer = setTimeout(() => {
      this.setState({
        errorApiMsg: '',
        errorApiShow: false,
      });
    }, 2000);
  };

  getData = (event) => {
    if (process.env.NODE_ENV === 'development') {
      this.initConfigList(getCookie('sessionKey'));
    } else {
      if (event.data.type == 'sessionKey') {
        this.initConfigList(event.data.data);
      }
    }
  };

  componentDidMount() {
    this.isComponentMounted = true;
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.getData);
  }

  componentWillUnmount() {
    this.isComponentMounted = false;
    clearTimeout(this.timer);
    off(window, 'message', this.getData);
  }

  render() {
    const { t } = this.props;
    const {
      screenSaverData,
      open,
      msg,
      errorApiShow,
      errorApiMsg,
      cloudLayoutEffective,
    } = this.state;
    let screenSaverTempData = screenSaverData;

    const tips = (type) => {
      switch (type) {
        case 'left':
          return (
            t('pic-dimensions', { size: '1080*1920px' }) +
            '<br/>' +
            t('pic-tip') +
            '<br/>' +
            t('imgSize') +
            '<br/>' +
            t('videoSize')
          );
        case 'right':
          return (
            t('pic-dimensions', { size: '1920*1080px' }) +
            '<br/>' +
            t('pic-tip') +
            '<br/>' +
            t('imgSize') +
            '<br/>' +
            t('videoSize')
          );
        default:
          return (
            t('pic-dimensions', { size: '1080*1920px' }) +
            '<br/>' +
            t('pic-tip') +
            '<br/>' +
            t('imgSize') +
            '<br/>' +
            t('videoSize')
          );
      }
    };

    const handleSetValue = (key, e) => {
      if (!key) {
        return;
      }
      // 屏保相关数据的赋值，传入key和值
      if (key?.indexOf('.') > -1) {
        _.set(screenSaverTempData, key, e);
      } else screenSaverTempData[key] = e;

      // 当 showHomePage 设置为 false 时，自动将 delayTime 设置为 0
      if (key === 'showHomePage' && e === false) {
        screenSaverTempData.delayTime = 0;
      }
      // 当 showHomePage 设置为 true 时，自动将 delayTime 设置为 DELAYTIME
      if (key === 'showHomePage' && e === true) {
        screenSaverTempData.delayTime = DELAYTIME;
      }

      this.setState({ screenSaverData: screenSaverTempData }, () => {
        if (key === 'dataSource') {
          if (e === SCREENSAVER_DATA_SOURCE.CLOUD) {
            this.refreshCloudEffective();
          } else {
            this.setState({ cloudLayoutEffective: false });
          }
        }
        if (key === 'status' && e === true) {
          const ds = this.state.screenSaverData?.dataSource;
          if (ds === SCREENSAVER_DATA_SOURCE.CLOUD) {
            this.refreshCloudEffective();
          }
        }
      });
    };

    const saveConfig = (event) => {
      if (process.env.NODE_ENV === 'development') {
        handleSaveConfig(getCookie('sessionKey'));
      } else {
        if (event.data.type === 'sessionKey') {
          handleSaveConfig(event.data.data);
        }
      }
    };
    const handleSave = () => {
      window.parent.postMessage({ type: 'getSessionKey' }, '*');
      on(window, 'message', saveConfig);
    };

    const handleSaveConfig = async (sessionKey) => {
      let { isLoad, allKioskConfig, screenSaverData } = this.state;
      let screenDataIndex = allKioskConfig?.configList?.findIndex(
        (item) => item.id === 35
      );

      if (screenDataIndex === -1) {
        allKioskConfig?.configList?.push({
          id: 35,
          value: screenSaverData,
          key: 'screen-saver',
        });
      } else {
        allKioskConfig.configList[screenDataIndex].value = screenSaverData;
      }
      await setConfigSetting(allKioskConfig, sessionKey);
    };

    const setConfigSetting = async (config, sessionKey) => {
      const newData = JSON?.stringify(config);
      const res = await postMarginappConfig(newData, sessionKey);
      if (this.isComponentMounted && res.data?.result?.successful) {
        await this.initConfigList(sessionKey);
        Toast.info('SUCCESS', 1000);
      }
      off(window, 'message', saveConfig);
    };
    const radioGroup = [
      { value: 'image', label: 'image' },
      { value: 'video', label: 'video' },
    ];

    const beforeUploadImg = (file, loca, fileType) => {
      const { t } = this.props;
      const { type, size } = file;
      const isValidType = type?.indexOf(fileType) === 0;
      if (!isValidType) {
        Toast.info(t('illegal_input'));
        return false;
      }
      const isLt1M =
        fileType === 'image'
          ? size / 1024 / 1024 <= 1
          : size / 1024 / 1024 <= 5;
      if (!isLt1M) {
        if (fileType === 'image') Toast.info(t('img-limit-size'));
        else Toast.info(t('video-limit-size'));
        return false;
      }
      return isValidType && isLt1M;
    };

    const customRequest = async (option, loca, fileType) => {
      let f = new FormData();
      f.set('file', option.file);
      const uid = option.file.uid;
      try {
        const res = await postConfigUploadImg(uid, f);
        if (res?.statusText === 'OK') {
          this.setState({
            imgId: uid,
          });
          const imgRes = await fetchCompanyProfile();
          if (imgRes?.data?.result?.successful) {
            const { images } = imgRes?.data?.company;
            let currentImg = images?.find((each) => each.name === uid);
            // currentImg.url = currentImg.url;
            let path = [];
            if (loca === 'left') {
              path.push('horizontalData');
            } else {
              path.push('verticalityData');
            }
            if (fileType === 'image') {
              path.push('imageList');
            } else {
              path.push('videoList');
            }
            _.update(screenSaverTempData, path, (list) => {
              // 如果目标路径为空，则初始化为空数组再进行 push
              if (!Array.isArray(list)) list = [];
              list.push(currentImg); // 推入新的文件对象
              return list;
            });
            this.setState({
              screenSaverData: screenSaverTempData,
            });
          }
          option.onSuccess();
          return;
        }
        option.onError();
      } catch (e) {
        option.onError();
      }
    };

    const handleChangeImg = async (info, loca, fileType) => {
      if (info.file.status === 'removed') {
        let path = [];
        if (loca === 'left') {
          path.push('horizontalData');
        } else {
          path.push('verticalityData');
        }
        if (fileType === 'image') {
          path.push('imageList');
        } else {
          path.push('videoList');
        }
        _.set(screenSaverTempData, path, info.fileList);
        this.setState({
          screenSaverData: screenSaverTempData,
        });
      }
      if (info.file.status === 'error') {
        Toast.info(t('upload-error'));
      }
    };

    const handleView = (file) => {};

    const handleDelete = (loca, index) => {
      let path = [];
      if (loca === 'left') {
        path.push('horizontalData');
      } else {
        path.push('verticalityData');
      }
      path.push('imageList');
      _.update(screenSaverTempData, path, (list) => {
        // 如果目标路径为空，则初始化为空数组再进行 push
        if (Array.isArray(list)) {
          list.splice(index, 1);
        }
        return list;
      });
      this.setState({
        screenSaverData: screenSaverTempData,
      });
    };
    // 自定义缩略图的渲染逻辑
    const customThumbnail = (file, loca, fileType, index) => (
      <div>
        <img
          src={`${IMG_HOST}/${file.url}`}
          className={styles[loca === 'left' ? 'defaultImage' : 'defaultImageR']}
          style={{ width: '100%', height: '100%' }}
        />
        <div className={styles.op}>
          {/* <Button
            shape="circle"
            onClick={() => handleView(file)}
            icon={<EyeOutlined />}
          /> */}
          <Button
            shape="circle"
            onClick={() => handleDelete(loca, index)}
            icon={<DeleteOutlined />}
            danger
          />
        </div>
      </div>
    );

    const showHomePage = [
      { label: t('display-home-page'), value: true },
      { label: t('undisplay-home-page'), value: false },
    ];
    const hideLocalFields =
      screenSaverTempData.dataSource === SCREENSAVER_DATA_SOURCE.CLOUD &&
      cloudLayoutEffective === true;

    return (
      <React.Fragment>
        <div className={styles.screenSaver}>
          <ConfigHeader headTitle={t('screen-saver')} />
          <div className={styles.boxContent}>
            <Box
              display="flex"
              alignItems="center"
              justifyContent="space-between"
              flexWrap="wrap"
              mb={3}
            >
              <Box display="flex" alignItems="center" flexWrap="wrap">
                <Typography variant="subtitle1" style={{ fontSize: '2.8rem' }}>
                  {t('open-screen')}
                </Typography>
                <Box display="flex" alignItems="center" ml={2}>
                  <Typography
                    variant="subtitle1"
                    style={{ marginRight: '1rem', fontSize: '2.8rem' }}
                  >
                    {t('config-close')}
                  </Typography>
                  <Switch
                    checked={screenSaverTempData.status}
                    onChange={(e) => handleSetValue('status', e.target.checked)}
                    color="primary"
                  />
                  <Typography
                    variant="subtitle1"
                    style={{ marginLeft: '1rem', fontSize: '2.8rem' }}
                  >
                    {t('config-open')}
                  </Typography>
                </Box>
              </Box>
              <Box
                display="flex"
                alignItems="center"
                flexWrap="wrap"
                style={{ marginTop: '0.8rem' }}
              >
                <Typography
                  variant="subtitle1"
                  style={{ marginRight: '1.6rem', fontSize: '2.8rem' }}
                >
                  {t('screen-saver-data-source')}
                </Typography>
                <Radio.Group
                  onChange={(e) => handleSetValue('dataSource', e.target.value)}
                  value={
                    screenSaverTempData.dataSource ||
                    SCREENSAVER_DATA_SOURCE.CLOUD
                  }
                >
                  <Radio
                    value={SCREENSAVER_DATA_SOURCE.LOCAL}
                    style={{ fontSize: '2rem' }}
                  >
                    {t('screen-saver-data-source-local')}
                  </Radio>
                  <Radio
                    value={SCREENSAVER_DATA_SOURCE.CLOUD}
                    style={{ fontSize: '2rem' }}
                  >
                    {t('screen-saver-data-source-cloud')}
                  </Radio>
                </Radio.Group>
              </Box>
            </Box>
            {!hideLocalFields && (
              <Box
                display="flex"
                flexDirection="row"
                alignItems="center"
                justifyContent="start"
                flexWrap="wrap"
                p={3}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  margin: '0 auto',
                }}
              >
                {screenSaverTempData.status && (
                  <Box
                    display="flex"
                    alignItems="center"
                    mb={2}
                    style={{
                      marginRight: '2rem',
                    }}
                  >
                    <TextField
                      select
                      label={t('screen-show-home')}
                      variant="outlined"
                      size="medium"
                      InputLabelProps={{
                        shrink: true,
                        style: { fontSize: '2.8rem' },
                      }}
                      InputProps={{
                        style: { fontSize: '2.8rem', height: '15rem' }, // 设置输入框字体大小
                      }}
                      value={screenSaverTempData.showHomePage}
                      style={{ width: '30rem' }}
                      onChange={(e) =>
                        handleSetValue('showHomePage', e.target.value)
                      }
                    >
                      {showHomePage.map((option) => (
                        <MenuItem
                          key={option.label}
                          value={option.value}
                          style={{ fontSize: '1.8rem' }}
                        >
                          {option.label}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Box>
                )}
                <Box
                  display="flex"
                  alignItems="center"
                  mb={2}
                  style={{
                    marginRight: '2rem',
                  }}
                >
                  <TextField
                    type="number"
                    value={screenSaverTempData.delayTime}
                    onChange={(e) => {
                      if (screenSaverTempData.showHomePage) {
                        handleSetValue('delayTime', e.target.value);
                      }
                    }}
                    label={t('in-screen-time')}
                    variant="outlined"
                    size="medium"
                    helperText={
                      !screenSaverTempData.showHomePage &&
                      t('delay-time-disabled-tip')
                    }
                    FormHelperTextProps={{ style: { fontSize: '1.8rem' } }}
                    disabled={!screenSaverTempData.showHomePage}
                    InputLabelProps={{
                      shrink: true,
                      style: {
                        fontSize: '2.8rem',
                        color: !screenSaverTempData.showHomePage
                          ? '#999'
                          : undefined,
                      },
                    }}
                    InputProps={{
                      style: {
                        fontSize: '2.8rem',
                        height: '15rem',
                        backgroundColor: !screenSaverTempData.showHomePage
                          ? 'var(--background-grey)'
                          : undefined,
                      }, // 设置输入框字体大小
                      inputProps: { min: 0 }, // 设置最小值为 0
                    }}
                    style={{ width: '30rem' }}
                  />
                  <Typography
                    variant="subtitle1"
                    style={{
                      fontSize: '2.8rem',
                      color: !screenSaverTempData.showHomePage
                        ? '#999'
                        : undefined,
                    }}
                  >
                    {t('minute')}
                  </Typography>
                </Box>
                <Box
                  display="flex"
                  alignItems="center"
                  mb={2}
                  style={{
                    marginRight: '2rem',
                  }}
                >
                  <TextField
                    select
                    label={t('image-animation')}
                    value={screenSaverTempData.imageAnimation}
                    onChange={(e) =>
                      handleSetValue('imageAnimation', e.target.value)
                    }
                    variant="outlined"
                    size="medium"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '2.8rem' },
                    }}
                    InputProps={{
                      style: { fontSize: '2.8rem', height: '15rem' }, // 设置输入框字体大小
                      inputProps: { min: 0 }, // 设置最小值为 0
                    }}
                    style={{ width: '30rem', marginRight: '10px' }}
                  >
                    {transitionEffects.map((effect) => (
                      <MenuItem
                        key={effect.value}
                        value={effect.value}
                        style={{ fontSize: '1.8rem' }}
                      >
                        {effect.label}
                      </MenuItem>
                    ))}
                  </TextField>
                </Box>

                <Box display="flex" alignItems="center" mb={2}>
                  <TextField
                    type="number"
                    label={t('image-swipertime')}
                    variant="outlined"
                    size="medium"
                    InputLabelProps={{
                      shrink: true,
                      style: { fontSize: '2.8rem' },
                    }}
                    InputProps={{
                      style: { fontSize: '2.8rem', height: '15rem' }, // 设置输入框字体大小
                      inputProps: { min: 0 }, // 设置最小值为 0
                    }}
                    value={screenSaverTempData.swiperTime}
                    onChange={(e) =>
                      handleSetValue('swiperTime', e.target.value)
                    }
                    style={{ width: '30rem' }}
                  />
                  <Typography
                    variant="subtitle1"
                    style={{ fontSize: '2.8rem' }}
                  >
                    {t('minute')}
                  </Typography>
                </Box>
              </Box>
            )}
            {hideLocalFields && (
              <Box
                p={4}
                mb={3}
                style={{
                  border: '1px solid #ccc',
                  borderRadius: '8px',
                  margin: '0 auto',
                }}
              >
                <Typography variant="body1" style={{ fontSize: '2.6rem' }}>
                  {t('screen-saver-cloud-only-hint')}
                </Typography>
              </Box>
            )}
            {!hideLocalFields && (
              <div className={styles.fileContent}>
                <div className={styles.side}>
                  <div className={styles.title}>{t('portrait')}</div>
                  <Radio.Group
                    onChange={(e) =>
                      handleSetValue('horizontalData.type', e.target.value)
                    }
                    value={screenSaverTempData.horizontalData.type}
                  >
                    {radioGroup.map((effect) => (
                      <Radio
                        key={effect.value}
                        value={effect.value}
                        style={{ fontSize: '2rem' }}
                      >
                        {effect.label}
                      </Radio>
                    ))}
                  </Radio.Group>
                  <div className={styles.leftScroll}>
                    {screenSaverTempData.horizontalData.type === 'image' ? (
                      <div className={styles.horizontalScrollRow}>
                        {screenSaverTempData.horizontalData.imageList.length >
                        0 ? (
                          screenSaverTempData.horizontalData.imageList.map(
                            (file, index) => (
                              <div key={file.uid} style={{ margin: 5 }}>
                                {file.status === 'uploading'
                                  ? '<Icon type="loading" />'
                                  : customThumbnail(
                                      file,
                                      'left',
                                      'image',
                                      index
                                    )}
                              </div>
                            )
                          )
                        ) : (
                          <div style={{ margin: 5 }}>
                            <img
                              className={styles.defaultImage}
                              src={defaultVImage}
                              alt="默认图"
                            />
                          </div>
                        )}
                        <Upload
                          name="avatar"
                          listType="picture-card"
                          className="avatar-uploader"
                          showUploadList={false}
                          preview={false}
                          fileList={
                            screenSaverTempData.horizontalData.imageList
                          }
                          beforeUpload={(e) =>
                            beforeUploadImg(e, 'left', 'image')
                          }
                          onChange={(e) => handleChangeImg(e, 'left', 'image')}
                          customRequest={(e) =>
                            customRequest(e, 'left', 'image')
                          }
                        >
                          +
                        </Upload>
                      </div>
                    ) : (
                      <Upload
                        name="avatar"
                        listType="picture-card"
                        className="avatar-uploader"
                        showUploadList={{ showPreviewIcon: false }}
                        preview={false}
                        fileList={screenSaverTempData.horizontalData.videoList}
                        beforeUpload={(e) =>
                          beforeUploadImg(e, 'left', 'video')
                        }
                        onChange={(e) => handleChangeImg(e, 'left', 'video')}
                        customRequest={(e) => customRequest(e, 'left', 'video')}
                      >
                        {screenSaverTempData.horizontalData.videoList.length >=
                        1
                          ? null
                          : '+'}
                      </Upload>
                    )}
                    <div
                      className={styles.middleSize}
                      dangerouslySetInnerHTML={{ __html: tips('left') }}
                    ></div>
                  </div>
                </div>
                <div className={styles.side}>
                  <div className={styles.title}>{t('landscape')}</div>
                  <Radio.Group
                    onChange={(e) =>
                      handleSetValue('verticalityData.type', e.target.value)
                    }
                    value={screenSaverTempData.verticalityData.type}
                  >
                    {radioGroup.map((effect) => (
                      <Radio
                        key={effect.value}
                        value={effect.value}
                        style={{ fontSize: '2rem' }}
                      >
                        {effect.label}
                      </Radio>
                    ))}
                  </Radio.Group>
                  <div className={styles.leftScroll}>
                    {screenSaverTempData.verticalityData.type === 'image' ? (
                      <div className={styles.horizontalScrollRow}>
                        {screenSaverTempData.verticalityData.imageList.length >
                        0 ? (
                          screenSaverTempData.verticalityData.imageList.map(
                            (file, index) => (
                              <div key={file.uid} style={{ margin: 5 }}>
                                {file.status === 'uploading'
                                  ? '<Icon type="loading" />'
                                  : customThumbnail(
                                      file,
                                      'right',
                                      'image',
                                      index
                                    )}
                              </div>
                            )
                          )
                        ) : (
                          <div style={{ margin: 5 }}>
                            <img
                              className={styles.defaultImageR}
                              src={defaultHImage}
                              alt="默认图"
                            />
                          </div>
                        )}
                        <Upload
                          name="avatar"
                          listType="picture-card"
                          className="avatar-uploader"
                          showUploadList={false}
                          preview={false}
                          fileList={
                            screenSaverTempData.verticalityData.imageList
                          }
                          beforeUpload={(e) =>
                            beforeUploadImg(e, 'right', 'image')
                          }
                          onChange={(e) => handleChangeImg(e, 'right', 'image')}
                          customRequest={(e) =>
                            customRequest(e, 'right', 'image')
                          }
                        >
                          +
                        </Upload>
                      </div>
                    ) : (
                      <Upload
                        name="avatar"
                        listType="picture-card"
                        className="avatar-uploader"
                        preview={false}
                        showUploadList={{ showPreviewIcon: false }}
                        fileList={screenSaverTempData.verticalityData.videoList}
                        beforeUpload={(e) =>
                          beforeUploadImg(e, 'right', 'video')
                        }
                        onChange={(e) => handleChangeImg(e, 'right', 'video')}
                        customRequest={(e) =>
                          customRequest(e, 'right', 'video')
                        }
                      >
                        {screenSaverTempData.verticalityData.videoList.length >=
                        1
                          ? null
                          : '+'}
                      </Upload>
                    )}
                    <div
                      className={styles.middleSize}
                      dangerouslySetInnerHTML={{ __html: tips('right') }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          <ConfigFooter handleSave={handleSave} />
        </div>

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={open}
          message={msg}
          key={'topcenter'}
        />

        {errorApiShow ? (
          <Alert variant="filled" severity="error">
            {errorApiMsg}
          </Alert>
        ) : null}
      </React.Fragment>
    );
  }
}

export default withRouter(withTranslation()(ScreenSaver));
