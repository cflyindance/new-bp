import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from '../generalSetting.module.scss';
import Snackbar from '@material-ui/core/Snackbar';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Toast from '../../../../component/toast';
import dishHeng from '@/assets/images/dish-h.png';
import dishShu from '@/assets/images/dish-v.jpg';
import {
  fetchCompanyProfile,
  postConfigUploadImg,
  postConfigDeleteImg,
} from '@/api/kioskConfigApi';
import { on, off, isImage } from '@/utils';

class CoverPictureSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoad: false,
      msg: '',
      open: false,
      kioskPicList: [
        {
          type: 'kiosk',
          title: '',
          img: '',
          fileObj: null,
        },
        {
          type: 'kiosklite',
          title: '',
          img: '',
          fileObj: null,
        },
      ],
    };
  }

  handleSelectPic = (id) => {
    document.getElementById(id)?.click();
  };

  // 选择并上传
  handleFileChange = (event, i) => {
    if (event.target.files[0]) {
      let type = event.target.files[0].type;
      if (isImage(type)) {
        let f = new FormData();
        f.set('file', event.target.files[0]);
        let path = this.state.kioskPicList[i].type;
        postConfigUploadImg(path, f).then(() => {
          // value置空，才能触发onchange
          let dom = document.getElementById('input_' + i);
          dom && (dom.value = '');
          this.initProfile();
          this.setState({
            msg: 'SUCCESS',
            open: true,
          });
          setTimeout(() => {
            this.setState({
              msg: '',
              open: false,
            });
          }, 800);
        });
      } else {
        const { t } = this.props;
        Toast.info(t('no-pic'), 1000);
      }
    }
  };

  // 删除
  handleDeleteImg = (type, i) => {
    let kioskPicList = this.state.kioskPicList;
    if (kioskPicList[i].img) {
      postConfigDeleteImg(type).then(() => {
        this.initProfile();
        this.setState({
          msg: 'SUCCESS',
          open: true,
        });
        setTimeout(() => {
          this.setState({
            msg: '',
            open: false,
          });
        }, 800);
      });
    }
  };

  initProfile = () => {
    const { t } = this.props;
    let picName = t('cover-pic');
    let portrait = t('portrait');
    let landscape = t('landscape');

    let originalData = [
      {
        type: 'kiosk',
        title: portrait + ' ' + picName,
        img: '',
        fileObj: null,
      },
      {
        type: 'kiosklite',
        title: landscape + ' ' + picName,
        img: '',
        fileObj: null,
      },
    ];
    fetchCompanyProfile().then((res) => {
      if (res.data.result.successful) {
        if (res.data.company.images?.length) {
          let imagesList = res.data.company.images;
          originalData.forEach((k) => {
            let r = imagesList.find((m) => m.name == k.type);
            if (r) {
              k.img = '../' + r.url;
            }
          });
        }
      }
      this.setState({
        kioskPicList: originalData,
      });
    });
  };

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      if (event.data.data) {
        this.setState({
          isLoad: true,
        });
        this.initProfile();
        let picBoxDom = this.picBoxDom;
        let wBox = picBoxDom.offsetWidth;
        let wItem = 0;
        let childrenList = picBoxDom.childNodes;
        for (let i = 0; i < childrenList.length; i++) {
          wItem += childrenList[i].offsetWidth;
        }
        if (wBox / wItem < 1) {
          // 缩放比例（<1）
          let r = String(wBox / wItem).slice(0, 4);
          this.picBoxDom.style.transform = `scale(${r})`;
        }
      }
    }
  };

  componentDidMount() {
    window.parent.postMessage({ type: 'getSessionKey' }, '*');
    on(window, 'message', this.getData);
  }

  componentWillUnmount() {
    off(window, 'message', this.getData);
  }

  render() {
    const { t } = this.props;
    const { isLoad, kioskPicList, open, msg } = this.state;
    let imgPath = '';

    return (
      <div className={styles.picBox} ref={(el) => (this.picBoxDom = el)}>
        {isLoad
          ? kioskPicList.map((item, idx) => {
              if (item.img) {
                imgPath = item.img;
              } else {
                if (item.type == 'kiosk') {
                  imgPath = dishShu;
                } else if (item.type == 'kiosklite') {
                  imgPath = dishHeng;
                }
              }

              return (
                <div className={styles.picItem} key={idx}>
                  <div className={styles.picItemTitle}>{item.title}</div>
                  <div className={styles.picItemBox}>
                    <div className={[styles.pic, styles['pic' + idx]].join(' ')}>
                      <img src={imgPath} />
                    </div>
                    <div className={styles.fileBox}>
                      <div className={styles.file}>
                        <div
                          className={styles.fileBtn}
                          onClick={() => {
                            this.handleSelectPic('input_' + idx);
                          }}
                        >
                          <CloudUploadIcon className={styles.cloudUpload} />
                          <span>{t('upload-image')}</span>
                        </div>
                        <div className={styles.fileName}>{item.fileObj?.name}</div>
                      </div>
                      <input
                        style={{
                          display: 'none',
                        }}
                        id={'input_' + idx}
                        accept="image/*"
                        type="file"
                        name="file"
                        onChange={(event) => {
                          this.handleFileChange(event, idx);
                        }}
                      />
                      <div
                        className={styles.btnDelete}
                        onClick={() => {
                          this.handleDeleteImg(item.type, idx);
                        }}
                      >
                        {t('delete-image')}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          : null}

        <Snackbar
          anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
          open={open}
          message={msg}
          key={'topcenter'}
        />
      </div>
    );
  }
}

export default withTranslation()(CoverPictureSetting);
