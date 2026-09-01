import { combineReducers } from 'redux';
import {
  currentSaleItems,
  currentItem,
  menuItemList,
  itemSizeList,
  tempItemList,
  searchItem,
} from './item';
import {
  currentCategory,
  currentCategoryList,
  searchKeyWord,
  keyboardToggle,
  tempCurrentCategory,
} from './category';
import language from './language';
import { menuGroup, freeListIsExpanded, comboMenu } from './menu';
import requireCategory from './requireCategory';
import merchantProfile from './merchantProfile';
import { default as currentOrder } from './order';
import orderSequence from './orderSequence';
import { currentOrderCombo } from './combo';
import orderEdit from './isOrderEdit';
import taxList from './tax';
import systemConfig from './systemConfig';
import img from './img';
import sideNav from './sideNav';
import lanModal from './lanModal';
import allSysConfig from './allSystemConfigList';
import selfConfig from './selfConfig';
import sysCookie from './sysCookie';
import togoList from './togoList';
import cardPaidResult from './cardPaidResult';
import giftCardPaymentInfo from './giftCardPaymentInfo';
import brandSetting from './brandSetting';
import socket from './socket';
import crm from './crm';
import cateDish from './cateDish';
import promotion from './promotion';
import avocado from './avocado';
import posterPro from './posterPro';
import crmPromotionContrary from './crmPromotionContrary';
import ecard from './ecard';

export default combineReducers({
  currentSaleItems,
  currentItem,
  currentCategory,
  currentCategoryList,
  menuGroup,
  freeListIsExpanded,
  comboMenu,
  requireCategory,
  currentOrder,
  language,
  merchantProfile,
  orderSequence,
  orderEdit,
  currentOrderCombo,
  taxList,
  systemConfig,
  img,
  sideNav,
  menuItemList,
  itemSizeList,
  tempItemList,
  searchItem,
  searchKeyWord,
  keyboardToggle,
  tempCurrentCategory,
  lanModal,
  allSysConfig,
  selfConfig,
  sysCookie,
  togoList,
  cardPaidResult,
  giftCardPaymentInfo,
  socket,
  brandSetting,
  crm,
  cateDish,
  promotion,
  avocado,
  posterPro,
  crmPromotionContrary,
  ecard,
});
