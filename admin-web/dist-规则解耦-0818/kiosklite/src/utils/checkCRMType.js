const checkCRMType = (allSysConfig) => {
  const {
    CRM_SERVICE_ENABLED,
    POS_CRM_SERVICE_ENABLED,
    CRM_INTEGRATION_SERVICE_ENABLED,
  } = allSysConfig;
  let crm = 0;
  const crmConfig = POS_CRM_SERVICE_ENABLED || CRM_SERVICE_ENABLED;
  if (crmConfig === 'true') {
    crm = 1;
  }
  if (CRM_INTEGRATION_SERVICE_ENABLED === 'true') {
    crm = 2;
  }
  return crm;
};

export default checkCRMType;
