export const dbConfig = {
  host: process.env.DB_HOST || "199.192.27.131",
  port: parseInt(process.env.DB_PORT || "5432"),
  database: process.env.DB_NAME || "warrantyDb",
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASS || "BP7zks9fgqRAIWnIw4b3i18YIKxFn5hikzyTh6fA61FBwayfBlgL22xGcYHGY4bo"
};
