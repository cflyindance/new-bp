import { getMarginappFetchConfig } from "@/api";
import { getCookie } from ".";
import { postMarginappConfig } from "@/api/kioskConfigApi";
import { cloneDeep } from "lodash";

// 获取kiosk中存储的桌子数据，clear是否清理当前lisense下的桌子
export const getChooseTableStatus = async (clear) => {
  try {
    const res = await getMarginappFetchConfig();
    if (res.data?.result?.successful) {
      let list = res.data.marginAppConfigTypes || [];
      let obj = list.find((l) => l.product == 'KIOSKLITE');
      if (obj && obj.data) {
        let arr = JSON.parse(obj.data);
        if (arr.configList) {
          const kioskTableInUseConfig = arr.configList.find(e => e.id === 41);
          if (kioskTableInUseConfig) {
            const kioskTableInUse = kioskTableInUseConfig.value || [];
            const kioskLicense = getCookie('kioskLicense');
            const kioskTableInUseFiltered = kioskTableInUse.filter(_ => _.lisense !== kioskLicense);
  
            if (clear && (kioskTableInUseFiltered.length < kioskTableInUse.length)) {
              kioskTableInUseConfig.value = kioskTableInUseFiltered;
              await postMarginappConfig(JSON.stringify(cloneDeep(arr)), getCookie('sessionKey'));
            }

            return kioskTableInUseFiltered
          }
        }
      }
    }
  } catch (e) {}
}
