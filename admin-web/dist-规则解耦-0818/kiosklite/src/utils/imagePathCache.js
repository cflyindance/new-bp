/**
 * 全局图片路径缓存管理器
 * 用于缓存商品id与图片路径的对应关系，避免重复查找
 */

// 全局图片路径缓存Map，key为商品id，value为图片路径
const imagePathCache = new Map();
// 已确认无真实图片的商品 id（仅使用默认图，不算有图）
const noImageCache = new Set();

/**
 * 获取缓存的图片路径（仅返回真实图片路径，不含默认图）
 * @param {string|number} itemId - 商品id
 * @returns {string|null} 缓存的图片路径，如果不存在则返回null
 */
export function getCachedImagePath(itemId) {
  if (!itemId || noImageCache.has(String(itemId))) return null;
  return imagePathCache.get(String(itemId)) || null;
}

/**
 * 设置图片路径到缓存
 * @param {string|number} itemId - 商品id
 * @param {string} imagePath - 图片路径
 */
export function setCachedImagePath(itemId, imagePath) {
  if (!itemId || !imagePath) return;
  const key = String(itemId);
  imagePathCache.set(key, imagePath);
  noImageCache.delete(key);
}

/**
 * 标记商品已确认无真实图片（使用默认图），避免重复查找
 * @param {string|number} itemId - 商品id
 */
export function setCachedNoImage(itemId) {
  if (!itemId) return;
  const key = String(itemId);
  noImageCache.add(key);
  imagePathCache.delete(key);
}

/**
 * 是否已缓存为无真实图片
 * @param {string|number} itemId - 商品id
 * @returns {boolean}
 */
export function hasCachedNoImage(itemId) {
  if (!itemId) return false;
  return noImageCache.has(String(itemId));
}

export function hasRealItemImage(itemInfo) {
  if (!itemInfo) return false;
  const itemId = itemInfo.id || itemInfo.oId;
  return !!itemInfo.thumbPath || !!getCachedImagePath(itemId);
}

/**
 * 清空所有图片路径缓存
 * 在返回首页时调用
 */
export function clearImagePathCache() {
  imagePathCache.clear();
  noImageCache.clear();
}

/**
 * 获取缓存大小（用于调试）
 * @returns {number} 缓存中条目的数量
 */
export function getCacheSize() {
  return imagePathCache.size;
}
