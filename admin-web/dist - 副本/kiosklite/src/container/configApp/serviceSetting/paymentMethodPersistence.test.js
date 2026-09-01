import { describe, expect, it } from 'vitest';
import { selfConfigList } from '@/constants/selfConfig';
import serviceSettingSource from './index.js?raw';
import transferPosSettingSource from './transferPosSetting/index.js?raw';
import submitModalSource from './transferPosSetting/SubmitModal.js?raw';
import zh from '@/assets/i18n/locale/ZH-CN.json';
import en from '@/assets/i18n/locale/En.json';

describe('service setting payment method persistence', () => {
  it('declares marginappconfig id 70 as the global payment method field', () => {
    expect(
      selfConfigList.configList.find((config) => config.id === 70)
    ).toEqual({
      id: 70,
      key: 'kiosk-payment-types',
      value: ['0', '1'],
    });
  });

  it('does not let dual price or service setting saves rewrite the selection or id 34', () => {
    expect(serviceSettingSource).not.toContain('设置DP后,统一开启两种支付模式');
    expect(serviceSettingSource).not.toContain('kioskPaymentTypeChanged');
  });

  it('persists id 70 before attempting the POS compatibility sync', () => {
    const marginSave = serviceSettingSource.indexOf(
      'const marginRes = await postMarginappConfig'
    );
    const posSync = serviceSettingSource.indexOf(
      'await this.posDetail?.savePosDetail()',
      marginSave
    );

    expect(marginSave).toBeGreaterThan(-1);
    expect(posSync).toBeGreaterThan(marginSave);
    expect(serviceSettingSource).toContain('item.id !== 70');
  });

  it('decides and confirms POS writes before marginappconfig is written', () => {
    const decision = serviceSettingSource.indexOf(
      'const posSaveDecision = this.posDetail?.getSaveDecision()'
    );
    const confirmation = serviceSettingSource.indexOf(
      'await this.posDetail?.confirmPaymentTypeSync()',
      decision
    );
    const marginSave = serviceSettingSource.indexOf(
      'const marginRes = await postMarginappConfig'
    );

    expect(decision).toBeGreaterThan(-1);
    expect(confirmation).toBeGreaterThan(decision);
    expect(marginSave).toBeGreaterThan(confirmation);
    expect(serviceSettingSource).toContain(
      'if (posSaveDecision.shouldSavePos)'
    );
  });

  it('keeps authentication policy and confirmation outside the raw POS writer', () => {
    expect(transferPosSettingSource).toContain('getPosConfigSaveDecision');
    expect(transferPosSettingSource).toContain('getSaveDecision = () =>');
    expect(transferPosSettingSource).toContain(
      'confirmPaymentTypeSync = async () =>'
    );
    expect(transferPosSettingSource).not.toContain(
      "if (orderType !== preOrderType)"
    );
  });

  it('describes the confirmation as POS compatibility sync', () => {
    expect(submitModalSource).toContain("t('sync-payType')");
    expect(zh['sync-payType']).toContain('POS 兼容配置');
    expect(en['sync-payType']).toContain('POS compatibility configuration');
  });
});
