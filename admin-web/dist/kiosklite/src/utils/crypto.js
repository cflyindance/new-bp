import CryptoJS from 'crypto-js';

const cfg = {
  iv: CryptoJS.enc.Utf8.parse('FhRfDfgfdTrfG28H'), // initialization vector
  mode: CryptoJS.mode.CBC, // use CBC
  padding: CryptoJS.pad.Pkcs7, // in java code : AES/CBC/PKCS5Padding
};

export const encryptString = (clearText) => {
  let t = CryptoJS.AES.encrypt(clearText, cfg.iv, cfg);
  let codes = CryptoJS.enc.Utf8.parse(t);
  return CryptoJS.enc.Hex.stringify(codes);
};

export const decryptString = (cipherText) => {
  try {
    let codes = CryptoJS.enc.Hex.parse(cipherText);
    let utf8Str = CryptoJS.enc.Utf8.stringify(codes);
    return CryptoJS.AES.decrypt(utf8Str, cfg.iv, cfg).toString(
      CryptoJS.enc.Utf8
    );
  } catch (err) {
    console.warn(`Illegal parameters: ${cipherText}`);
    return '';
  }
};
