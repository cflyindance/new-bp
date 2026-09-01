const getPosVersion = (posVersion) => {
  if (posVersion) {
    let res = posVersion.match(/(\d+)\.(\d+)\.(\d+)\.(\d+)\.(\d+)/)
    return Number(res.slice(1, 6).join(''))
  }
  return 0
}

export default getPosVersion
