import { FastifyReply } from 'fastify';

function sanitize(obj: any): any {
  const seen = new WeakSet();
  const sensitiveKeys = new Set(['password']);

  function _sanitize(value: any): any {
    if (value === null || value === undefined) return value;
    if (value instanceof Date) return value.toISOString();
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
    if (Array.isArray(value)) return value.map((v) => _sanitize(v));
    if (typeof value === 'object') {
      if (seen.has(value)) return undefined; // avoid cycles
      seen.add(value);
      const out: any = Array.isArray(value) ? [] : {};
      for (const key of Object.keys(value)) {
        if (sensitiveKeys.has(key)) continue;
        try {
          out[key] = _sanitize((value as any)[key]);
        } catch (e) {
          // ignore properties that throw on access
        }
      }
      return out;
    }
    return value;
  }

  return _sanitize(obj);
}

const successResponse = (
  reply: FastifyReply,
  data: any,
  statusCode = 200
): void => {
  const payload = data && data.data !== undefined ? { ...data, data: sanitize(data.data) } : sanitize(data);
  if (payload && (payload.data || payload.success !== undefined)) {
    reply.code(statusCode).send(payload);
  } else {
    reply.code(statusCode).send({ data: payload });
  }
};

const errorResponse = (
  reply: FastifyReply,
  message: string = 'Server Error',
  statusCode = 500,
  code: number = statusCode
): void => {
  console.error('❌ error =>', message);
  reply.code(statusCode).send({
    message,
    code,
  });
};

const showAll = (
  reply: FastifyReply,
  collection: any[],
  statusCode = 200
): void => {
  reply.code(statusCode).send({ data: sanitize(collection) });
};

const showOne = (
  reply: FastifyReply,
  model: any,
  statusCode = 200
): void => {
  const payload = sanitize(model);
  if (payload && payload.success !== undefined && payload.message) {
    reply.code(statusCode).send(payload);
  } else {
    reply.code(statusCode).send({ data: payload });
  }
};

export default {
  successResponse,
  errorResponse,
  showAll,
  showOne,
};
