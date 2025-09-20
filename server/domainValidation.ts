/**
 * Shared domain validation logic for consistent CORS and redirect URI validation
 */

export const isAllowedOrigin = (checkOrigin: string): boolean => {
  try {
    const originUrl = new URL(checkOrigin);
    const allowedOrigins = process.env.REPLIT_DOMAINS ? 
      process.env.REPLIT_DOMAINS.split(',') : 
      ['https://replit.com'];
      
    return allowedOrigins.some(allowed => {
      try {
        const allowedUrl = new URL(allowed);
        return originUrl.origin === allowedUrl.origin;
      } catch {
        // Handle plain hostname format (legacy compatibility) - exact match only
        return originUrl.hostname === allowed && originUrl.protocol === 'https:';
      }
    });
  } catch (e) {
    return false;
  }
};

export const isAllowedHostname = (hostname: string): boolean => {
  // Convert hostname to origin format for consistent validation
  const httpsOrigin = `https://${hostname}`;
  return isAllowedOrigin(httpsOrigin);
};

export const getDefaultAllowedOrigin = (): string => {
  const allowedOrigins = process.env.REPLIT_DOMAINS ? 
    process.env.REPLIT_DOMAINS.split(',') : 
    ['https://replit.com'];
  
  // Return the first allowed origin, or default to replit.com
  try {
    new URL(allowedOrigins[0]);
    return allowedOrigins[0];
  } catch {
    return 'https://replit.com';
  }
};