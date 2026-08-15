import {
  pageBlock,
  addToCartBlock,
  buyGiftCardBlock,
  shoppingCartBlock,
  continueOrderBlock,
} from '@/constants/Blocks.jsx';

class BlockRegister {
  constructor() {
    this.blocks = new Map();
  }

  registerBlock(blockObj) {
    this.blocks.set(blockObj.component, blockObj);
  }

  getAllBlocks() {
    return this.blocks;
  }

  getBlock(component) {
    return this.blocks.get(component);
  }
}

const register = new BlockRegister();

register.registerBlock(pageBlock);
register.registerBlock(addToCartBlock);
register.registerBlock(buyGiftCardBlock);
register.registerBlock(shoppingCartBlock);
register.registerBlock(continueOrderBlock);

export default register;
