(function (window) {
  var isAndroidShell = window.navigator.userAgent.indexOf("MenusifuAndroidShell") > -1;
  if (!window.WebViewJavascriptBridge && isAndroidShell) {
    console.log("android init WebViewJavascriptBridge");
    var messageHandlers = {};
    var responseCallbacks = {};
    var uniqueId = 1;
    function doSend(message, responseCallback) {
      if (responseCallback) {
        var callbackId = "cb_" + uniqueId++ + "_" + new Date().getTime();
        responseCallbacks[callbackId] = responseCallback;
        message["callbackId"] = callbackId;
      }
      window.normalPipe.postMessage(JSON.stringify(message));
    }
    function registerHandler(handlerName, handler) {
      messageHandlers[handlerName] = handler;
    }
    function callHandler(handlerName, data, responseCallback) {
      if (arguments.length === 2 && typeof data == "function") {
        responseCallback = data;
        data = null;
      }
      doSend({ handlerName: handlerName, data: data }, responseCallback);
    }
    function handleMessageFromNative(messageJSON) {
      var message = JSON.parse(messageJSON);
      var responseCallback;
      if (message.responseId) {
        responseCallback = responseCallbacks[message.responseId];
        if (!responseCallback) {
          return;
        }
        responseCallback(message.responseData);
        delete responseCallbacks[message.responseId];
      } else {
        if (message.callbackId) {
          var callbackResponseId = message.callbackId;
          responseCallback = function (responseData) {
            doSend({
              handlerName: message.handlerName,
              responseId: callbackResponseId,
              responseData: responseData,
            });
          };
        }
        var handler = messageHandlers[message.handlerName];
        if (!handler) {
          console.log(
            "WebViewJavascriptBridge: WARNING: no handler for message from Java:",
            message
          );
        } else {
          handler(message.data, responseCallback);
        }
      }
    }
    window.WebViewJavascriptBridge = {
      registerHandler: registerHandler,
      callHandler: callHandler,
      handleMessageFromNative: handleMessageFromNative,
    };
  }
})(window);
