import { XMLObjTree } from '@/utils/ObjectTree';

export const parseLicenseXml = (data) => {
  let findAppInstances = data;
  let start = findAppInstances?.indexOf('<soap:Body>');
  let end = findAppInstances?.indexOf('</soap:Body>');
  findAppInstances = findAppInstances?.substring(start + 11, end);
  let objTree = new XMLObjTree();
  let instanceList = objTree.parseXML(findAppInstances);
  let r = instanceList?.listsystemconfigurationsresponsetype?.systemconfiguration;
  return r;
};
