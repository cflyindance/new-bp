import { transformLanguageCode } from '../locales/resources'

const initLanguageCode = () => {
  const iframe = window.parent.document.getElementById('innerpage')
  if (iframe) {
    const url = new URL(iframe.src)
    const query = url.hash.split('?')[1]
    const params = query.split('&')
    for (let i = 0; i < params.length; i++) {
      const pair = params[i].split('=')
      if (pair[0] === 'language') {
        localStorage.setItem(
          'emenu_lang',
          JSON.stringify(transformLanguageCode(pair[1] || ''))
        )
      }
    }
  }
}

export default initLanguageCode
