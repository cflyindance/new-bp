import { homeHash } from '@/constants/mockData';

const packagePath = (pathList) => {
  const SHOW_LOGO_PAGE = [];
  homeHash.forEach((n) => {
    if (n == '#/index') {
      pathList.forEach((p) => {
        SHOW_LOGO_PAGE.push(n + '/' + p);
      });
    } else {
      pathList.forEach((p) => {
        SHOW_LOGO_PAGE.push(n + p);
      });
    }
  });
  return SHOW_LOGO_PAGE;
};

export default packagePath;
