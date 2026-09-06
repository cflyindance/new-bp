(function () {
  "use strict";

  var stores = [
    { id: "ny-midtown", name: "纽约中城店", mid: "100001", zone: "America/New_York", address: "349 5th Ave, New York, NY 10016, USA", order: 1 },
    { id: "flushing", name: "法拉盛店", mid: "100002", zone: "America/New_York", address: "39-16 Prince St, Flushing, NY 11354, USA", order: 2 },
    { id: "brooklyn", name: "布鲁克林店", mid: "100003", zone: "America/New_York", address: "445 Albee Square W, Brooklyn, NY 11201, USA", order: 3 },
    { id: "boston", name: "波士顿店", mid: "100004", zone: "America/New_York", address: "1 Washington Mall, Boston, MA 02108, USA", order: 4 }
  ];

  window.OrderLimitStoreCatalog = stores.map(function (store) {
    return Object.freeze(Object.assign({}, store));
  });
})();
