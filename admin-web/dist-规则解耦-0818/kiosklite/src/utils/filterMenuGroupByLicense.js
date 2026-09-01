import { getCookie } from '@/utils';

const filterMenuGroupByLicense = (menuGroup, licenseList) => {
  const currentKioskLicense = getCookie('kioskLicense');
  const kioskLicensesIds = licenseList.map((each) => each.id);
  const currentLicenseId = licenseList.find(
    (license) => `${license.displayname}` === currentKioskLicense,
  )?.id;
  return menuGroup.filter((each) => {
    let actualLicense = each.appInstanceIds || [];
    const vpnLicense = actualLicense.filter(
      (licenseId) => !kioskLicensesIds.includes(licenseId),
    )?.[0];
    if (vpnLicense) {
      console.log('vpnLicense', vpnLicense);
      actualLicense = actualLicense.filter((each) => each !== vpnLicense);
    }
    if (!actualLicense?.length) return true;
    return actualLicense.includes(currentLicenseId);
  });
};

export default filterMenuGroupByLicense;
