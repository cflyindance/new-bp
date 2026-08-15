import { isConfigSettingRoute } from './ConfigSettingRoute';

// 选择语言配置项可选语言列表
export const languageChooseOptions = [
  { name: 'English', code: 'en' },
  { name: '中文简体', code: 'zh_cn' },
  { name: '中文繁体', code: 'zh_tc' },
  { name: 'Français', code: 'french' },
  { name: '日本語', code: 'jan' },
  { name: 'русский язык', code: 'russian' },
  { name: 'Español', code: 'spanish' },
];

// 选择语言
export const systemLanguage = [
  {
    name: 'English',
    code: 'en',
    abbr: 'EN',
  },
  {
    name: '中文简体',
    code: 'zh_cn',
    abbr: '中',
  },
  {
    name: '中文繁体',
    code: 'zh_tc',
    abbr: '繁',
  },
  {
    name: 'Français',
    code: 'french',
    abbr: 'FR',
  },
  {
    name: '日本語',
    code: 'jan',
    abbr: 'JP',
  },
  {
    name: '한국어',
    code: 'korean',
    abbr: 'KR',
  },
  {
    name: 'Русский',
    code: 'russian',
    abbr: 'RU',
  },
  {
    name: 'Español',
    code: 'spanish',
    abbr: 'SP',
  },
  {
    name: 'ภาษาไทย',
    code: 'thai',
    abbr: 'TH',
  },
  {
    name: 'ViệtName',
    code: 'vietnamese',
    abbr: 'VI',
  },
];

// 映射pos的多语言code
export const langCodeMap = {
  en: 'en',
  zh_cn: 'zh-cn',
  zh_tc: 'zh-Hant',
  french: 'French',
  jan: 'jp',
  korean: 'ko',
  russian: 'ru',
  spanish: 'es',
  thai: 'th',
  vietnamese: 'vi',
};

export const homeHash = ['#/', '#/index'];

// kiosk配置页，需要隐藏头部
export const configPages = () => isConfigSettingRoute();

/** 根据当前是否在配置页，返回对应首页路由（HashRouter path） */
export const getKioskHomePath = () => (configPages() ? '/configApp' : '/');

/** 根据当前是否在配置页，返回对应首页 hash */
export const getKioskHomeHash = () =>
  configPages() ? '#/configApp' : '#/';

// 超管密码
export const PASSWORD = ['1qaz@WSX6788', 'wsxcvbnm'];

// 外带加收类型 id-name
export const TOGONAMELIST = {
  2: 'utensil',
  3: 'bag',
  4: 'takeout-box',
};
