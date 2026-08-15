/**
 * Promise 链收尾回调的 WebView 兼容实现（替代 Promise.prototype.finally）。
 * 项目内统一使用此函数，避免旧版 WebView 报 ".finally is not a function"。
 */
export function promiseFinally(promise, onFinally) {
  const runFinally = () => Promise.resolve(onFinally());
  return promise.then(
    (value) => runFinally().then(() => value),
    (reason) =>
      runFinally().then(() => {
        throw reason;
      })
  );
}
