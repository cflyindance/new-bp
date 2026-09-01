const checkCRMStatus = (allSysConfig) => {
  const { CRM_SERVICE_ENABLED, CRM_INTEGRATION_SERVICE_ENABLED } = allSysConfig;
  // 是否关闭
  return (
    (!CRM_SERVICE_ENABLED || CRM_SERVICE_ENABLED === 'false') &&
    (!CRM_INTEGRATION_SERVICE_ENABLED ||
      CRM_INTEGRATION_SERVICE_ENABLED === 'false')
  );
};

export default checkCRMStatus;
