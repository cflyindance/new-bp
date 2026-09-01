function isValidJSON(str) {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

const getPosVersion = (posVersion) => {
  if (posVersion) {
    const posStr = isValidJSON(posVersion)
      ? JSON.parse(posVersion)
      : posVersion;
    let posArr = posStr.split('.');

    // 去掉最后一项版本提交的hash值
    posArr = posArr.slice(0, -1);
    posArr = posArr.map((part) => part.replace(/-fast-\d+$/, ''));
    // （前4项为1.8.0.30固定的前缀）从下标4开始的项补齐两位数，小于10在前面补零
    for (let i = 4; i < posArr.length; i++) {
      const num = parseInt(posArr[i], 10);
      if (!isNaN(num) && num < 10) {
        posArr[i] = String(num).padStart(2, '0');
      }
    }

    // 如果posArr长度小于7，后面补项00，保证版本号精细到30.xx.xx.xx
    while (posArr.length < 7) {
      posArr.push('00');
    }

    // 版本号转数字 用来做比较
    const result = Number(posArr.join(''));
    return result;
  }
  return 0;
};

export default getPosVersion;
