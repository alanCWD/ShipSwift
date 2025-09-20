import {
  discovery,
  buildAuthorizationUrl,
  authorizationCodeGrant,
  refreshTokenGrant,
  buildEndSessionUrl,
  fetchUserInfo,
  randomState,
  randomNonce,
  randomPKCECodeVerifier,
  calculatePKCECodeChallenge,
} from "openid-client";

import session from "express-session";
import type { Express, RequestHandler } from "express";
import memoize from "memoizee";
import connectPg from "connect-pg-simple";
import { storage } from "./storage";
import { isAllowedHostname } from "./domainValidation";

if (!process.env.REPLIT_DOMAINS) {
  throw new Error("Environment variable REPLIT_DOMAINS not provided");
}

// Memoized OIDC discovery
const getOidcConfig = memoize(
  async () => {
    return await discovery(
      new URL(process.env.ISSUER_URL ?? "https://replit.com/oidc"),
      process.env.REPL_ID!,
      process.env.REPL_SECRET
    );
  },
  { maxAge: 3600 * 1000 }
);

export function getSession() {
  const sessionTtl = 7 * 24 * 60 * 60 * 1000; // 1 week
  const pgStore = connectPg(session);
  const sessionStore = new pgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true,
    ttl: sessionTtl,
    tableName: "sessions",
  });
  return session({
    secret: process.env.SESSION_SECRET!,
    store: sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      secure: false, // Set to false for development - auto-detect in production
      maxAge: sessionTtl,
      sameSite: 'lax', // More permissive for development while still secure
    },
  });
}

export async function setupAuth(app: Express) {
  app.set("trust proxy", 1);
  app.use(getSession());

  const config = await getOidcConfig();

  // Login route
  app.get("/api/login", async (req, res) => {
    try {
      const hostname = req.hostname;
      
      // Validate hostname against REPLIT_DOMAINS using shared validation
      if (!isAllowedHostname(hostname)) {
        return res.status(400).json({ error: "Unsupported domain" });
      }

      const state = randomState();
      const nonce = randomNonce();
      const codeVerifier = randomPKCECodeVerifier();
      const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);
      
      // Store state, nonce, and code verifier in session for verification
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session error" });
        }
        
        (req.session as any).state = state;
        (req.session as any).nonce = nonce;
        (req.session as any).codeVerifier = codeVerifier;
        (req.session as any).hostname = hostname;
        
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session save error" });
          }
          
          const authUrl = buildAuthorizationUrl(config, {
            redirect_uri: `https://${hostname}/api/callback`,
            scope: "openid email profile offline_access",
            state,
            nonce,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256',
          });
          
          res.redirect(authUrl.href);
        });
      });
    } catch (error) {
      console.error('Login error:', error);
      res.status(500).json({ error: "Login failed" });
    }
  });

  // Callback route
  app.get("/api/callback", async (req, res) => {
    try {
      const sessionState = (req.session as any)?.state;
      const sessionNonce = (req.session as any)?.nonce;
      const sessionCodeVerifier = (req.session as any)?.codeVerifier;
      const sessionHostname = (req.session as any)?.hostname;
      
      if (!sessionState || !sessionNonce || !sessionCodeVerifier || !sessionHostname) {
        return res.status(400).json({ error: "Invalid session state" });
      }

      const { code, state, error, error_description } = req.query;
      
      if (error) {
        return res.status(400).json({ error: error_description || error });
      }
      
      if (state !== sessionState) {
        return res.status(400).json({ error: "Invalid state parameter" });
      }

      if (!code) {
        return res.status(400).json({ error: "Missing authorization code" });
      }

      // Exchange code for tokens with PKCE
      const tokenResponse = await authorizationCodeGrant(
        config,
        new URL(`https://${sessionHostname}/api/callback`),
        {
          pkceCodeVerifier: sessionCodeVerifier,
        },
        {
          code: code as string,
        }
      );

      // Fetch user info
      const userInfo = await fetchUserInfo(config, tokenResponse.access_token!, tokenResponse.token_type || 'Bearer');
      
      // Validate nonce in ID token (if present)
      if (tokenResponse.id_token) {
        try {
          // Decode ID token payload to check nonce (basic validation)
          const idTokenPayload = JSON.parse(Buffer.from(tokenResponse.id_token.split('.')[1], 'base64').toString());
          if (idTokenPayload.nonce !== sessionNonce) {
            return res.status(400).json({ error: "Invalid nonce in ID token" });
          }
        } catch (error) {
          console.error('ID token validation error:', error);
          return res.status(400).json({ error: "Invalid ID token" });
        }
      }
      
      // Create/link user in our system
      const appUser = await storage.linkOrCreateUserFromReplit({
        sub: userInfo.sub,
        email: userInfo.email,
        firstName: userInfo.given_name,
        lastName: userInfo.family_name,
        profileImageUrl: userInfo.picture,
      });

      // Store auth data in session (plain objects only, no class instances)
      req.session.regenerate((err) => {
        if (err) {
          return res.status(500).json({ error: "Session regeneration failed" });
        }
        
        const sessionData = req.session as any;
        sessionData.isAuthenticated = true;
        sessionData.userId = appUser.id;
        sessionData.user = {
          id: appUser.id,
          email: appUser.email,
          firstName: appUser.firstName,
          lastName: appUser.lastName,
          role: appUser.role,
          profileImageUrl: appUser.profileImageUrl,
        };
        sessionData.tokens = {
          access_token: tokenResponse.access_token,
          refresh_token: tokenResponse.refresh_token,
          id_token: tokenResponse.id_token,
          expires_at: Math.floor(Date.now() / 1000) + (tokenResponse.expires_in || 3600),
          token_type: tokenResponse.token_type || 'Bearer',
        };
        
        // Clear temporary auth state
        delete sessionData.state;
        delete sessionData.nonce;
        delete sessionData.hostname;
        
        req.session.save((err) => {
          if (err) {
            return res.status(500).json({ error: "Session save failed" });
          }
          
          res.redirect("/");
        });
      });
    } catch (error) {
      console.error('Callback error:', error);
      res.status(500).json({ error: "Authentication failed" });
    }
  });

  // Logout route
  app.get("/api/logout", async (req, res) => {
    try {
      const sessionData = req.session as any;
      const tokens = sessionData?.tokens;
      const hostname = req.hostname;
      
      req.session.destroy((err) => {
        if (err) {
          console.error('Session destroy error:', err);
        }
        
        // Build logout URL
        let logoutUrl = `${req.protocol}://${hostname}`;
        
        try {
          if (tokens?.id_token && config.serverMetadata()?.end_session_endpoint) {
            const endSessionUrl = buildEndSessionUrl(config, {
              post_logout_redirect_uri: logoutUrl,
              id_token_hint: tokens.id_token,
            });
            logoutUrl = endSessionUrl.href;
          }
        } catch (logoutUrlError) {
          console.error('Logout URL build error:', logoutUrlError);
        }
        
        res.redirect(logoutUrl);
      });
    } catch (error) {
      console.error('Logout error:', error);
      res.redirect("/");
    }
  });

  // Get current user endpoint
  app.get("/api/auth/user", async (req, res) => {
    const sessionData = req.session as any;
    
    if (!sessionData?.isAuthenticated || !sessionData?.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    res.json(sessionData.user);
  });
}

