/** 默认走同源 /kpos（admin-web 嵌入时由 Vite 代理到 POS；可被 cookie 覆盖） */
function resolveDefaultServerURL() {
  if (typeof window !== "undefined" && window.location?.origin) {
    return `${window.location.origin}/kpos/`;
  }
  return "http://localhost:22080/kpos/";
}

export let serverURL = resolveDefaultServerURL();

// 本地
// export let serverURL = 'http://192.168.0.163:22080/kpos/'

// 测试
// export let serverURL = 'http://192.168.96.247:22080/kpos/'

// demo地址
// export let serverURL = 'http://demo.menusifupos.com/kpos/'

export const filterDeleted = "&showInactive=false&showDeleted=false";
