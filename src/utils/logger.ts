import winston from "winston";
import path from "path";
import fs from "fs";

const logsDir = path.join(process.cwd(), "logs");
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

const consoleFormat = winston.format.combine(
  winston.format.timestamp({ format: "HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...meta }) => {
    const metaStr = Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
    return `${timestamp} [${level}] ${message}${metaStr}`;
  })
);

export const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || "warn",
  format: logFormat,
  transports: [
    new winston.transports.File({
      filename: path.join(logsDir, "combined.log"),
      maxsize: 5242880,
      maxFiles: 3,
    }),
    new winston.transports.File({
      filename: path.join(logsDir, "error.log"),
      level: "error",
      maxsize: 5242880,
      maxFiles: 3,
    }),
  ],
});

if (process.env.NODE_ENV !== "production") {
  logger.add(
    new winston.transports.Console({
      format: consoleFormat,
      level: "error",
    })
  );
}

export const tradeLogger = {
  opportunity: (data: any) => {
    logger.info("OPPORTUNITY_FOUND", { type: "opportunity", ...data });
  },
  executed: (data: any) => {
    logger.info("TRADE_EXECUTED", { type: "trade", ...data });
  },
  failed: (data: any) => {
    logger.error("TRADE_FAILED", { type: "trade_error", ...data });
  },
};

export const monitorLogger = {
  started: () => logger.info("MONITOR_STARTED"),
  stopped: () => logger.info("MONITOR_STOPPED"),
  error: (error: Error) => {
    logger.error("MONITOR_ERROR", { error: error.message, stack: error.stack });
  },
};

export default logger;
