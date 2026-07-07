/**
 * eMenu Pro 嵌入 BPlant 时的本地 Mock API。
 * 在应用 bundle 加载前注入，拦截菜单、图片上传、模板配置等请求。
 */
(function () {
  if (!document.documentElement.classList.contains("menusifu-embedded")) {
    return;
  }

  var SESSION_KEY = "bplant-emenu-pro-demo";
  var TEMPLATE_STORAGE_KEY = "bplant-emenu-pro-template";
  var UPLOAD_IMAGE_OK = "Image has been successfully uploaded";
  var uploadedImages = Object.create(null);

  function loadStoredTemplate() {
    try {
      var raw = sessionStorage.getItem(TEMPLATE_STORAGE_KEY);
      if (!raw) return null;
      var parsed = JSON.parse(raw);
      return parsed && parsed.version ? parsed : null;
    } catch (e) {
      return null;
    }
  }

  function persistTemplate(template) {
    try {
      if (template && template.version) {
        sessionStorage.setItem(TEMPLATE_STORAGE_KEY, JSON.stringify(template));
      } else {
        sessionStorage.removeItem(TEMPLATE_STORAGE_KEY);
      }
    } catch (e) {
      /* ignore quota errors */
    }
  }

  /** v0.0.7 绑定菜品/添加分组树用 i18n(id, ns)，需 fieldDisplayNameGroups 注册翻译 */
  function withMenuI18n(item) {
    if (!item || !item.name) return item;
    return Object.assign({}, item, {
      fieldDisplayNameGroups: [
        {
          fieldName: "name",
          fieldDisplayNames: [
            { languageCode: "zh-cn", name: item.name },
            { languageCode: "en", name: item.name },
          ],
        },
      ],
    });
  }

  function enrichMenuTree(menus) {
    return menus.map(function (menu) {
      return Object.assign(withMenuI18n(menu), {
        menuGroups: (menu.menuGroups || []).map(function (group) {
          return Object.assign(withMenuI18n(group), {
            menuCategories: (group.menuCategories || []).map(function (category) {
              return Object.assign(withMenuI18n(category), {
                saleItems: (category.saleItems || []).map(withMenuI18n),
              });
            }),
          });
        }),
      });
    });
  }

  var MENU_RESPONSE = {
    code: 0,
    msg: "success",
    data: {
      menus: enrichMenuTree([
        {
          id: 1,
          name: "主菜单",
          menuGroups: [
            {
              id: 101,
              name: "烧烤",
              menuCategories: [
                {
                  id: 1001,
                  name: "招牌烧烤",
                  saleItems: [
                    { id: 10001, name: "炭烤羊排" },
                    { id: 10002, name: "蜜汁鸡翅" },
                    { id: 10003, name: "孜然牛肉串" },
                  ],
                },
                {
                  id: 1002,
                  name: "海鲜烧烤",
                  saleItems: [
                    { id: 10004, name: "蒜蓉烤生蚝" },
                    { id: 10005, name: "椒盐烤虾" },
                  ],
                },
              ],
            },
            {
              id: 102,
              name: "火锅",
              menuCategories: [
                {
                  id: 2001,
                  name: "特色锅底",
                  saleItems: [
                    { id: 20001, name: "秘制原味锅" },
                    { id: 20002, name: "秘制香辣锅" },
                    { id: 20003, name: "秘制鸳鸯锅" },
                    { id: 20004, name: "上素香菇锅" },
                  ],
                },
                {
                  id: 2002,
                  name: "涮品",
                  saleItems: [
                    { id: 20005, name: "精品肥牛" },
                    { id: 20006, name: "鲜切羊肉" },
                    { id: 20007, name: "手工虾滑" },
                  ],
                },
              ],
            },
            {
              id: 103,
              name: "凉菜",
              menuCategories: [
                {
                  id: 3001,
                  name: "经典凉菜",
                  saleItems: [
                    { id: 30001, name: "凉拌黄瓜" },
                    { id: 30002, name: "口水鸡" },
                    { id: 30003, name: "夫妻肺片" },
                  ],
                },
              ],
            },
            {
              id: 104,
              name: "主食",
              menuCategories: [
                {
                  id: 4001,
                  name: "面点主食",
                  saleItems: [
                    { id: 40001, name: "扬州炒饭" },
                    { id: 40002, name: "葱油拌面" },
                    { id: 40003, name: "手工水饺" },
                  ],
                },
              ],
            },
            {
              id: 105,
              name: "饮品",
              menuCategories: [
                {
                  id: 5001,
                  name: "冷热饮品",
                  saleItems: [
                    { id: 50001, name: "鲜榨西瓜汁" },
                    { id: 50002, name: "冰镇酸梅汤" },
                    { id: 50003, name: "港式奶茶" },
                  ],
                },
              ],
            },
          ],
        },
      ]),
    },
  };

  var savedTemplateData = loadStoredTemplate();

  /** v0.0.7：嵌入演示态默认分辨率 1920×1200（16:10） */
  var EMBED_CANVAS_WIDTH = 1920;
  var EMBED_CANVAS_HEIGHT = 1200;

  function createPlaceholderPage(groupId, categoryId) {
    var gid = String(groupId);
    var cid = String(categoryId);
    return {
      component: "Container",
      id: "emenu-ph-" + gid + "-" + cid,
      sort: 1,
      groupId: gid,
      categoryId: cid,
      children: [
        {
          id: "emenu-ph-page-" + gid + "-" + cid,
          component: "Page",
          style: {},
          props: {
            imgUrl: "",
          },
        },
      ],
      props: {
        visible: {
          value: true,
        },
      },
    };
  }

  function ensurePlaceholderPages(template) {
    if (!template || !Array.isArray(template.globalData)) {
      return template;
    }

    var changed = false;
    template.globalData = template.globalData.map(function (group) {
      if (!group || !Array.isArray(group.children)) return group;
      return Object.assign({}, group, {
        children: group.children.map(function (category) {
          if (!category) return category;
          if (Array.isArray(category.pageData) && category.pageData.length > 0) {
            return category;
          }
          changed = true;
          return Object.assign({}, category, {
            pageData: [
              createPlaceholderPage(group.groupId, category.categoryId),
            ],
          });
        }),
      });
    });

    if (changed && !(template.currentPageData && template.currentPageData.id)) {
      var firstGroup = template.globalData[0];
      var firstCategory =
        firstGroup && firstGroup.children && firstGroup.children[0];
      var firstPage =
        firstCategory &&
        firstCategory.pageData &&
        firstCategory.pageData[0];
      if (firstPage) {
        template.currentPageData = firstPage;
      }
    }

    return template;
  }

  function createEmptyTemplatePayload() {
    return {
      version: "0.0.7",
      width: EMBED_CANVAS_WIDTH,
      height: EMBED_CANVAS_HEIGHT,
      viewportWidth: 1280,
      viewportHeight: 800,
      direction: "horizontal",
      status: "draft",
      aspectRatio: "16 / 10",
      globalData: [],
      globalBlocks: [],
      currentPageData: {},
      currentBlock: {},
      lastUpdateTime: Date.now(),
    };
  }

  function applyEmbedDefaultResolution(template) {
    if (!template) return template;
    if (template.width === 8192 && template.height === 8192) {
      template.width = EMBED_CANVAS_WIDTH;
      template.height = EMBED_CANVAS_HEIGHT;
      template.viewportWidth = 1280;
      template.viewportHeight = 800;
      template.direction = "horizontal";
      template.aspectRatio = "16 / 10";
    }
    return template;
  }

  function normalizeTemplate(template) {
    if (!template || !template.version) return template;
    return ensurePlaceholderPages(applyEmbedDefaultResolution(template));
  }

  function fetchConfigResponse() {
    var templatePayload = normalizeTemplate(
      savedTemplateData || createEmptyTemplatePayload()
    );
    savedTemplateData = templatePayload;
    persistTemplate(templatePayload);

    return {
      result: { successful: true },
      marginAppConfigTypes: [
        {
          product: "EMENUPRO",
          data: JSON.stringify(templatePayload),
        },
      ],
    };
  }

  function companyProfileResponse() {
    var images = Object.keys(uploadedImages).map(function (uid) {
      var entry = uploadedImages[uid];
      return {
        name: uid,
        url: entry.url,
      };
    });

    return {
      code: 0,
      msg: "success",
      data: {
        company: {
          images: images,
        },
      },
    };
  }

  function configSaveResponse() {
    return { result: { successful: true } };
  }

  function matchUrl(url) {
    if (!url) return "";
    try {
      if (url.indexOf("http") === 0) {
        var parsed = new URL(url, window.location.origin);
        return parsed.pathname + parsed.search;
      }
    } catch (e) {
      /* ignore */
    }
    return String(url);
  }

  function extractUploadUid(path) {
    var match = path.match(/\/file\/image\/upload\/kiosk\/([^/?]+)/);
    return match ? match[1] : null;
  }

  function rememberUploadFile(uid, body) {
    if (!uid || !(body instanceof FormData)) return;
    var file = body.get("file");
    if (!file || typeof file !== "object") return;

    var objectUrl = URL.createObjectURL(file);
    uploadedImages[uid] = {
      url: "webapp/file/image/" + uid + "/" + (file.name || uid + ".jpg"),
      objectUrl: objectUrl,
      fileName: file.name || uid,
    };
  }

  function resolveMock(method, url, body) {
    var path = matchUrl(url);
    var upperMethod = String(method || "GET").toUpperCase();

    if (path.indexOf("/menu/menu") >= 0 && upperMethod === "GET") {
      return { kind: "json", payload: MENU_RESPONSE };
    }

    if (path.indexOf("/company/profile/fetch") >= 0 && upperMethod === "GET") {
      return { kind: "json", payload: companyProfileResponse() };
    }

    if (path.indexOf("/file/image/upload/kiosk/") >= 0 && upperMethod === "POST") {
      var uid = extractUploadUid(path);
      rememberUploadFile(uid, body);
      return { kind: "text", payload: UPLOAD_IMAGE_OK };
    }

    if (path.indexOf("/kpos/webapp/marginapp/fetchConfig") >= 0 && upperMethod === "POST") {
      return { kind: "json", payload: fetchConfigResponse() };
    }

    if (path.indexOf("/kpos/webapp/marginapp/config") >= 0 && upperMethod === "POST") {
      if (body) {
        try {
          var payload = typeof body === "string" ? JSON.parse(body) : body;
          var configType = payload && payload.marginAppConfigType;
          if (configType && configType.data) {
            var parsedTemplate = JSON.parse(configType.data);
            if (parsedTemplate && parsedTemplate.version) {
              savedTemplateData = normalizeTemplate(parsedTemplate);
              persistTemplate(savedTemplateData);
            } else {
              savedTemplateData = null;
              persistTemplate(null);
            }
          }
        } catch (e) {
          /* ignore parse errors */
        }
      }
      return { kind: "json", payload: configSaveResponse() };
    }

    return null;
  }

  function dispatchXhrDone(xhr, mockResult) {
    var text =
      mockResult.kind === "text"
        ? String(mockResult.payload)
        : JSON.stringify(mockResult.payload);

    Object.defineProperty(xhr, "readyState", { configurable: true, value: 4 });
    Object.defineProperty(xhr, "status", { configurable: true, value: 200 });
    Object.defineProperty(xhr, "statusText", { configurable: true, value: "OK" });
    Object.defineProperty(xhr, "responseText", { configurable: true, value: text });
    Object.defineProperty(xhr, "response", { configurable: true, value: text });

    if (typeof xhr.onreadystatechange === "function") {
      xhr.onreadystatechange();
    }
    if (typeof xhr.onload === "function") {
      xhr.onload();
    }
    xhr.dispatchEvent(new Event("readystatechange"));
    xhr.dispatchEvent(new Event("load"));
    xhr.dispatchEvent(new Event("loadend"));
  }

  var NativeXHR = window.XMLHttpRequest;
  function PatchedXHR() {
    var xhr = new NativeXHR();
    var requestMethod = "GET";
    var requestUrl = "";
    var requestBody = null;

    var nativeOpen = xhr.open;
    xhr.open = function (method, url) {
      requestMethod = method;
      requestUrl = url;
      return nativeOpen.apply(xhr, arguments);
    };

    var nativeSend = xhr.send;
    xhr.send = function (body) {
      requestBody = body;
      var mockResult = resolveMock(requestMethod, requestUrl, requestBody);
      if (mockResult) {
        setTimeout(function () {
          dispatchXhrDone(xhr, mockResult);
        }, 0);
        return;
      }
      return nativeSend.apply(xhr, arguments);
    };

    return xhr;
  }
  PatchedXHR.prototype = NativeXHR.prototype;
  window.XMLHttpRequest = PatchedXHR;

  var nativeFetch = window.fetch;
  if (typeof nativeFetch === "function") {
    window.fetch = function (input, init) {
      var url = typeof input === "string" ? input : input && input.url;
      var method = (init && init.method) || "GET";
      var body = init && init.body;
      var mockResult = resolveMock(method, url, body);
      if (mockResult) {
        if (mockResult.kind === "text") {
          return Promise.resolve(
            new Response(mockResult.payload, {
              status: 200,
              headers: { "Content-Type": "text/plain; charset=utf-8" },
            })
          );
        }
        return Promise.resolve(
          new Response(JSON.stringify(mockResult.payload), {
            status: 200,
            headers: { "Content-Type": "application/json" },
          })
        );
      }
      return nativeFetch.apply(this, arguments);
    };
  }

  function extractImageUid(src) {
    var match = String(src).match(/\/file\/image\/([^/]+)/);
    return match ? match[1] : null;
  }

  var BLOCK_ICON_FILES = {
    "addToCart.png": "addToCart.svg",
    "soldOut.png": "soldOut.svg",
    "shoppingCart.png": "shoppingCart.svg",
    "home.png": "home.svg",
    "memberLogin.png": "memberLogin.svg",
    "callServer.png": "callServer.svg",
    "clock.png": "clock.svg",
    "changeLanguage.png": "changeLanguage.svg",
    "switchBuffet.png": "switchBuffet.svg",
    "changePartySize.png": "changePartySize.svg",
    "switchTable.png": "switchTable.svg",
    "memberPriceIcon.png": "memberPriceIcon.svg",
    "expand_vertical.png": "expand_vertical.svg",
    "narrow_vertical.png": "narrow_vertical.svg",
  };

  function resolveBlockDefaultIconSrc(src) {
    var value = String(src || "");
    var match = value.match(/(?:\/kpos\/emenuPro\/images\/|\/images\/)([^/?#]+)$/i);
    if (!match) return null;

    var fileName = match[1];
    var mapped = BLOCK_ICON_FILES[fileName] || fileName.replace(/\.png$/i, ".svg");
    return new URL("./images/" + mapped, window.location.href).href;
  }

  function resolveMockImageSrc(src) {
    var uid = extractImageUid(src);
    if (uid && uploadedImages[uid]) {
      return uploadedImages[uid].objectUrl;
    }
    return resolveBlockDefaultIconSrc(src);
  }

  function patchImageSrc() {
    var proto = HTMLImageElement && HTMLImageElement.prototype;
    if (!proto) return;

    var srcDescriptor = Object.getOwnPropertyDescriptor(proto, "src");
    if (srcDescriptor && srcDescriptor.set) {
      Object.defineProperty(proto, "src", {
        configurable: true,
        enumerable: srcDescriptor.enumerable,
        get: srcDescriptor.get,
        set: function (value) {
          var resolved = resolveMockImageSrc(value);
          srcDescriptor.set.call(this, resolved || value);
        },
      });
    }

    var nativeSetAttribute = Element.prototype.setAttribute;
    Element.prototype.setAttribute = function (name, value) {
      if (name === "src" && this instanceof HTMLImageElement) {
        var resolved = resolveMockImageSrc(value);
        if (resolved) {
          return nativeSetAttribute.call(this, name, resolved);
        }
      }
      return nativeSetAttribute.call(this, name, value);
    };
  }

  patchImageSrc();

  var nativePostMessage = Window.prototype.postMessage;
  Window.prototype.postMessage = function (message, targetOrigin, transfer) {
    var result = nativePostMessage.call(this, message, targetOrigin, transfer);
    if (message && message.type === "getSessionKey" && this === window.parent) {
      setTimeout(function () {
        window.dispatchEvent(
          new MessageEvent("message", {
            data: { type: "sessionKey", data: SESSION_KEY },
            origin: window.location.origin,
          })
        );
      }, 30);
    }
    return result;
  };
})();
