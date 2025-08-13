// Iframe-compatible authentication system
// This handles authentication when the app is embedded in an iframe
// where third-party cookies may be blocked

export interface AuthState {
  userId?: string;
  sessionId?: string;
  isAuthenticated: boolean;
  userInfo?: {
    id: string;
    email: string;
    role: string;
    firstName?: string;
    lastName?: string;
  };
}

class IframeAuthManager {
  private storageKey = 'shipswift_iframe_auth';
  private isIframe: boolean;

  constructor() {
    // Detect if we're running in an iframe
    this.isIframe = window !== window.parent;
  }

  // Check if we're in an iframe context
  isInIframe(): boolean {
    return this.isIframe;
  }

  // Store authentication state in localStorage for iframe contexts
  setAuthState(state: AuthState): void {
    if (this.isIframe) {
      try {
        localStorage.setItem(this.storageKey, JSON.stringify(state));
        console.log('Auth state stored for iframe context:', state);
      } catch (error) {
        console.error('Failed to store auth state:', error);
      }
    }
  }

  // Retrieve authentication state from localStorage
  getAuthState(): AuthState | null {
    if (this.isIframe) {
      try {
        const stored = localStorage.getItem(this.storageKey);
        if (stored) {
          const state = JSON.parse(stored);
          console.log('Retrieved auth state from iframe storage:', state);
          return state;
        }
      } catch (error) {
        console.error('Failed to retrieve auth state:', error);
      }
    }
    return null;
  }

  // Clear authentication state
  clearAuthState(): void {
    if (this.isIframe) {
      try {
        localStorage.removeItem(this.storageKey);
        console.log('Auth state cleared for iframe context');
      } catch (error) {
        console.error('Failed to clear auth state:', error);
      }
    }
  }

  // Enhanced API request function that handles iframe authentication
  async makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
    const authState = this.getAuthState();
    
    // Prepare headers
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    
    // Add existing headers
    if (options.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        if (typeof value === 'string') {
          headers[key] = value;
        }
      });
    }

    // For iframe contexts, add special headers if we have auth state
    if (this.isIframe && authState?.isAuthenticated) {
      headers['X-Iframe-Auth'] = 'true';
      headers['X-Iframe-User-ID'] = authState.userId || '';
      headers['X-Iframe-Session-ID'] = authState.sessionId || '';
    }

    const response = await fetch(url, {
      ...options,
      headers,
      credentials: 'include',
    });

    return response;
  }

  // Login specifically for iframe context
  async iframeLogin(email: string, password: string): Promise<AuthState | null> {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Iframe-Context': 'true',
        },
        body: JSON.stringify({ email, password }),
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const authState: AuthState = {
          userId: data.user.id,
          sessionId: data.sessionId,
          isAuthenticated: true,
          userInfo: data.user,
        };
        
        this.setAuthState(authState);
        return authState;
      } else {
        console.error('Iframe login failed:', response.status, response.statusText);
      }
    } catch (error) {
      console.error('Iframe login error:', error);
    }
    
    return null;
  }

  // Create user specifically for iframe context
  async iframeCreateUser(userData: any): Promise<any> {
    try {
      const response = await this.makeAuthenticatedRequest('/api/admin/users', {
        method: 'POST',
        body: JSON.stringify(userData),
      });

      if (response.ok) {
        return await response.json();
      } else {
        const errorData = await response.text();
        throw new Error(`Failed to create user: ${errorData}`);
      }
    } catch (error) {
      console.error('Iframe create user error:', error);
      throw error;
    }
  }
}

export const iframeAuthManager = new IframeAuthManager();