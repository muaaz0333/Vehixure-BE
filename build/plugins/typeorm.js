import fp from "fastify-plugin";
import { DataSource } from "typeorm";
import "reflect-metadata";
import { User } from "../entities/User.js";
import { Warranty } from "../entities/Warranty.js";
import { WarrantyTerms } from "../entities/WarrantyTerms.js";
import { Photo } from "../entities/Photo.js";
import { AnnualInspection } from "../entities/AnnualInspection.js";
import { AuditHistory } from "../entities/AuditHistory.js";
import { SystemConfig } from "../entities/SystemConfig.js";
import { PartnerAccount } from "../entities/PartnerAccount.js";
import { VerificationToken } from "../entities/VerificationToken.js";
export let AppDataSource;
const typeormPlugin = async (server) => {
  try {
    AppDataSource = new DataSource({
      type: "postgres",
      host: process.env.DB_HOST || "localhost",
      port: +(process.env.DB_PORT || 5432),
      username: process.env.DB_USER || "postgres",
      password: process.env.DB_PASS || "postgres",
      database: process.env.DB_NAME || "postgres",
      synchronize: false,
      // disabled to avoid timeout issues
      logging: false,
      // Disable logging for cleaner output
      entities: [
        User,
        PartnerAccount,
        Warranty,
        WarrantyTerms,
        Photo,
        AnnualInspection,
        AuditHistory,
        SystemConfig,
        VerificationToken
      ]
    });
    await AppDataSource.initialize();
    server.log.info("\u2705 Database connected");
    server.decorate("db", AppDataSource);
  } catch (err) {
    server.log.error({ err }, "\u274C Database connection failed");
    throw err;
  }
};
export default fp(typeormPlugin);
