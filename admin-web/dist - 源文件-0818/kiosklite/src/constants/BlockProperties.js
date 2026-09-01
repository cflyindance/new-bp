import BlockUploadImage from '@/component/PosterPro/BlockProperty/BlockUploadImage';
import ChangeSize from '@/component/PosterPro/BlockProperty/ChangeSize';
import ChangePosition from '@/component/PosterPro/BlockProperty/ChangePosition';
import BlockBindDish from '@/component/PosterPro/BlockProperty/BlockBindDish';
import BlockBuyGiftCardAmount from '@/component/PosterPro/BlockProperty/BlockBuyGiftCardAmount';

export const BlockPropertiesMap = {
  uploadImage: BlockUploadImage,
  bindDish: BlockBindDish,
  buyGiftCardAmount: BlockBuyGiftCardAmount,
  style: {
    changeSize: ChangeSize,
    changePosition: ChangePosition,
  },
};

export const addToCartInitProps = {
  imgUrl: '',
  defaultImg: '/images/addToCart.png',
  visible: {
    value: true,
  },
};

export const shoppingCartInitProps = {
  imgUrl: '',
  defaultImg: '/images/shoppingCart.png',
  visible: {
    value: true,
  },
};

export const continueOrderInitProps = {
  imgUrl: '',
  defaultImg: '/images/continueOrder.png',
  visible: {
    value: true,
  },
};

export const buyGiftCardInitProps = {
  imgUrl: '',
  defaultImg: '/images/addToCart.png',
  visible: {
    value: true,
  },
};
