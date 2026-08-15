import { getPlatformType } from './utils'

class KeyBoardInstance {
  constructor() {}

  getKeyboardHeight(keyboardInfo) {
    if (getPlatformType().isAndroid) {
      // 兼容壳子版本
      if (!keyboardInfo) {
        window.currentInputEle = null
        return
      }
      // 空白盒子
      const perchDiv = document.getElementById('perchDiv')
      const boxHeight = perchDiv.clientHeight
      if (boxHeight) {
        perchDiv.style.height = '0px'
      }
      // 键盘高度
      const { height } = keyboardInfo
      const dprHeight = height / window.devicePixelRatio
      const inputEle = window.currentInputEle
      // const eleHeight = inputEle.clientHeight
      const bottom = inputEle.getBoundingClientRect().bottom
      // 键盘y轴距离
      const keyBoardTopPosition = document.body.clientHeight - dprHeight
      if (bottom > keyBoardTopPosition) {
        const bodyHeight = bottom - keyBoardTopPosition + 20 // + eleHeight
        perchDiv.style.height = `${bodyHeight}px`
        // const perchDiv = document.createElement('div')
        // perchDiv.className = 'perchDiv'
        // perchDiv.style.height = `${bodyHeight}px`
        // perchDiv.style.width = '100%'
        // perchDiv.style.background = '#fff'
        // document.body.appendChild(perchDiv)
        // const t = setTimeout(() => {
        window.scrollTo({
          left: 0,
          top: document.body.scrollHeight,
          // behavior: 'smooth',
        })
        //clearTimeout(t)
        // }, 150)
      }
    }
  }

  removeBoxFromBody() {
    if (getPlatformType().isAndroid) {
      window.currentInputEle.blur()
      window.currentInputEle = null
      const perchDiv = document.getElementById('perchDiv')
      perchDiv.style.height = '0px'
    }
  }

  checkIfNeedBounce(inputEle) {
    if (getPlatformType().isAndroid) {
      window.currentInputEle = inputEle
    }
  }
}

export default new KeyBoardInstance()
