const isHasPot = (carts) => {
  const isHotpotExist = carts.find((item) => item.comboCart?.length > 0)
  return !!isHotpotExist
}

export default isHasPot
