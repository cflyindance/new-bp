import React, { Component } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './comboItem.module.scss';
import ComboSizeSelect from '../comboSizeSelect';
import ComboOptionItem from '../ComboOptionItem';
import Icon from '../../../../component/icon';
import ImgCard from '../../../../component/imgCard';
import VtKeyboard from '../../../../component/VtKeyboard';
import { getDishItemLanguage } from '@/utils/busTools';
import { removeEmoji } from '@/utils/sanitizeInput';
import cloneDeep from 'lodash/cloneDeep';
import buildComboSizeList from '../buildComboSizeList';
import NoActivityTag from '@/container/orderPage/noActivityTag';
import POINT from '@/assets/images/star.png';
import { hasRealItemImage } from '@/utils/imagePathCache';

class ComboItem extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboardToggle: false,
      comboSizeList: [],
    };
    this.flag = false;
    // 用 key 控制 comboSizeList 只在必要时重新整理（避免每次 render 都算）
    this.comboSizeKey = '';
  }

  // 生成一个足够稳定的 key，用来判断是否需要重新整理 comboSizeList
  getComboSizeKey = (currentItem, currentOrder) => {
    const orderType = currentOrder?.orderType || '';
    const itemId = currentItem?.id || currentItem?.itemId || '';
    const itemPrices = currentItem?.itemPrices || [];
    const pricesKey = itemPrices
      .map((p) => `${p?.id || ''}:${p?.type || ''}:${p?.size || ''}`)
      .join('|');
    return `${itemId}__${orderType}__${pricesKey}`;
  };

  syncComboSizeListIfNeeded = () => {
    const { currentItem, currentOrder } = this.props;
    const nextKey = this.getComboSizeKey(currentItem, currentOrder);
    if (nextKey && nextKey !== this.comboSizeKey) {
      const nextList = buildComboSizeList(currentItem, currentOrder);
      this.comboSizeKey = nextKey;
      this.setState({ comboSizeList: nextList });
    }
  };

  // 清空文本域
  handleResetEmpty = () => {
    this.setState({
      keyboardValue: '',
    });
    const { currentItem } = this.props;
    currentItem.remark = {
      optionName: '',
      optionType: 'NOTE',
      quantity: 1,
      price: 0,
    };
  };

  onChange = (input) => {
    this.inputRef.scrollIntoViewIfNeeded(true);
    this.setState(
      {
        keyboardValue: input,
      },
      () => {
        const { currentItem } = this.props;
        currentItem.remark = {
          optionName: input,
          optionType: 'NOTE',
          quantity: 1,
          price: 0,
        };
      }
    );
  };

  showKeyboard = () => {
    this.setState({
      keyboardToggle: true,
    });
  };

  hideKeyboard = () => {
    this.setState({
      keyboardToggle: false,
    });
  };

  keyboardChange = (eventOrValue) => {
    let value = eventOrValue?.target ? eventOrValue.target.value : eventOrValue;
    value = removeEmoji(value);
    if (eventOrValue?.target) {
      eventOrValue.target.value = value;
    }
    if (value.length > 255) {
      value = value.substr(0, 255);
    }
    this.setState(
      {
        keyboardValue: value,
      },
      () => {
        const { currentItem } = this.props;
        currentItem.remark = {
          optionName: value,
          optionType: 'NOTE',
          quantity: 1,
          price: 0,
        };
      }
    );
  };

  componentDidMount() {
    const { currentItem } = this.props;
    if (currentItem.remark?.optionName) {
      this.setState({
        keyboardValue: currentItem.remark.optionName || '',
      });
    }
    this.syncComboSizeListIfNeeded();
  }

  componentDidUpdate(prevProps, prevState) {
    // 当备注长度达到上线，展示出完整提示
    let isExceedlimit = !!(String(this.state.keyboardValue).length >= 255);
    if (isExceedlimit && this.maxNoteRef) {
      this.maxNoteRef.scrollIntoViewIfNeeded(true);
    }

    if (this.state.keyboardToggle != prevState.keyboardToggle) {
      // 打开，键盘height：380px
      if (this.state.keyboardToggle) {
        this.scrollDom.parentNode.parentNode.style.maxHeight =
          'calc(100vh - 380px)';
        // 将textarea滚动到可视区域
        this.inputRef.scrollIntoViewIfNeeded(true);
      } else {
        // 关闭
        this.scrollDom.parentNode.parentNode.style.maxHeight =
          'calc(100vh - 21.8rem)';
      }
    }

    // currentItem / orderType 变化时才重新整理一次，避免 render 里重复计算
    if (
      prevProps.currentOrder?.orderType !==
        this.props.currentOrder?.orderType ||
      prevProps.currentItem?.id !== this.props.currentItem?.id ||
      (prevProps.currentItem?.itemPrices?.length || 0) !==
        (this.props.currentItem?.itemPrices?.length || 0)
    ) {
      this.syncComboSizeListIfNeeded();
    }
  }

  componentWillUnmount() {
    if (this.scrollDom) {
      this.scrollDom.parentNode.parentNode.style.maxHeight =
        'calc(100vh - 21.8rem)';
    }
  }

  render() {
    const {
      t,
      i18n: { language },
      currentItem: tempCurrentItem,
      currentOrder,
      selfConfig,
      isInFreeItem,
      isSpecialItem,
      itemPoints,
      itemVoucherPrice,
      isPromotionItem,
      showRequireId,
    } = this.props;
    const currentItem = cloneDeep(tempCurrentItem);
    const { keyboardValue, keyboardToggle } = this.state;

    // 只在生命周期里整理，render 直接消费即可
    const comboSizeList = this.state.comboSizeList || [];

    let comboOptionList = [];
    // options（-2）
    if (currentItem.options?.length) {
      comboOptionList.push(...currentItem.options);
    }
    const isItemPrice = comboSizeList.length > 0;
    const isItemOption = comboOptionList.length > 0;
    const hasMainImage = hasRealItemImage(currentItem);
    // textarea是否提示长度超过255
    let isExceedlimit = !!(String(keyboardValue).length >= 255);
    // 是否显示备注（id:3）
    const isShowRemark = selfConfig?.configMap?.id_3;

    return (
      <React.Fragment>
        <div className={styles.comboItemsTitle}>
          {getDishItemLanguage(currentItem.fieldDisplayNameGroups, language) ||
            currentItem.name}
        </div>
        <div
          className={styles.contentTopBox}
          ref={(el) => (this.scrollDom = el)}
        >
          {/* 左 */}
          <div className={styles.leftBox}>
            {/* 图片 */}
            {/* {currentItem.thumbPath ? ( */}
            {hasMainImage && (
              <div className={styles.areaImg}>
                <ImgCard selfConfig={selfConfig} itemInfo={currentItem} />
              </div>
            )}
            {/* ) : null} */}
          </div>
          {/* 右 */}
          {(currentItem.description ||
            currentItem.otherDescription ||
            isItemPrice ||
            isItemOption ||
            isShowRemark) && (
            <div className={styles.rightBox}>
              {/* 描述 */}
              {(currentItem.description || currentItem.otherDescription) && (
                <div className={styles.areaDetail}>
                  <div style={{ marginTop: 0 }} className={styles.title}>
                    {t('description')}
                  </div>
                  <div className={styles.word}>
                    {currentItem.otherDescription && (
                      <div
                        style={{
                          fontWeight: 'bolder',
                          marginBottom: '2.5rem',
                          fontSize: '3.5rem',
                        }}
                      >
                        {currentItem.otherDescription || ''}
                      </div>
                    )}
                    <div>{currentItem.description || ''}</div>
                  </div>
                </div>
              )}
              {/* 无size，显示price */}
              {/* {isItemPrice && (
                <div className={[styles.area, styles.noSize].join(' ')}>
                  <div className={styles.title}>
                    <span>{t('item_size')}</span>
                    <>
                      {isInFreeItem ? (
                        itemPoints ? (
                          <span className={styles.point}>
                            <img src={POINT} alt="point" />
                            <span>
                              {itemPoints} {t('pts')}
                            </span>
                          </span>
                        ) : (
                          <>${itemVoucherPrice}</>
                        )
                      ) : isPromotionItem ? (
                        <span>$0.00</span>
                      ) : (
                        <span>${currentItem.price}</span>
                      )}
                    </>
                  </div>
                </div>
              )} */}
              {/* 显示size */}
              {isItemPrice && (
                <div className={styles.area}>
                  {/* showRequireId */}
                  <div
                    className={`${styles.title} ${styles.titleWithRequired}`}
                  >
                    <span>{t('section')}</span>
                    {showRequireId === -1 && (
                      <span className={styles.required}>{t('required')}</span>
                    )}
                  </div>
                  <div className={`${styles.word} ${styles.wordSize}`}>
                    <ComboSizeSelect
                      comboSizeList={comboSizeList}
                      setCurSectionId={this.props.setCurSectionId}
                      comboStepUpTop={this.props.comboStepUpTop}
                      optAndRemark={!!(!isItemOption && !isShowRemark)}
                      isInFreeItem={isInFreeItem}
                      isSpecialItem={isSpecialItem}
                      isPromotionItem={isPromotionItem}
                    />
                  </div>
                </div>
              )}
              {/* 菜option */}
              {isItemOption && (
                <div className={styles.area}>
                  <ComboOptionItem
                    comboOptionList={comboOptionList}
                    isInFreeItem={isInFreeItem}
                    isSpecialItem={isSpecialItem}
                    isPromotionItem={isPromotionItem}
                  />
                  {/* <NoActivityTag itemId={currentItem.id} /> */}
                </div>
              )}
              {/* 产品备注 */}
              {isShowRemark && (
                <div className={styles.area}>
                  <div className={styles.title}>
                    {t('dishExtraDescription')}
                  </div>
                  <textarea
                    ref={(el) => (this.inputRef = el)}
                    maxLength={255}
                    placeholder={`${t('dishExtraDescription')},${t('note_tip')}`}
                    value={keyboardValue}
                    className={styles.textContent}
                    onFocus={() => {
                      window.scroll(0, 0);
                    }}
                    onBlur={() => {
                      window.scroll(0, 0);
                    }}
                    onClick={() => {
                      // 调用父组件的 showDescModal 方法
                      if (this.props.showDescModal) {
                        this.props.showDescModal(
                          t('dishExtraDescription'),
                          keyboardValue,
                          (value) => this.keyboardChange(value)
                        );
                      }
                    }}
                    onCompositionStart={() => {
                      this.flag = true;
                    }}
                    onCompositionEnd={() => {
                      this.flag = false;
                      this.inputRef.value = this.inputRef.value;
                    }}
                    onChange={this.keyboardChange}
                  />
                  {!!keyboardValue ? (
                    <Icon
                      className={styles.iconEmpty}
                      type="round_close_light"
                      size={5}
                      onClick={this.handleResetEmpty}
                    />
                  ) : null}
                  <span
                    ref={(el) => (this.maxNoteRef = el)}
                    className={styles.maxNote}
                    style={{ display: isExceedlimit ? 'block' : 'none' }}
                  >
                    {t('maxNoteTip')}
                  </span>
                </div>
              )}
            </div>
          )}

          {keyboardToggle ? (
            <VtKeyboard
              keyboardValue={keyboardValue}
              changeInput={this.onChange}
              closeKeyboard={() => {
                this.hideKeyboard();
              }}
            />
          ) : null}

          {/* <DescModal
            preVal={keyboardValue}
            visible={descVisible}
            title={t('dishExtraDescription')}
            onClose={() =>
              this.setState({
                descVisible: false,
              })
            }
            onSetVal={(v) => this.keyboardChange(v)}
          /> */}
        </div>
      </React.Fragment>
    );
  }
}

function mapStateToProps(state) {
  return {
    currentItem: state.currentItem,
    currentOrder: state.currentOrder,
    selfConfig: state.selfConfig,
    crm: state.crm,
  };
}

export default connect(mapStateToProps)(withTranslation()(ComboItem));
