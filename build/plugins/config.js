import "dotenv/config";
import fp from "fastify-plugin";
import { Type } from "@sinclair/typebox";
import Ajv from "ajv";
export var NodeEnv = /* @__PURE__ */ ((NodeEnv2) => {
  NodeEnv2["development"] = "development";
  NodeEnv2["test"] = "test";
  NodeEnv2["production"] = "production";
  return NodeEnv2;
})(NodeEnv || {});
const ConfigSchema = Type.Object({
  NODE_ENV: Type.Enum(NodeEnv),
  LOG_LEVEL: Type.String(),
  API_HOST: Type.String(),
  API_PORT: Type.String()
});
const ajv = new Ajv({
  allErrors: true,
  removeAdditional: true,
  useDefaults: true,
  coerceTypes: true,
  allowUnionTypes: true
});
const configPlugin = async (server) => {
  const validate = ajv.compile(ConfigSchema);
  const valid = validate(process.env);
  if (!valid) {
    throw new Error(
      ".env file validation failed - " + JSON.stringify(validate.errors, null, 2)
    );
  }
  server.decorate("config", process.env);
};
export default fp(configPlugin);
