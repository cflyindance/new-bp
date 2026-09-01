import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from '../generalSetting.module.scss';
import Snackbar from '@material-ui/core/Snackbar';
import CloudUploadIcon from '@material-ui/icons/CloudUpload';
import Toast from '@/component/toast';
import {
  fetchCompanyProfile,
  postConfigUploadImg,
  postConfigDeleteImg,
} from '@/api/kioskConfigApi';
import { on, off, isImage } from '@/utils';

class BannerSetting extends Component {
  constructor(props) {
    super(props);
    this.state = {
      isLoad: false,
      msg: '',
      open: false,
      kioskBannerList: [
        {
          type: 'banner',
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
        let path = this.state.kioskBannerList[i].type;
        postConfigUploadImg(path, f).then(() => {
          // value置空，才能触发onchange
          let dom = document.getElementById('input_' + i);
          dom && (dom.value = '');
          this.initBanner();
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
    let kioskBannerList = this.state.kioskBannerList;
    if (kioskBannerList[i].img) {
      postConfigDeleteImg(type).then(() => {
        this.initBanner();
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

  initBanner = () => {
    const { t } = this.props;

    let originalData = [
      {
        type: 'banner',
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
        kioskBannerList: originalData,
      });
    });
  };

  getData = (event) => {
    if (event.data.type == 'sessionKey') {
      if (event.data.data) {
        this.setState({
          isLoad: true,
        });
        this.initBanner();
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
    const { isLoad, kioskBannerList, open, msg } = this.state;
    let imgPath = '';

    return (
      <div className={styles.picBox}>
        {isLoad
          ? kioskBannerList.map((item, idx) => {
              if (item.img) {
                imgPath = item.img;
              } else {
                if (item.type == 'banner') {
                  imgPath = '';
                }
              }

              return (
                <div className={styles.picItem} key={idx}>
                  <div className={styles.picItemBox}>
                    <div className={[styles.pic, styles.picBanner, styles['pic' + idx]].join(' ')}>
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
                  <div className={styles.bannerPicTip}>
                    <div>
                      {t('pic-dimensions', { size: '500*500px' })} {t('pic-shape')}
                    </div>
                    <div>{t('pic-tip')}</div>
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

export default withTranslation()(BannerSetting);
