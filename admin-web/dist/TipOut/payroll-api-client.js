/**
 * PayRoll P0 — API 客户端（开发态对接 Vite Mock API，失败时仅本地）
 */
(function (global) {
  "use strict";

  var API_BASE = "/api/v1/payroll";
  var apiAvailable = null;

  function joinUrl(path) {
    return API_BASE + (path.startsWith("/") ? path : "/" + path);
  }

  function request(method, path, body) {
    var opts = { method: method, headers: { Accept: "application/json" } };
    if (body !== undefined) {
      opts.headers["Content-Type"] = "application/json";
      opts.body = JSON.stringify(body);
    }
    return fetch(joinUrl(path), opts).then(function (res) {
      return res.json().then(function (json) {
        return { ok: res.ok, status: res.status, json: json };
      });
    });
  }

  function probeApi() {
    if (apiAvailable !== null) {
      return Promise.resolve(apiAvailable);
    }
    return request("GET", "/health")
      .then(function (r) {
        apiAvailable = !!(r.ok && r.json && r.json.ok);
        return apiAvailable;
      })
      .catch(function () {
        apiAvailable = false;
        return false;
      });
  }

  function getRemoteState() {
    return request("GET", "/state").then(function (r) {
      if (r.status === 404) return null;
      if (!r.ok) throw new Error("payroll_api_state_failed");
      return r.json;
    });
  }

  function putRemoteState(snapshot) {
    return request("PUT", "/state", snapshot).then(function (r) {
      if (!r.ok) throw new Error("payroll_api_save_failed");
      return r.json;
    });
  }

  function getAuditLog(limit) {
    var q = typeof limit === "number" ? "?limit=" + limit : "";
    return request("GET", "/audit-log" + q).then(function (r) {
      if (!r.ok) return { items: [], total: 0 };
      return r.json;
    });
  }

  global.PayrollApiClient = {
    probe: probeApi,
    isEnabled: function () {
      return apiAvailable === true;
    },
    loadSnapshot: function () {
      return probeApi().then(function (on) {
        if (!on) return { source: "local", snapshot: null };
        return getRemoteState().then(function (snap) {
          return { source: snap ? "api" : "local", snapshot: snap };
        });
      });
    },
    saveSnapshot: function (snapshot) {
      return probeApi().then(function (on) {
        if (!on) return { source: "local" };
        return putRemoteState(snapshot).then(function () {
          return { source: "api" };
        });
      });
    },
    fetchAuditLog: function (limit) {
      return probeApi().then(function (on) {
        if (!on) return null;
        return getAuditLog(limit);
      });
    },
  };
})(typeof window !== "undefined" ? window : globalThis);
