import getLocalSearch from '../utils/getLocalSearch';
let location = window.location;
let url = getLocalSearch(window.location.href);
let ip = location.hostname;
let port = process.env.NODE_ENV === 'development' ? '22080' : location.port;
let clientPort = url.port || '52222';
let receiptIp = url.ip || '127.0.0.1';
let baseURL = {
  backUrl:
    'http://' + ip + ':' + port + '/kpos/webapp/payment/upload/signature',
  returnUrl:
    'http://' + receiptIp + ':' + clientPort + '/device/dualscreen/main',
};
export { baseURL };
