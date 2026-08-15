export const formatUSPhoneNumber = (phoneNumber) => {
  if (phoneNumber?.length < 10) {
    return phoneNumber
  }
  const match = phoneNumber.match(/^(\d{3})(\d{3})(\d{4})$/)
  return '(' + match[1] + ') ' + match[2] + '-' + match[3]
}
