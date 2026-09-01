import React, { useState, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import styles from './loginGuide.module.scss';
import Alert from '@material-ui/lab/Alert';
import ConfigHeader from '@/component/configHeader';
import ConfigFooter from '@/component/configFooter';
import { getCookie, off, on, isImage } from '@/utils';
import { useMount, useUnmount } from 'ahooks';
import {
  postMarginappConfig,
  getMarginappFetchKioskConfig,
  postConfigUploadImg,
  fetchCompanyProfile,
} from '@/api/kioskConfigApi';
import { requestAllSysConfig } from '@/utils/allSysConfigHelper';
import checkCRMStatus from '@/utils/checkCRMStatus';
import { selfConfigList } from '@/constants/selfConfig';
import IMG_HOST from '@/utils/getImageHost';
import Toast from '@/component/toast';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import { Switch, Upload } from 'antd';
import bannerh from '@/assets/images/login_banner_h.png';
import bannerv from '@/assets/images/login_banner_v.png';
import dialogh from '@/assets/images/login_dialog_h.png';
import dialogv from '@/assets/images/login_dialog_v.png';

const LoginGuide = () => {
  const { t } = useTranslation();
  const [errorApiShow, setErrorApiShow] = useState(false);
  const [errorApiMsg, setErrorApiMsg] = useState('');
  const [selfConfigListBase, setSelfConfigListBase] = useState([]);
  const [allSysConfig, setAllSysConfig] = useState({});
  const [loginGuideInfo, setLoginGuideInfo] = useState({
    dialog: {
      //是否开启引导广告对话框
      status: true,
      horizontalImg: '',
      verticalImg: '',
    },
    banner: {
      //是否开启引导广告
      status: true,
      horizontalImg: '',
      verticalImg: '',
    },
  });
  const [timer, setTimer] = useState(null);
  const imgMap = {
    dialogv,
    dialogh,
    bannerv,
    bannerh,
  };

  // 获取system配置信息
  const handleGetSysConfig = async () => {
    const result = await requestAllSysConfig();
    if (result?.config && Object.keys(result.config).length) {
      setAllSysConfig(result.config);
      return !checkCRMStatus(result.config);
    }
    return false;
  };

  // crm状态
  const isCRMEnable = useMemo(() => {
    if (allSysConfig && Object.keys(allSysConfig).length) {
      return !checkCRMStatus(allSysConfig);
    }
    return false;
  }, [allSysConfig]);

  const initConfigList = (params, crmEnable) => {
    // 使用传入的 crmEnable 参数，如果没有则使用当前的 isCRMEnable
    const currentCrmEnable = crmEnable !== undefined ? crmEnable : isCRMEnable;

    getMarginappFetchKioskConfig(params)
      .then((res) => {
        if (res?.data?.result?.successful) {
          let list = res.data.marginAppConfigTypes;
          let obj = list?.find((l) => l?.product == 'KIOSKLITE');
          let arr = JSON.parse(obj?.data);
          setSelfConfigListBase(arr);
          if (arr?.configList) {
            // 本地js和数据库对比
            let index = arr.configList?.findIndex((item) => item?.id === 45);

            if (index !== -1) {
              let oriLoginGuideData = arr.configList?.find(
                (item) => item?.id === 45
              )?.value;
              const modifiedLoginGuideData = {};
              for (let i in oriLoginGuideData) {
                if (oriLoginGuideData[i]) {
                  let newStatus = oriLoginGuideData[i].status;
                  // 如果CRM未启用且原状态为true，则设置为false
                  if (!currentCrmEnable && oriLoginGuideData[i].status) {
                    newStatus = false;
                  }
                  modifiedLoginGuideData[i] = {
                    ...oriLoginGuideData[i],
                    status: newStatus,
                  };
                }
              }
              setLoginGuideInfo(modifiedLoginGuideData);
            } else {
              selfConfigList.configList.forEach((item) => {
                if (item.id === 45) {
                  // 根据 crmEnable 调整默认配置中的 status
                  const itemToPush = { ...item };

                  if (itemToPush.value) {
                    const modifiedValue = {};
                    for (let i in itemToPush.value) {
                      if (itemToPush.value[i]) {
                        let newStatus = itemToPush.value[i].status;
                        // 如果CRM未启用且原状态为true，则设置为false
                        if (!currentCrmEnable && itemToPush.value[i].status) {
                          newStatus = false;
                        }
                        modifiedValue[i] = {
                          ...itemToPush.value[i],
                          status: newStatus,
                        };
                      }
                    }
                    itemToPush.value = modifiedValue;
                  }

                  arr.configList.push(itemToPush);
                }
              });
              postMarginappConfig(JSON.stringify(arr), params).then(() => {
                initConfigList(params, isCRMEnable);
              });
            }
          }
        }
        off(window, 'message', getData);
      })
      .catch((err) => {
        showApiModalTip(err?.message);
        off(window, 'message', getData);
      });
  };

  // 接口报错提示
  const showApiModalTip = (errMsg) => {
    // 清除之前的定时器
    if (timer) {
      clearTimeout(timer);
    }

    setErrorApiMsg(errMsg);
    setErrorApiShow(true);

    const newTimer = setTimeout(() => {
      setErrorApiMsg('');
      setErrorApiShow(false);
    }, 2000);

    setTimer(newTimer);
  };

  const getData = async (event) => {
    const crmEnable = await handleGetSysConfig();
    if (event.data.type == 'sessionKey') {
      initConfigList(event.data.data, crmEnable);
    }
    if (process.env.NODE_ENV === 'development') {
      initConfigList(getCookie('sessionKey'), crmEnable);
    }
  };

  const saveData = (event) => {
    if (event.data.type == 'sessionKey') {
      const newConfigList = selfConfigListBase?.configList?.map((item) => {
        return item.id === 45 ? { ...item, value: loginGuideInfo } : item;
      });
      postMarginappConfig(
        JSON.stringify({ ...selfConfigListBase, configList: newConfigList }),
        event.data.data
      )
        .then((res) => {
          initConfigList(event.data.data, isCRMEnable);
          if (res.data.result.successful) {
            Toast.info('SUCCESS!', 2000);
          } else {
            Toast.info('FAILED!', 2000);
          }
          off(window, 'message', saveData);
        })
        .catch(() => {
          off(window, 'message', saveData);
        });
    }
  };

  const handleSave = () => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', saveData);

    // for dev
    if (process.env.NODE_ENV === 'development')
      saveData({
        data: {
          type: 'sessionKey',
          data: getCookie('sessionKey'),
        },
      });
  };

  useMount(() => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', getData);
  });

  useUnmount(() => {
    if (timer) {
      clearTimeout(timer);
    }
    off(window, 'message', getData);
  });

  const handleChangeStatus = (type) => {
    return (checked) => {
      if (!isCRMEnable && checked) {
        // crm没开的 不能打开开关
        return Toast.info(t('notOpenMember'), 2000);
      }
      setLoginGuideInfo({
        ...loginGuideInfo,
        [type]: { status: checked, horizontalImg: '', verticalImg: '' },
      });
    };
  };

  const beforeUploadImg = (file) => {
    const { type, size } = file;
    const isValidType = isImage(type);
    if (!isValidType) {
      Toast.info(t('illegal_input'));
      return false;
    }
    const isLt5M = size / 1024 / 1024 <= 5;
    if (!isLt5M) {
      Toast.info(t('img-max-size', { size: '5M' }));
      return false;
    }
    return isValidType && isLt5M;
  };

  const customRequest = async (option, direcImg, loginType) => {
    let f = new FormData();
    f.set('file', option.file);
    const uid = option.file.uid;
    try {
      const res = await postConfigUploadImg(uid, f);
      if (res?.statusText === 'OK') {
        const imgRes = await fetchCompanyProfile();
        if (imgRes?.data?.result?.successful) {
          const { images } = imgRes?.data?.company;
          let currentImg = images?.find((each) => each.name === uid);
          setLoginGuideInfo({
            ...loginGuideInfo,
            [loginType]: {
              ...loginGuideInfo[loginType],
              [direcImg]: currentImg.url,
            },
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

  // 删除
  const handleDeleteImg = (direcImg, loginType) => {
    setLoginGuideInfo({
      ...loginGuideInfo,
      [loginType]: {
        ...loginGuideInfo[loginType],
        [direcImg]: '',
      },
    });
  };

  // 推荐尺寸和图片格式文案
  const tips = (loginType, direc) => {
    const sizeList = {
      dialogh: '1445*595px',
      dialogv: '857*1043px',
      bannerh: '1838*221px',
      bannerv: '1054*221px',
    };
    return (
      t('pic-dimensions', { size: sizeList[`${loginType}${direc}`] }) +
      '<br/>' +
      t('pic-tip') +
      '<br/>' +
      t('pic-size', { size: '4M' })
    );
  };

  return (
    <>
      <div className={styles.loginGuide}>
        <ConfigHeader headTitle={t('login-guide')} />
        <div className={styles.wrapper}>
          {Object.keys(loginGuideInfo).map((loginType, loginIdx) => {
            return (
              <>
                <div className={styles.picItemTitle} key={`${loginIdx}title`}>
                  <div>
                    <div>{t(`login-guide-${loginType}-title`)}</div>
                    <div>{t(`login-guide-${loginType}-subtitle`)}</div>
                  </div>
                  <div className={styles.switchBox}>
                    <span>{t('config-close')}</span>
                    <Switch
                      className={styles.switch}
                      checked={loginGuideInfo[loginType].status}
                      onChange={handleChangeStatus(loginType)}
                    />
                    <span>{t('config-open')}</span>
                  </div>
                </div>
                {loginGuideInfo[loginType].status && (
                  <div className={styles.picBox} key={loginIdx}>
                    {Object.keys(loginGuideInfo[loginType]).map(
                      (direcImg, idx) => {
                        if (!direcImg.includes('Img')) {
                          return null;
                        }
                        let defaultImgName = `${loginType}${direcImg.slice(0, 1)}`;
                        return (
                          <div className={styles.picItemBox} key={idx}>
                            <div>
                              <div
                                className={styles[`pic${direcImg.slice(0, 1)}`]}
                              >
                                {loginGuideInfo[loginType][direcImg] ? (
                                  <img
                                    src={`${IMG_HOST}/${loginGuideInfo[loginType][direcImg]}`}
                                  />
                                ) : (
                                  <img src={imgMap[defaultImgName]} />
                                )}
                              </div>
                              <div
                                className={styles.picRecommend}
                                dangerouslySetInnerHTML={{
                                  __html: tips(loginType, direcImg.slice(0, 1)),
                                }}
                              ></div>
                            </div>
                            <div className={styles.fileBox}>
                              <div className={styles.file}>
                                <Upload
                                  name={`${loginType}-${direcImg}`}
                                  showUploadList={false}
                                  preview={false}
                                  maxCount={1}
                                  beforeUpload={(e) => beforeUploadImg(e)}
                                  customRequest={(e) =>
                                    customRequest(e, direcImg, loginType)
                                  }
                                >
                                  <div className={styles.fileBtn}>
                                    <CloudUploadIcon
                                      className={styles.cloudUpload}
                                    />
                                    <span>{t('upload-image')}</span>
                                  </div>
                                </Upload>
                              </div>
                              <div
                                className={styles.btnDelete}
                                onClick={() => {
                                  handleDeleteImg(direcImg, loginType);
                                }}
                              >
                                {t('delete-image')}
                              </div>
                            </div>
                          </div>
                        );
                      }
                    )}
                  </div>
                )}
              </>
            );
          })}
        </div>
        <ConfigFooter handleSave={handleSave} />
      </div>

      {errorApiShow ? (
        <Alert variant="filled" severity="error">
          {errorApiMsg}
        </Alert>
      ) : null}
    </>
  );
};

export default LoginGuide;
