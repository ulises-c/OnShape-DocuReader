import express from "express";
import type { Request, Response, NextFunction } from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import cookieParser from "cookie-parser";
import session from "express-session";
import path from "path";
import { fileURLToPath } from "url";
import authRoutes from "./routes/auth.ts";
import apiRoutes from "./routes/api.ts";
import { oauthConfig } from "./config/oauth.ts";
import { SessionStorage } from "./services/session-storage.ts";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;

app.use(
  helmet({
    contentSecurityPolicy:
      process.env.NODE_ENV === "production"
        ? {
            directives: {
              defaultSrc: ["'self'"],
              scriptSrc: [
                "'self'",
                "'sha256-ZswfTY7H35rbv8WC7NXBoiC7WNu86vSzCDChNWwZZDM='",
              ],
              scriptSrcAttr: ["'unsafe-inline'"],
              styleSrc: ["'self'", "'unsafe-inline'"],
              imgSrc: ["'self'", "data:", "https:", "blob:"],
              connectSrc: ["'self'"],
              fontSrc: ["'self'"],
              objectSrc: ["'none'"],
              mediaSrc: ["'self'"],
              frameSrc: ["'none'"],
            },
          }
        : false,
    crossOriginEmbedderPolicy: false,
  })
);

app.use(
  cors({
    origin:
      process.env.NODE_ENV === "production"
        ? process.env.FRONTEND_URL || "http://localhost:3000"
        : ["http://localhost:3000", "http://localhost:5173"],
    credentials: true,
  })
);

// Morgan middleware with explicit stdout to ensure logs appear in console
app.use(
  morgan("dev", {
    stream: {
      write: (message: string) => {
        // Remove trailing newline that morgan adds
        console.log(message.trim());
      },
    },
  })
);
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

const sessionStore = SessionStorage.getInstance();

app.use(
  session({
    store: sessionStore,
    secret:
      process.env.SESSION_SECRET || "your-secret-key-change-in-production",
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === "production",
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === "production" ? "strict" : "lax",
    },
  })
);

// Cleanup expired sessions periodically (every hour)
setInterval(() => {
  sessionStore.cleanup();
}, 60 * 60 * 1000);

app.use("/auth", authRoutes);
app.use("/api", apiRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(
    express.static(path.join(__dirname, "public"), {
      setHeaders: (res, filePath) => {
        if (filePath.endsWith(".js") || filePath.endsWith(".mjs")) {
          res.setHeader(
            "Content-Type",
            "application/javascript; charset=utf-8"
          );
        } else if (filePath.endsWith(".json")) {
          res.setHeader("Content-Type", "application/json; charset=utf-8");
        } else if (filePath.endsWith(".css")) {
          res.setHeader("Content-Type", "text/css; charset=utf-8");
        } else if (filePath.endsWith(".html")) {
          res.setHeader("Content-Type", "text/html; charset=utf-8");
        }
      },
    })
  );

  app.get("/", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public/index.html"));
  });

  app.get("/dashboard", (req: Request, res: Response) => {
    res.sendFile(path.join(__dirname, "public/dashboard.html"));
  });
}

app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error("Error:", err);
  res.status(500).json({
    error: "Internal server error",
    message: process.env.NODE_ENV === "development" ? err.message : undefined,
  });
});

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || "development"}`);
  console.log(`🔐 OAuth configured: ${oauthConfig.clientId ? "Yes" : "No"}`);
  if (process.env.NODE_ENV !== "production") {
    console.log(`🎨 Vite dev server: http://localhost:5173`);
  }
});
