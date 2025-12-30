function sanitize(obj) {
  const seen = /* @__PURE__ */ new WeakSet();
  const sensitiveKeys = /* @__PURE__ */ new Set(["password"]);
  function _sanitize(value) {
    if (value === null || value === void 0) return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") return value;
    if (Array.isArray(value)) return value.map((v) => _sanitize(v));
    if (typeof value === "object") {
      if (seen.has(value)) return void 0;
      seen.add(value);
      const out = Array.isArray(value) ? [] : {};
      for (const key of Object.keys(value)) {
        if (sensitiveKeys.has(key)) continue;
        try {
          out[key] = _sanitize(value[key]);
        } catch (e) {
        }
      }
      return out;
    }
    return value;
  }
  return _sanitize(obj);
}
const successResponse = (reply, data, statusCode = 200) => {
  const payload = data && data.data !== void 0 ? { ...data, data: sanitize(data.data) } : sanitize(data);
  if (payload && (payload.data || payload.success !== void 0)) {
    reply.code(statusCode).send(payload);
  } else {
    reply.code(statusCode).send({ data: payload });
  }
};
const errorResponse = (reply, message = "Server Error", statusCode = 500, code = statusCode) => {
  console.error("\u274C error =>", message);
  reply.code(statusCode).send({
    message,
    code
  });
};
const showAll = (reply, collection, statusCode = 200) => {
  reply.code(statusCode).send({ data: sanitize(collection) });
};
const showOne = (reply, model, statusCode = 200) => {
  const payload = sanitize(model);
  if (payload && payload.success !== void 0 && payload.message) {
    reply.code(statusCode).send(payload);
  } else {
    reply.code(statusCode).send({ data: payload });
  }
};
export default {
  successResponse,
  errorResponse,
  showAll,
  showOne
};
