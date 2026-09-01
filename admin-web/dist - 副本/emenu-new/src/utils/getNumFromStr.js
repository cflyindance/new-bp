const GetNumFromStr = (str) => {
  const val = String(str)
  const regex = /(\d+(\.\d+)?)/g
  const matches = val.match(regex)

  return Number(matches?.[0])
}

export default GetNumFromStr
