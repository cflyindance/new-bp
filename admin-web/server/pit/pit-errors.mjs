export class PitApiError extends Error {
  constructor(status, code, message, { fields, cause } = {}) {
    super(message, cause ? { cause } : undefined);
    this.name = "PitApiError";
    this.status = status;
    this.code = code;
    if (fields !== undefined) this.fields = fields;
  }
}

function create(status, code, defaultMessage) {
  return (message = defaultMessage, options) => new PitApiError(status, code, message, options);
}

export const invalidRequest = create(400, "invalid_request", "请求内容不合法");
export const authenticationRequired = create(401, "authentication_required", "需要登录");
export const permissionDenied = create(403, "permission_denied", "没有权限执行此操作");
export const notFound = create(404, "not_found", "请求的资源不存在");
export const versionConflict = create(409, "version_conflict", "数据已被其他用户修改");
export const payloadTooLarge = create(413, "file_too_large", "请求内容过大");
export const unsupportedFileType = create(415, "unsupported_file_type", "不支持的内容类型");
export const validationFailed = create(422, "validation_failed", "请求内容不合法");
export const serviceUnavailable = create(503, "service_unavailable", "服务暂时不可用");
export const tooManyRequests = create(429, "too_many_requests", "登录尝试过于频繁，请稍后再试");
