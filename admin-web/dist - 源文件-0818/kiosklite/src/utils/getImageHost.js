import { getCookie } from '../utils/index';
import { serverURL } from '../constants/serverURL';

/** 优先使用 kioskServerIP（嵌入时为同源 /kpos/）；不再要求 cookie 含 22080 */
const cookieHost = getCookie('kioskServerIP');
const IMG_HOST = cookieHost || serverURL;

export default IMG_HOST;
