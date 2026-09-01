import React from 'react';
import { withRouter } from 'react-router-dom';
import { withTranslation } from 'react-i18next';
import { connect } from 'react-redux';
import styles from './inputSearch.module.scss';
import Icon from '@/component/icon';
import VtKeyboard from '@/component/VtKeyboard';
import {
  searchItemHandler,
  clearCurrentCategory,
  setkeyboardToggle,
} from '@/actions';
import { isOpenVtkeyboadrd } from '@/utils';
import SEARCH from '@/assets/images/search.png';

class InputSearch extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      searchKeyWord: this.props.searchKeyWord || '',
      keyboardValue: '',
      isShowInput: false,
    };
    this.keyboardRef = null;
    this.isClickingKeyboard = false;
  }

  componentDidUpdate(prevProps) {
    if (
      prevProps.searchKeyWord !== this.props.searchKeyWord &&
      this.props.searchKeyWord === '' &&
      this.state.searchKeyWord !== ''
    ) {
      this.setState({
        searchKeyWord: '',
      });
    }
  }

  searchInputChange = (event) => {
    let value = event.target.value;
    this.setState(
      {
        searchKeyWord: value,
        keyboardValue: value,
      },
      () => {
        this.props.searchItemHandler(value);
      }
    );
  };

  // 输入框失去焦点
  handleInputBlur = () => {
    // 如果是内嵌页面且使用VtKeyboard，检查是否点击了键盘区域
    if (isOpenVtkeyboadrd() && this.props.keyboardToggle) {
      setTimeout(() => {
        // 检查点击目标是否在键盘容器内，或者是否正在点击键盘
        if (this.isClickingKeyboard) {
          // 如果点击的是键盘，保持输入框焦点，不隐藏
          this.isClickingKeyboard = false;
          if (this.inputRef) {
            this.inputRef.focus();
          }
          return;
        }

        // 检查焦点是否还在输入框上
        if (document.activeElement === this.inputRef) {
          return;
        }

        // 检查活动元素是否在键盘容器内
        if (
          this.keyboardRef &&
          this.keyboardRef.contains(document.activeElement)
        ) {
          // 焦点在键盘容器内，保持输入框焦点
          if (this.inputRef) {
            this.inputRef.focus();
          }
          return;
        }

        // 真正失去焦点后关闭键盘，仅在搜索内容为空时收起输入框
        if (!this.state.searchKeyWord) {
          this.setState({ isShowInput: false });
        }
        this.props.setkeyboardToggle(false);
      }, 150);
    } else {
      // 非VtKeyboard
      // 延迟隐藏，以便用户能够点击清空按钮
      setTimeout(() => {
        if (!this.state.searchKeyWord) {
          this.setState({ isShowInput: false });
        }
      }, 150);
      this.props.setkeyboardToggle(false);
    }
  };

  onChange = (input) => {
    this.setState(
      {
        searchKeyWord: input,
        keyboardValue: input,
      },
      () => {
        this.props.searchItemHandler(input);
      }
    );
  };

  // 清空
  handleResetEmpty = () => {
    this.setState(
      {
        searchKeyWord: '',
        keyboardValue: '',
      },
      () => {
        this.props.searchItemHandler('');
        this.props.setkeyboardToggle(false);
        // 清空后隐藏搜索框
        this.setState({ isShowInput: false });
      }
    );
  };

  render() {
    const { t, keyboardToggle, style = {} } = this.props;
    const { searchKeyWord, keyboardValue, isShowInput } = this.state;

    return (
      <div
        className={`${styles.searchBox} ${isShowInput ? styles.searchBoxFixHeight : ''}`}
        style={style}
      >
        {!isShowInput ? (
          <img
            src={SEARCH}
            alt="search"
            className={styles.searchIcon}
            onClick={() => {
              this.setState({ isShowInput: true }, () => {
                // 在状态更新后让输入框获得焦点
                if (this.inputRef) {
                  this.inputRef.focus();
                }
                if (isOpenVtkeyboadrd()) {
                  this.props.setkeyboardToggle(true);
                }
              });
            }}
          />
        ) : (
          <>
            {!!searchKeyWord && (
              <Icon
                className={styles.iconEmpty}
                type="round_close_light"
                size={4}
                onClick={this.handleResetEmpty}
              />
            )}
            <div className={styles.searchBar}>
              <input
                ref={(el) => (this.inputRef = el)}
                maxLength={20}
                className={styles.searchIpt}
                onFocus={() => {
                  window.scroll(0, 0);
                }}
                onBlur={() => {
                  window.scroll(0, 0);
                  this.handleInputBlur();
                }}
                placeholder={t('search')}
                onClick={() => {
                  if (isOpenVtkeyboadrd()) {
                    this.props.setkeyboardToggle(true);
                  }
                }}
                value={searchKeyWord}
                onChange={this.searchInputChange}
              />
            </div>
          </>
        )}

        {keyboardToggle ? (
          <div
            ref={(el) => (this.keyboardRef = el)}
            onMouseDown={(e) => {
              // 标记正在点击键盘区域
              this.isClickingKeyboard = true;
              // 阻止默认行为，防止输入框失焦
              e.preventDefault();
            }}
            onMouseUp={() => {
              // 鼠标抬起后，延迟重置标记
              setTimeout(() => {
                this.isClickingKeyboard = false;
              }, 100);
            }}
          >
            <VtKeyboard
              keyboardValue={keyboardValue}
              changeInput={this.onChange}
              closeKeyboard={() => {
                this.props.setkeyboardToggle(false);
              }}
            />
          </div>
        ) : null}
      </div>
    );
  }
}

function mapStateToProps(state) {
  return {
    keyboardToggle: state.keyboardToggle,
    searchKeyWord: state.searchKeyWord,
  };
}

export default withRouter(
  connect(mapStateToProps, {
    searchItemHandler,
    clearCurrentCategory,
    setkeyboardToggle,
  })(withTranslation()(InputSearch))
);