export const isAuthenticated: RequestHandler = async (req, res, next) => {
  const sessionData = req.session as any;
  
  if (!sessionData?.isAuthenticated || !sessionData?.userId || !sessionData?.tokens) {
    return res.status(401).json({ message: "Unauthorized" });
  }

  const tokens = sessionData.tokens;
  const now = Math.floor(Date.now() / 1000);
  
  // Check if token is still valid
  if (now < tokens.expires_at) {
    // Token is still valid, attach user to request
    req.user = sessionData.user;
    return next();
  }

  // Token expired, try to refresh
  if (!tokens.refresh_token) {
    req.session.destroy(() => {
      res.status(401).json({ message: "Unauthorized" });
    });
    return;
  }

  try {
    const config = await getOidcConfig();
    const refreshedTokens = await refreshTokenGrant(config, tokens.refresh_token);
    
    // Update session with new tokens
    sessionData.tokens = {
      access_token: refreshedTokens.access_token,
      refresh_token: refreshedTokens.refresh_token || tokens.refresh_token, // Keep old refresh token if no new one
      id_token: refreshedTokens.id_token || tokens.id_token,
      expires_at: Math.floor(Date.now() / 1000) + (refreshedTokens.expires_in || 3600),
      token_type: refreshedTokens.token_type || tokens.token_type,
    };
    
    req.session.save((err) => {
      if (err) {
        console.error('Failed to save session after token refresh:', err);
        req.session.destroy(() => {
          res.status(401).json({ message: "Unauthorized" });
        });
        return;
      }
      
      req.user = sessionData.user;
      next();
    });
  } catch (error) {
    console.error('Token refresh failed:', error);
    req.session.destroy(() => {
      res.status(401).json({ message: "Unauthorized" });
    });
  }
};