import React from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import Dialog from '../dialog';
import MoreTip from '../moreTip';
import Icon from '../icon';
import styles from './lanModal.module.scss';
import { setLanModal, searchItemHandler } from '@/actions';
import { homeHash, systemLanguage } from '@/constants/mockData';
import { on, off } from '@/utils';
import getLanguageBtnDisplayText from '@/utils/getLanguageBtnDisplayText';

class LanModal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      isScroll: false,
      isShowMore: false,
      language: this.props.i18n.language || 'en',
    };
    this.lanDom = React.createRef();
  }

  // dom元素滚动事件
  handleScroll = () => {
    if (!this.state.isScroll) {
      this.setState(
        {
          isScroll: true,
        },
        () => {
          off(this.lanDom.current, 'scroll', this.handleScroll);
        }
      );
    }
  };

  handleClose = () => {
    this.props.setLanModal(false);
  };

  handleChooseLang = (e) => {
    console.log('选中的语言数据：', e);
    const { i18n, selfConfig, searchKeyWord, lanModalFn } = this.props;
    // if (i18n.language !== e) {
    document.documentElement.setAttribute('data-lang', e);
    i18n.changeLanguage(e);
    if (homeHash.includes(window.location.hash)) {
      // 非等位模式跳转后续页面
      !selfConfig?.configMap?.id_13 && lanModalFn();
    } else {
      // 点单页面，切换语言，如果有关键字，则相应去模糊搜索
      if (window.location.hash.indexOf('orderPage') > -1 && searchKeyWord) {
        this.props.searchItemHandler(searchKeyWord);
      }
    }
    this.handleClose();
    // }
  };

  componentDidMount() {
    if (this.lanDom.current) {
      this.setState({
        isShowMore: !!(
          this.lanDom.current.scrollHeight > this.lanDom.current.offsetHeight
        ),
      });
      on(this.lanDom.current, 'scroll', this.handleScroll);
    }
  }

  componentWillUnmount() {
    off(this.lanDom.current, 'scroll', this.handleScroll);
  }

  render() {
    const {
      t,
      // i18n: { language },
      lanModal,
      // lanModalFn,
      selfConfig,
    } = this.props;

    // 配置项-是否等位 (id: 13)
    const isWaitList = selfConfig?.configMap?.id_13;

    // 配置项-语言列表(id: 10)
    const langList = [];
    if (selfConfig?.configMap?.id_10?.length) {
      systemLanguage.forEach((lang) => {
        if (selfConfig.configMap.id_10?.indexOf(lang.code) > -1) {
          langList.push(lang);
        }
      });
    }

    const displayLangs = selfConfig?.configMap?.id_65;
    const titleText = getLanguageBtnDisplayText(
      displayLangs,
      'lanModal_languageChooseLan',
      'languageChooseLan'
    );
    const moreTipText = getLanguageBtnDisplayText(
      displayLangs,
      'lanModal_moreInLanguage',
      'moreInLanguage'
    );
    const isHomeStartBtn =
      homeHash.includes(window.location.hash) && !isWaitList;
    const startBtnText = isHomeStartBtn
      ? getLanguageBtnDisplayText(
          displayLangs,
          'lanModal_startBtn',
          'startOrderInLanguage'
        )
      : getLanguageBtnDisplayText(
          displayLangs,
          'lanModal_confirmInLanguage',
          'confirmInLanguage'
        );

    return (
      <Dialog
        isMountOnBody
        visible={lanModal}
        html={
          <div className={styles.lanModal} onClick={(e) => e.stopPropagation()}>
            <div className={styles.title}>{titleText}</div>
            <div className={styles.lanBox} ref={this.lanDom}>
              {langList.map((item) => {
                return (
                  <div
                    key={item.code}
                    className={[
                      styles.list,
                      item.code === this.state.language
                        ? styles.listActived
                        : '',
                    ].join(' ')}
                    onClick={() => {
                      this.setState({ language: item.code });
                    }}
                  >
                    <span>{item.name}</span>
                    {item.code === this.state.language && (
                      <Icon type="check" size={5} />
                    )}
                  </div>
                );
              })}

              {/* {!this.state.isScroll && this.state.isShowMore && (
                <MoreTip tip={moreTipText} />
              )} */}
            </div>

            {/* 首页（除等位模式）才显示startOrder按钮,其他是确认按钮*/}
            <div
              className={`${styles.startBtn} linear-animate-btn`}
              onClick={() => {
                this.handleChooseLang(this.state.language);
              }}
            >
              <span>{startBtnText}</span>
            </div>
          </div>
        }
        onClose={this.handleClose}
      />
    );
  }
}

function mapStateToProps(state) {
  return {
    lanModalFn: state.lanModal.lanModalFn,
    selfConfig: state.selfConfig,
    searchKeyWord: state.searchKeyWord,
  };
}

export default connect(mapStateToProps, { setLanModal, searchItemHandler })(
  withTranslation()(LanModal)
);
