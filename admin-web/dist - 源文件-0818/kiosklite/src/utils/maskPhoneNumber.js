const maskPhoneNumber = (phoneNumber, showTotalPhone) => {
  const tempPhone = phoneNumber.replace(/\D/g, '');
  return showTotalPhone
    ? tempPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-$2-$3')
    : tempPhone.replace(/(\d{3})(\d{3})(\d{4})/, '$1-XXX-$3');
};

export default maskPhoneNumber;
