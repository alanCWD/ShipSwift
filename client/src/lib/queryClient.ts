import { QueryClient, QueryFunction } from "@tanstack/react-query";

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    const text = (await res.text()) || res.statusText;
    throw new Error(`${res.status}: ${text}`);
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  // Get user from localStorage (Zustand persist storage)
  const authData = localStorage.getItem('ablp-auth');
  let userId = null;
  
  if (authData) {
    try {
      const parsed = JSON.parse(authData);
      userId = parsed.state?.user?.id;
    } catch (e) {
      console.error('Error parsing auth data:', e);
    }
  }

  const headers: Record<string, string> = data ? { "Content-Type": "application/json" } : {};
  
  // Add user ID header if available
  if (userId) {
    headers['x-user-id'] = userId;
  }

  const res = await fetch(url, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
    credentials: "include",
  });

  await throwIfResNotOk(res);
  return res;
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    // Get user from localStorage (Zustand persist storage)
    const authData = localStorage.getItem('ablp-auth');
    let userId = null;
    
    if (authData) {
      try {
        const parsed = JSON.parse(authData);
        userId = parsed.state?.user?.id;
      } catch (e) {
        console.error('Error parsing auth data:', e);
      }
    }

    const headers: Record<string, string> = {};
    
    // Add user ID header if available
    if (userId) {
      headers['x-user-id'] = userId;
    }

    const res = await fetch(queryKey.join("/") as string, {
      headers,
      credentials: "include",
    });

    if (unauthorizedBehavior === "returnNull" && res.status === 401) {
      return null;
    }

    await throwIfResNotOk(res);
    return await res.json();
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: Infinity,
      retry: false,
    },
    mutations: {
      retry: false,
    },
  },
});
