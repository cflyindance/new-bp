import React, { Component, memo } from 'react';
import { connect } from 'react-redux';
import { withTranslation } from 'react-i18next';
import styles from './combo.module.scss';
import ComboSizeSelect from '@/container/comboPanel/fullComboPanel/comboSizeSelect';
import ComboOptionItem from '@/container/comboPanel/fullComboPanel/ComboOptionItem';
import DishTag from '@/component/DishTag';
import Icon from '@/component/icon';
import ImgCard from '@/component/imgCard';
import VtKeyboard from '@/component/VtKeyboard';
import DescModal from '@/component/DescModal';
import { getDishItemLanguage } from '@/utils/busTools';
import { removeEmoji } from '@/utils/sanitizeInput';
import cloneDeep from 'lodash/cloneDeep';

const MemoDishTag = memo(DishTag);
class ComboItemInfo extends Component {
  constructor(props) {
    super(props);
    this.state = {
      keyboardToggle: false,
      descVisible: false,
    };
    this.flag = false;
  }

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
      showRequireId,
    } = this.props;
    const { descVisible } = this.state;
    const currentItem = cloneDeep(tempCurrentItem);
    const { keyboardValue, keyboardToggle } = this.state;

    // 自选套餐，根据dineIn ,togo过滤 itemPrices（size -1）
    let comboSizeList = [];
    if (currentItem.itemPrices && currentItem.itemPrices.length) {
      if (currentOrder.orderType == 'DINE_IN') {
        let dineInList = currentItem.itemPrices.filter(
          (f) => f.type == 'DINE_IN'
        );
        if (dineInList.length) {
          comboSizeList.push(...cloneDeep(dineInList));
        } else {
          let AllList = currentItem.itemPrices.filter((f) => f.type == 'ALL');
          if (AllList.length) {
            comboSizeList.push(...cloneDeep(AllList));
          }
        }
      } else if (currentOrder.orderType == 'TO_GO') {
        // 是否打包
        let togoList = currentItem.itemPrices.filter((f) => f.type == 'TOGO');
        if (togoList.length) {
          comboSizeList.push(...cloneDeep(togoList));
        } else {
          let AllList = currentItem.itemPrices.filter((f) => f.type == 'ALL');
          if (AllList.length) {
            comboSizeList.push(...cloneDeep(AllList));
          }
        }
      } else if (currentOrder.orderType == 'PICK_UP') {
        // 预约点单
        let pickUpList = currentItem.itemPrices.filter(
          (f) => f.type == 'PICKUP'
        );
        if (pickUpList.length) {
          comboSizeList.push(...cloneDeep(pickUpList));
        } else {
          let AllList = currentItem.itemPrices.filter((f) => f.type == 'ALL');
          if (AllList.length) {
            comboSizeList.push(...cloneDeep(AllList));
          }
        }
      }
    }
    let comboOptionList = [];
    // options（-2）
    if (currentItem.options?.length) {
      comboOptionList.push(...currentItem.options);
    }
    const isItemPrice = comboSizeList.length > 0;
    const isItemOption = comboOptionList.length > 0;
    // textarea是否提示长度超过255
    let isExceedlimit = !!(String(keyboardValue).length >= 255);
    // 是否显示备注（id:3）
    const isShowRemark = selfConfig?.configMap?.id_3;

    //判断是不是有自定义标签 处理自定义标签和属性标签
    const isPropertyVisible = selfConfig?.configList?.find(
      (i) => i.id === 54
    )?.value;
    const propertyArr = isPropertyVisible
      ? selfConfig?.configList?.find((i) => i.id === 38)?.value
      : [];
    let property = [];
    propertyArr.map((item) => {
      if (
        item.dish.includes(currentItem.id) ||
        item.dish.includes(currentItem?.oId)
      ) {
        property.push({
          name: item.labelName,
          displayName: item.labelName,
          labelType: item.labelType,
          labelImg: item.labelImg,
          labelBgColor: item.labelBgColor || '#fffbf2',
          labelTextColor: item.labelTextColor || '#f26e21',
          isKioskTag: true,
        });
      }
    });
    if (Array.isArray(currentItem.properties)) {
      property = [...currentItem.properties, ...property];
    }

    return (
      <div className={styles.contentTopBox} ref={(el) => (this.scrollDom = el)}>
        <div className={styles.basicInfo}>
          <div className={styles.leftBox}>
            <ImgCard selfConfig={selfConfig} itemInfo={currentItem} />
          </div>
          <div className={styles.rightBox}>
            <div className={styles.comboItemsName}>
              {getDishItemLanguage(
                currentItem.fieldDisplayNameGroups,
                language
              ) || currentItem.name}
            </div>
            <div className={styles.property}>
              <MemoDishTag tagsInfo={property} isItemCard={false} />
            </div>
            {/* 描述 */}
            {(currentItem.description || currentItem.otherDescription) && (
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
            )}
            {!isItemPrice && (
              <span className={styles.price}>${currentItem.price}</span>
            )}
          </div>
        </div>

        {/* 显示size */}
        {isItemPrice && (
          <div className={styles.area}>
            <div className={`${styles.title} ${styles.titleWithRequired}`}>
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
              />
            </div>
          </div>
        )}

        {/* 菜option */}
        {isItemOption && (
          <div className={styles.area}>
            <ComboOptionItem comboOptionList={comboOptionList} />
          </div>
        )}

        {/* 产品备注 */}
        {/* {isShowRemark &&(<div
          className={styles.area}
        >
          <div className={styles.title}>{t('dishExtraDescription')}</div>
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
              this.setState({
                descVisible: true,
              });
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
        </div>)}

        {keyboardToggle ? (
          <VtKeyboard
            keyboardValue={keyboardValue}
            changeInput={this.onChange}
            closeKeyboard={() => {
              this.hideKeyboard();
            }}
          />
        ) : null}

        <DescModal
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

export default connect(mapStateToProps)(withTranslation()(ComboItemInfo));
