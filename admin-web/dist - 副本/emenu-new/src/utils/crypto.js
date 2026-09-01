import CryptoJS from 'crypto-js'

const cfg = {
  iv: CryptoJS.enc.Utf8.parse('FhRfDfgfdTrfG28H'),
  mode: CryptoJS.mode.CBC,
  padding: CryptoJS.pad.Pkcs7,
}

export const encryptString = (clearText) => {
  const encryptedText = CryptoJS.AES.encrypt(
    String(clearText || ''),
    cfg.iv,
    cfg
  )
  const codes = CryptoJS.enc.Utf8.parse(encryptedText)
  return CryptoJS.enc.Hex.stringify(codes)
}
