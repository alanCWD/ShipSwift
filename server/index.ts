import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupAuth } from "./replitAuth";
import { setupVite, serveStatic, log } from "./vite";
import { isAllowedOrigin, getDefaultAllowedOrigin } from "./domainValidation";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// CORS and iframe embedding support
app.use((req, res, next) => {
  // Allow credentials for cross-origin requests
  res.header('Access-Control-Allow-Credentials', 'true');
  
  // Allow embedding in iframes from any domain
  res.removeHeader('X-Frame-Options'); // Remove default frame restrictions
  
  // Set CORS headers for API requests - strict allowlist with exact matching
  const origin = req.headers.origin;
    
  if (origin && isAllowedOrigin(origin)) {
    res.header('Access-Control-Allow-Origin', origin);
  } else if (!origin) {
    // For iframe contexts without Origin header, validate referring domain
    const referer = req.headers.referer;
    if (referer) {
      try {
        const refererUrl = new URL(referer);
        if (isAllowedOrigin(refererUrl.origin)) {
          res.header('Access-Control-Allow-Origin', refererUrl.origin);
        }
        // Don't set ACAO header for disallowed referers
      } catch (e) {
        // Don't set ACAO header for invalid referers
      }
    }
    // Don't set ACAO header when no Origin or Referer
  }
  // Don't set ACAO header for disallowed origins
  
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With, Accept, Origin, Cookie, Set-Cookie');
  
  // Additional headers for iframe compatibility and security
  res.header('Cross-Origin-Embedder-Policy', 'cross-origin');
  res.header('Cross-Origin-Opener-Policy', 'cross-origin');
  res.header('Content-Security-Policy', 'frame-ancestors https://replit.com https://*.replit.com;');
  
  // Handle preflight requests
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
});

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Setup Replit Auth before other routes
  await setupAuth(app);
  
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const port = parseInt(process.env.PORT || '5000', 10);
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true,
  }, () => {
    log(`serving on port ${port}`);
  });
})();
