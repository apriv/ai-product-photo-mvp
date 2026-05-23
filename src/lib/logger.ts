import winston from "winston";
import path from "path";

const logDir = process.env.LOG_DIR || "/var/log";

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "info",
  format: winston.format.combine(
    winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    winston.format.errors({ stack: true }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let msg = `[${timestamp}] ${level.toUpperCase()} - ${message}`;
      if (Object.keys(meta).length > 0) {
        msg += ` ${JSON.stringify(meta)}`;
      }
      return msg;
    })
  ),
  defaultMeta: { service: "ai-product-photo" },
  transports: [
    new winston.transports.File({
      filename: path.join(logDir, "ai-product-photo-error.log"),
      level: "error",
    }),
    new winston.transports.File({
      filename: path.join(logDir, "ai-product-photo.log"),
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      ),
    })
  );
}

export default logger;
