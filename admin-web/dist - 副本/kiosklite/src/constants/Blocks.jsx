import {
  blockDefaultStyle,
  initPageBlockStyle,
  initImageButtonStyle,
  initContinueOrderStyle,
} from '@/constants/BlockInitStyle';
import {
  addToCartInitProps,
  buyGiftCardInitProps,
  continueOrderInitProps,
  shoppingCartInitProps,
} from '@/constants/BlockProperties';
import Page from '@/component/PosterPro/Blocks/Page';
import AddToCart from '@/component/PosterPro/Blocks/AddToCart';
import BuyGiftCard from '@/component/PosterPro/Blocks/BuyGiftCard';
import ShoppingCart from '@/component/PosterPro/Blocks/ShoppingCart';
import ContinueOrder from '@/component/PosterPro/Blocks/ContinueOrder';

const renderBlock = (props) => {
  const blockMap = {
    Page,
    AddToCart,
    BuyGiftCard,
    ShoppingCart,
    ContinueOrder,
  };
  const Node = blockMap[props.component];
  const { style, ...rest } = props;
  return (
    <Node key={props.id} {...rest} style={{ ...style, ...blockDefaultStyle }} />
  );
};

export const pageBlock = {
  label: 'blocks.page_label',
  component: 'Page',
  render: (props) => renderBlock(props),
  resizable: false,
  draggable: false,
  properties: ['uploadImage'],
  style: initPageBlockStyle,
  isHideInList: true,
  isNeedTooltipBar: false,
};

export const addToCartBlock = {
  label: 'blocks.addToCart_label',
  component: 'AddToCart',
  render: (props) => renderBlock(props),
  resizable: true,
  draggable: true,
  properties: [
    'uploadImage',
    'bindDish',
    {
      style: {
        changeSize: {},
        changePosition: {},
      },
    },
  ],
  style: initImageButtonStyle,
  props: addToCartInitProps,
  isNeedTooltipBar: true,
};

export const shoppingCartBlock = {
  label: 'blocks.shoppingCart_label',
  component: 'ShoppingCart',
  render: (props) => renderBlock(props),
  resizable: true,
  draggable: true,
  properties: [
    'uploadImage',
    {
      style: {
        changeSize: {},
        changePosition: {},
      },
    },
  ],
  style: initImageButtonStyle,
  props: shoppingCartInitProps,
  isNeedTooltipBar: true,
};

export const buyGiftCardBlock = {
  label: 'blocks.buyGiftCard_label',
  component: 'BuyGiftCard',
  render: (props) => renderBlock(props),
  resizable: true,
  draggable: true,
  properties: [
    'uploadImage',
    'buyGiftCardAmount',
    {
      style: {
        changeSize: {},
        changePosition: {},
      },
    },
  ],
  style: initImageButtonStyle,
  props: buyGiftCardInitProps,
  isNeedTooltipBar: true,
};

export const continueOrderBlock = {
  label: 'blocks.continueOrder_label',
  component: 'ContinueOrder',
  render: (props) => renderBlock(props),
  resizable: true,
  draggable: true,
  properties: [
    'uploadImage',
    {
      style: {
        changeSize: {},
        changePosition: {},
      },
    },
  ],
  style: { ...initImageButtonStyle, ...initContinueOrderStyle },
  props: continueOrderInitProps,
  isNeedTooltipBar: true,
};
