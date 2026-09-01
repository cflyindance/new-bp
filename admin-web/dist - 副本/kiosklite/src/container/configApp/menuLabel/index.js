import React, { useEffect, useState } from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import styles from './menuLabel.module.scss';
import ConfigHeader from '../../../component/configHeader';
import ConfigFooter from '../../../component/configFooter';
import { getAllKioskMenu } from '@/api/kioskConfigApi';
import menuUtils from '@/utils/getKioskMenu';
import { selfConfigList } from '@/constants/selfConfig';

import { on, off, getCookie, compare } from '@/utils';

import {
  postMarginappConfig,
  getMarginappFetchKioskConfig,
  postConfigUploadImg,
  fetchCompanyProfile,
} from '@/api/kioskConfigApi';

const { resolveKioskMenu } = menuUtils;
import _ from 'lodash';
import { Button, Modal, Form, Input, TreeSelect, Select, Upload } from 'antd';

import Toast from '@/component/toast';
import IMG_HOST from '@/utils/getImageHost';
import { transformTreeDishIds } from '@/utils/transformTreeMenu';

function generateId() {
  return 'id_' + Math.random().toString(36).substr(2, 9);
}

const MenuLabel = (props) => {
  const {
    t,
    i18n: { language },
  } = props;
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [kioskMenu, setKioskMenu] = useState([]);
  const [kioskConfig, setKioskConfig] = useState({});
  const [configList, setConfigList] = useState([]);
  const [labelList, setLabelList] = useState([]);

  const [label, setLabel] = useState({
    labelName: '',
    labelType: 'text',
    dish: [],
    labelImg: [],
  });

  // 获取菜单 dish
  const handleGetMenu = async () => {
    const res = await getAllKioskMenu();
    if (res?.data?.data?.menus) {
      const kioskMenu = res?.data?.data?.menus?.[0]?.menuGroups || [];
      const comboMenu =
        res?.data?.data?.menus?.[0]?.comboSectionSaleItemDTOList || [];
      const validMenu = resolveKioskMenu(kioskMenu, comboMenu, language);
      setKioskMenu(validMenu);
    }
  };

  const initConfigList = (params) => {
    return new Promise((resolve, reject) => {
      getMarginappFetchKioskConfig(params)
        .then((res) => {
          if (res.data.result.successful) {
            let list = res.data.marginAppConfigTypes;
            let obj = list?.find((l) => l.product == 'KIOSKLITE');
            // 数据库有值
            if (obj && obj.data) {
              let arr = JSON.parse(obj.data);
              // 过滤无效值
              let DBconfigList = arr?.configList?.filter((item) => {
                return item.id;
              });
              if (DBconfigList) {
                // 本地js和数据库对比
                let defectList = [];
                selfConfigList.configList.forEach((item) => {
                  let incld = DBconfigList?.find((c) => c.id == item.id);
                  if (!incld) {
                    defectList.push(item);
                  }
                });
                const hasInvalidConfigItems =
                  (arr?.configList?.length || 0) !== DBconfigList.length;
                const needsSaveConfig =
                  defectList.length > 0 || hasInvalidConfigItems;

                if (needsSaveConfig) {
                  DBconfigList = DBconfigList.concat(defectList);
                  DBconfigList.sort(compare('id'));
                  arr.configList = DBconfigList;
                  postMarginappConfig(JSON.stringify(arr), params).then(() => {
                    initConfigList(params);
                  });
                }
              }

              let index = DBconfigList?.findIndex((item) => item.id === 38);
              if (index !== -1) {
                let label = DBconfigList[index].value;
                if (Array.isArray(label)) {
                  setLabelList(label);
                }
                setConfigList(DBconfigList);
              }
              setKioskConfig(arr);
            } else {
              // 数据库无值，使用本地js并存数据库 ,注意error：会报空指针异常
              postMarginappConfig(JSON.stringify(selfConfigList), params).then(
                (pres) => {
                  initConfigList(params);
                }
              );
            }
          }
          off(window, 'message', getData);
        })
        .catch((err) => {
          off(window, 'message', getData);
        });
    });
  };

  const getData = (event) => {
    if (event.data.type == 'sessionKey') {
      // console.log('event.data.data',event.data.data);

      initConfigList(event.data.data);
    }
    if (process.env.NODE_ENV === 'development') {
      // console.log('NODE_ENV',getCookie('sessionKey'));

      initConfigList(getCookie('sessionKey'));
    }
  };

  useEffect(() => {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', getData);
    handleGetMenu();
    return () => {
      off(window, 'message', saveData);
      off(window, 'message', getData);
    };
  }, []);

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

  const saveData = (event) => {
    if (event.data.type == 'sessionKey') {
      const newConfigList = configList.map((item) => {
        return item.id === 38
          ? { ...item, value: labelList, key: 'menu-label' }
          : item;
      });

      const params = {
        ...kioskConfig,
        configList: newConfigList,
      };
      postMarginappConfig(JSON.stringify(params), event.data.data)
        .then((res) => {
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

  const onFinish = (values) => {
    function updateArrayItem(arr, index, newValue) {
      if (index >= 0 && index < arr.length) {
        arr[index] = newValue;
        return arr;
      } else {
        console.error('Index out of bounds!');
      }
    }
    if (label.id) {
      const index = labelList?.findIndex((i) => i.id === label.id);
      const res = updateArrayItem(labelList, index, label);
      setLabelList(res);
    } else {
      labelList.push({
        id: generateId(),
        labelName: values.labelName,
        labelType: values.labelType,
        labelImg: label.labelImg,
        dish: label.dish,
      });
    }

    setLabel({
      labelName: '',
      labelType: 'text',
      dish: [],
      labelImg: [],
    });
    setIsModalOpen(false);
  };

  //上传图片前检查
  const beforeUploadImg = (file) => {
    const { type, size } = file;
    const isValidType = type?.indexOf(fileType) === 0;
    if (!isValidType) {
      Toast.info(t('illegal_input'));
      return false;
    }
    const isLt1M = size / 1024 / 1024 <= 1;
    if (!isLt1M) {
      Toast.info(t('img-limit-size'));
      return false;
    }
    return isValidType && isLt1M;
  };

  //上传图片
  const handleChangeImg = async (info) => {
    let f = new FormData();
    f.set('file', info.file);
    const uid = info.file.uid;
    // const pathName = `icon/${uid}`
    const res = await postConfigUploadImg(uid, f);
    if (res?.statusText === 'OK') {
      const imgRes = await fetchCompanyProfile();
      if (imgRes?.data?.result?.successful) {
        const { images } = imgRes?.data?.company;
        let currentImg = images?.find((each) => each.name === uid);
        setLabel({
          ...label,
          labelImg: [{ ...currentImg, url: `../${currentImg.url}` }],
        });
      }
      return;
    }

    if (info.file.status === 'error') {
      Toast.info(t('upload-error'));
    }
  };

  const handleDelete = (params) => {
    // console.log('delete', params);
    const list = labelList?.filter((i) => i?.id !== params.id);
    setLabelList(list);
  };

  const handleEdit = (params) => {
    const res = labelList?.find((i) => i?.id === params.id);
    setLabel(res);
    setIsModalOpen(true);
  };

  return (
    <>
      <div className={styles.MenuLabel}>
        <ConfigHeader headTitle={t('menu-label')} />
        <div className={styles.boxContent}>
          <Button
            className={styles.buildLabel}
            onClick={() => {
              setIsModalOpen(true);
            }}
          >
            {t('build-label')}
          </Button>
          {labelList.length <= 0 && (
            <div className={styles.noLabel}>{t('no-label')}</div>
          )}
          {labelList.length > 0 && (
            <div className={styles.labelList}>
              {labelList.map((item, index) => {
                return (
                  <div
                    className={styles.labelItem}
                    key={item.labelName + index}
                  >
                    <div className={styles.labelItemName}>
                      <div>{item.labelName}</div>
                      {item.labelType === 'img' && (
                        <img
                          className={styles.img}
                          src={`${item.labelImg[0]?.url}`}
                          alt="默认图"
                        />
                      )}
                    </div>
                    <div className={styles.labelItemBtn}>
                      <div
                        onClick={() => {
                          handleEdit(item);
                        }}
                        className={styles.btn}
                      >
                        {t('operate-edit')}
                      </div>
                      <div
                        onClick={() => {
                          handleDelete(item);
                        }}
                        className={styles.btn}
                      >
                        {t('operate-remove')}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
        <ConfigFooter handleSave={handleSave} />
      </div>
      <Modal
        width={600}
        destroyOnClose
        open={isModalOpen}
        closable={false}
        footer={null}
      >
        <Form
          onFinish={onFinish}
          // onFinishFailed={onFinishFailed}
          labelCol={{ span: 5 }}
          wrapperCol={{ span: 18 }}
          style={{ maxWidth: 600 }}
        >
          <Form.Item
            label={t('label_name')}
            // label="标签名称"
            initialValue={label.labelName}
            name="labelName"
            rules={[
              { required: true, message: 'Please input your label name!' },
            ]}
          >
            <Input
              value={label.labelName}
              onChange={(e) => {
                // console.log(e);
                setLabel({ ...label, labelName: e.target.value });
              }}
            />
          </Form.Item>

          <Form.Item
            label={t('label_type')}
            // label="标签类型"
            initialValue={label.labelType}
            name="labelType"
            rules={[
              { required: true, message: 'Please select your label type!' },
            ]}
          >
            <Select
              value={label.labelType}
              // defaultValue={label.labelType}
              style={{ width: 120 }}
              onChange={(val) => {
                setLabel({ ...label, labelType: val });
              }}
              getPopupContainer={(node) => node.parentNode}
              options={[
                { value: 'text', label: t('text') },
                { value: 'img', label: t('img') },
              ]}
            />
          </Form.Item>
          {label.labelType === 'img' && (
            <Form.Item
              label={t('select_img')}
              name="labelImg"
              initialValue={label.labelImg}
              rules={[
                {
                  required: label.labelType === 'img',
                  message: 'Please upload image!',
                },
              ]}
            >
              <Upload
                name="avatar"
                listType="picture-card"
                className="avatar-uploader"
                maxCount={1}
                showUploadList={{ showRemoveIcon: false }}
                fileList={label.labelImg}
                beforeUpload={(e) => beforeUploadImg(e)}
                onChange={(e) => handleChangeImg(e)}
              >
                +
              </Upload>
            </Form.Item>
          )}
          <Form.Item
            initialValue={label.dish}
            label={t('label_dish')}
            rules={[{ required: true, message: 'Please select a valid dish!' }]}
          >
            <TreeSelect
              maxTagCount={10}
              allowClear
              treeCheckable
              value={transformTreeDishIds(label.dish)}
              onChange={(val) => {
                setLabel({ ...label, dish: transformTreeDishIds(val, true) });
              }}
              getPopupContainer={(node) => node.parentNode}
              fieldNames={{
                label: 'name',
                value: '_id',
                children: 'children',
              }}
              treeData={kioskMenu}
              listHeight={256}
              treeNodeFilterProp="name"
            />
          </Form.Item>
          <div
            className={styles.clearBtn}
            onClick={() => {
              setLabel({ ...label, dish: [] });
            }}
          >
            clear
          </div>
          <Form.Item label={null}>
            <Button
              onClick={() => {
                setLabel({
                  labelName: '',
                  labelType: 'text',
                  dish: [],
                  labelImg: [],
                });
                setIsModalOpen(false);
              }}
              style={{ marginLeft: '100px', width: '80px' }}
            >
              {t('cancel')}
            </Button>
            <Button
              type="primary"
              htmlType="submit"
              style={{ marginLeft: '20px', width: '80px' }}
            >
              {t('ok')}
            </Button>
          </Form.Item>
        </Form>
      </Modal>
    </>
  );
};

export default withRouter(withTranslation()(MenuLabel));
