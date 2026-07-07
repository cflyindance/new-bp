/**
 * 屏保主题视频等大文件存 IndexedDB，localStorage 仅存 { type:'video', mediaRef }，避免配额溢出。
 */
(function (global) {
  var DB_NAME = 'MenuSifu_kiosk_theme_media';
  var STORE = 'blobs';
  var DB_VER = 1;

  function supported() {
    return !!global.indexedDB;
  }

  function openDb() {
    return new Promise(function (resolve, reject) {
      if (!supported()) {
        reject(new Error('IDB_UNSUPPORTED'));
        return;
      }
      var req = global.indexedDB.open(DB_NAME, DB_VER);
      req.onerror = function () {
        reject(req.error);
      };
      req.onupgradeneeded = function (e) {
        var db = e.target.result;
        if (!db.objectStoreNames.contains(STORE)) {
          db.createObjectStore(STORE);
        }
      };
      req.onsuccess = function () {
        resolve(req.result);
      };
    });
  }

  function put(id, blobOrFile) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).put(blobOrFile, id);
        tx.oncomplete = function () {
          resolve(id);
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function get(id) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readonly');
        var r = tx.objectStore(STORE).get(id);
        r.onsuccess = function () {
          resolve(r.result != null ? r.result : null);
        };
        r.onerror = function () {
          reject(r.error);
        };
      });
    });
  }

  function del(id) {
    return openDb().then(function (db) {
      return new Promise(function (resolve, reject) {
        var tx = db.transaction(STORE, 'readwrite');
        tx.objectStore(STORE).delete(id);
        tx.oncomplete = function () {
          resolve();
        };
        tx.onerror = function () {
          reject(tx.error);
        };
      });
    });
  }

  function newMediaId() {
    return 'kvm_' + Date.now() + '_' + Math.random().toString(36).slice(2, 12);
  }

  global.KioskThemeMediaIdb = {
    supported: supported,
    newMediaId: newMediaId,
    put: put,
    get: get,
    del: del
  };
})(typeof window !== 'undefined' ? window : this);
