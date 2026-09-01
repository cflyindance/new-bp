import React, { Component } from 'react';
import { withTranslation } from 'react-i18next';
import styles from './serviceItem.module.scss';
import Checkbox from '../../checkbox';
import RadioGroup from '../../radioGroup';
import Switch from '../../switch';
import Radio from '../../radio';
import LanguageItem from './languageItem';
import LanguageBtnDisplayItem from './languageBtnDisplayItem';
import TipItemSetting from './tipItemSetting';
import CardMinAmount from './cardMinAmount';
import Toast from '../../../../component/toast';
import TableClearItem from './tableClearItem';
import WaitingTimeItem from './waitingTimeItem';
import WaitingTimeRangeItem from './waitingTimeRangeItem';
import WaitingTimeShowTypeItem from './waitingTimeShowTypeItem';
import FontSizeItem from './fontSizeItem';
import FontBackgroundColorItem from './fontBackgroundColorItem';
import FontColorItem from './fontColorItem';
import DishDetailSimpleItem from './dishDetailSimpleItem';
import MenuNameBilingualItem from './menuNameBilingualItem';
import NumberPlateImageItem from './numberPlateImageItem';
import { resolveTipPaymentTypes } from '@/utils/tipPaymentTypes';
import { getEligibleTipProcedures } from '@/utils/tipProcedure';

class ServiceItem extends Component {
  constructor() {
    super();
    this.state = {
      map: {
        'signature-print-mode': 3,
        'print-mode': 3,
        'sms-mode': 3,
        'tip-procedure': 3,
        'callBoard-method': 2,
        'menu-display-position': 2,
        'menu-promotionlist-position': 2,
        'promotion-center-activity-name': 3,
      },
    };
    this.tipDetail = null;
    this.minAmoutDetail = null;
    this.tableClearDetail = null;
    this.waitingTimeDetail = null;
    this.waitingTimeRangeDetail = null;
    this.fontSizeDetail = null;
    this.fontBackgroundColorDetail = null;
    this.fontColorDetail = null;
  }

  openTipDetail = (ref) => {
    this.tipDetail = ref;
  };

  openMinDetail = (ref) => {
    this.minAmoutDetail = ref;
  };

  openTableClearDetail = (ref) => {
    this.tableClearDetail = ref;
  };

  openWaitingTimeDetail = (ref) => {
    this.waitingTimeDetail = ref;
  };

  openWaitingTimeRangeDetail = (ref) => {
    this.waitingTimeRangeDetail = ref;
  };

  openFontSizeDetail = (ref) => {
    this.fontSizeDetail = ref;
  };

  openFontBackgroundColorDetail = (ref) => {
    this.fontBackgroundColorDetail = ref;
  };

  openFontColorDetail = (ref) => {
    this.fontColorDetail = ref;
  };

  handleChangeSwitch = (id, e) => {
    this.props.handleChange(id, e);
  };

  handleCheckBox = (id, e) => {
    this.props.handleChangeBox(id, e);
  };

  handleRadio = (id, e) => {
    this.props.handleChangeRadio(id, e);
  };

  componentDidMount() {
    this.props.onRef && this.props.onRef(this);
  }

  handleChangeShowSendMethod = (id, e) => {
    const { configList, t } = this.props;
    const mealSendMethod = configList.find((each) => each.id === 4)?.value;
    // 送餐到桌的方式两种都开启 不能关闭当前配置
    if (e && mealSendMethod?.length === 2) {
      Toast.info(t('send-method-not-close'), 2000);
      return;
    }
    // 不选择送餐到桌， 不能开启当前配置
    if (!e && !mealSendMethod?.length) {
      Toast.info(t('send-method-not-open'), 2000);
      return;
    }
    this.props.handleChange(id, e);
  };

  handleChangeSwitchType = (id, e) => {
    const { posConfig, t } = this.props;
    const { posConfigList } = posConfig.state;
    const orderType = posConfigList.find(
      (each) =>
        each['app:id'] === 601 || each['app:name'] === 'CHOOSE_ORDER_TYPE'
    );
    const orderTypeVal = orderType['app:value'];
    if (orderTypeVal.split(',').length > 1) {
      Toast.info(t('order-type-operation'), 1000);
      return;
    }
    this.props.handleChange(id, e);
  };

  render() {
    const {
      t,
      configList,
      configInfo,
      handleChangeDishDetailIds,
      handleChangeMenuNameDisplayLangs,
      handleChangeMenuNamePrimaryLang,
      availableTipPaymentTypes = [],
      posPaymentConfigLoaded,
      handleTipPaymentTypeChange,
    } = this.props;
    const { map } = this.state;
    let title = t([configInfo.key]);
    let value = configInfo.value;
    let contentDom = null;
    let extraContentDom = null;

    switch (configInfo.key) {
      case 'meal-delivery-service-mode':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div
              onClick={() => {
                this.handleCheckBox(configInfo.id, 0);
              }}
            >
              <Checkbox checkedB={value.includes(0)} />
              <span className={styles.checkText}>{t('pick-up')}</span>
            </div>
            <div
              onClick={() => {
                this.handleCheckBox(configInfo.id, 1);
              }}
            >
              <Checkbox checkedB={value.includes(1)} />
              <span className={styles.checkText}>{t('deliver-to-table')}</span>
            </div>
          </div>
        );
        break;
      case 'send-kitchen-order-type':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div
              onClick={() => {
                this.handleCheckBox(configInfo.id, 0);
              }}
            >
              <Checkbox checkedB={value.includes(0)} />
              <span className={styles.checkText}>
                {t('send-kitchen-order-type-0')}
              </span>
            </div>
            <div
              onClick={() => {
                this.handleCheckBox(configInfo.id, 1);
              }}
            >
              <Checkbox checkedB={value.includes(1)} />
              <span className={styles.checkText}>
                {t('send-kitchen-order-type-1')}
              </span>
            </div>
            <div
              onClick={() => {
                this.handleCheckBox(configInfo.id, 2);
              }}
            >
              <Checkbox checkedB={value.includes(2)} />
              <span className={styles.checkText}>
                {t('send-kitchen-order-type-2')}
              </span>
            </div>
          </div>
        );
        break;
      case 'signature-print-mode':
      case 'print-mode':
      case 'sms-mode':
      case 'tip-procedure':
      case 'callBoard-method':
      case 'menu-display-position':
      case 'menu-promotionlist-position':
      case 'promotion-center-activity-name':
        let num = map[configInfo.key] || 0;
        const eligibleTipProcedures =
          configInfo.key === 'tip-procedure'
            ? getEligibleTipProcedures(
                configList.find((item) => item.id === 5),
                availableTipPaymentTypes,
                posPaymentConfigLoaded
              )
            : [];
        contentDom = (
          <RadioGroup
            configInfo={configInfo}
            handleRadio={this.handleRadio}
            num={num}
            disabledValues={
              configInfo.key === 'tip-procedure'
                ? [0, 1, 2].filter(
                    (procedure) =>
                      !eligibleTipProcedures.includes(procedure)
                  )
                : []
            }
          />
        );
        break;
      case 'languageChoose':
        contentDom = (
          <LanguageItem
            configInfo={configInfo}
            checkBox={this.handleCheckBox}
          />
        );
        break;
      case 'home-language-btn-display':
        contentDom = (
          <LanguageBtnDisplayItem
            configInfo={configInfo}
            checkBox={this.handleCheckBox}
          />
        );
        break;
      case 'waiting-time-show-type':
        contentDom = (
          <WaitingTimeShowTypeItem
            configInfo={configInfo}
            checkBox={this.handleCheckBox}
          />
        );
        break;
      case 'font-size':
        contentDom = (
          <FontSizeItem
            onRef={this.openFontSizeDetail}
            configInfo={configInfo}
          />
        );
        break;
      case 'font-background-color':
        contentDom = (
          <FontBackgroundColorItem
            onRef={this.openFontBackgroundColorDetail}
            configInfo={configInfo}
          />
        );
        break;
      case 'font-color':
        contentDom = (
          <FontColorItem
            onRef={this.openFontColorDetail}
            configInfo={configInfo}
          />
        );
        break;
      case 'default-language':
        let langList = [];
        let r = configList.find((c) => c.id === 10);
        if (r) {
          langList = r.value;
        }
        contentDom = (
          <div
            className={[styles.serviceBottom, styles.servicelangBottom].join(
              ' '
            )}
          >
            {langList.map((code) => {
              return (
                <div
                  key={code}
                  onClick={() => {
                    this.props.handleChangeRadio(configInfo.id, code);
                  }}
                >
                  <Radio checkedB={code == value} />
                  <span className={styles.radioText}>
                    {t(['language-' + code])}
                  </span>
                </div>
              );
            })}
          </div>
        );
        break;
      case 'tip-collect-method':
        contentDom = (
          <TipItemSetting
            onRef={this.openTipDetail}
            configInfo={configInfo}
            handleRadio={this.handleRadio}
          />
        );
        break;
      case 'credit-card-min-amount':
        contentDom = (
          <CardMinAmount onRef={this.openMinDetail} configInfo={configInfo} />
        );
        break;
      case 'tipping-mode': {
        const selectedTipPaymentTypes = resolveTipPaymentTypes(
          configInfo,
          availableTipPaymentTypes
        );
        const renderTipPaymentOption = (code, label) => {
          const enabled =
            posPaymentConfigLoaded && availableTipPaymentTypes.includes(code);
          return (
            <div
              key={code}
              aria-disabled={!enabled}
              style={{
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled ? 1 : 0.45,
              }}
              onClick={() => enabled && handleTipPaymentTypeChange?.(code)}
            >
              <Checkbox checkedB={selectedTipPaymentTypes.includes(code)} />
              <span className={styles.checkText}>{label}</span>
            </div>
          );
        };
        contentDom = (
          <div className={styles.serviceBottom}>
            {renderTipPaymentOption('0', t('credit_debit_card'))}
            {renderTipPaymentOption('1', t('cash'))}
            {renderTipPaymentOption('2', t('gift_card'))}
          </div>
        );
        break;
      }
      case 'show-order-type-page':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={value}
                handleChangeSwitch={this.handleChangeSwitchType}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        break;
      case 'show-send-dish-method':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={value}
                handleChangeSwitch={this.handleChangeShowSendMethod}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        break;
      case 'auto-clear-table':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={value.status}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        extraContentDom = (
          <TableClearItem
            onRef={this.openTableClearDetail}
            configInfo={configInfo}
            handleChangeSwitch={this.handleChangeSwitch}
            visible={value.status}
          />
        );
        break;
      case 'show-waiting-time':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={value.status}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        extraContentDom = (
          <WaitingTimeItem
            onRef={this.openWaitingTimeDetail}
            configInfo={configInfo}
            handleChangeSwitch={this.handleChangeSwitch}
            visible={value.status}
          />
        );
        break;
      case 'show-waiting-time-range':
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={value.status}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        extraContentDom = (
          <WaitingTimeRangeItem
            onRef={this.openWaitingTimeRangeDetail}
            configInfo={configInfo}
            handleChangeSwitch={this.handleChangeSwitch}
            visible={value.status}
          />
        );
        break;
      case 'simple-dish-detail-display': {
        const dishVal =
          value && typeof value === 'object' && 'status' in value
            ? value
            : { status: false, dishIds: [] };
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={dishVal.status}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        extraContentDom = (
          <DishDetailSimpleItem
            visible={dishVal.status}
            configInfo={{ ...configInfo, value: dishVal }}
            onDishIdsChange={handleChangeDishDetailIds}
          />
        );
        break;
      }
      case 'menu-name-bilingual-display': {
        const menuNameVal =
          value && typeof value === 'object' && 'status' in value
            ? value
            : { status: false, displayLangs: [], primaryLang: '' };
        const languageOptions =
          configList.find((c) => c.id === 10)?.value || [];
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={menuNameVal.status}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        extraContentDom = (
          <MenuNameBilingualItem
            visible={menuNameVal.status}
            configInfo={{ ...configInfo, value: menuNameVal }}
            languageOptions={languageOptions}
            onDisplayLangsChange={handleChangeMenuNameDisplayLangs}
            onPrimaryLangChange={handleChangeMenuNamePrimaryLang}
          />
        );
        break;
      }
      case 'number-plate-page-image': {
        const imageValue =
          value && typeof value === 'object'
            ? value
            : { status: false, horizontalImg: '', verticalImg: '' };
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={imageValue.status}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        extraContentDom = (
          <NumberPlateImageItem
            visible={imageValue.status}
            configInfo={{ ...configInfo, value: imageValue }}
            onChange={this.props.handleChangeConfigValue}
          />
        );
        break;
      }
      default:
        contentDom = (
          <div className={styles.serviceBottom}>
            <div className={styles.foodSet}>
              <i>{t('config-close')}</i>
              <Switch
                fId={configInfo.id}
                checkedB={value}
                handleChangeSwitch={this.handleChangeSwitch}
              />
              <i>{t('config-open')}</i>
            </div>
          </div>
        );
        break;
    }

    if (extraContentDom) {
      return (
        <div
          className={`${styles.serviceBox} ${styles.serviceBoxWithExtraContent}`}
        >
          <div className={styles.serviceHeaderBox}>
            <div className={styles.serviceTop}>{title}</div>
            {contentDom}
          </div>
          {extraContentDom}
        </div>
      );
    }

    return (
      <div className={styles.serviceBox}>
        <div className={styles.serviceTop}>{title}</div>
        {contentDom}
      </div>
    );
  }
}

export default withTranslation()(ServiceItem);
