const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

function getToken(): string | null {
  if (typeof window !== 'undefined') {
    return localStorage.getItem('accessToken');
  }
  return null;
}

export const authClient = {
  baseURL: API_URL,
  
  async signIn(email: string, password: string) {
    const res = await fetch(`${API_URL}/api/v1/auth/signin/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Sign in failed');
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },

  async signUp(email: string, password: string, name?: string) {
    const res = await fetch(`${API_URL}/api/v1/auth/signup/email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password, name }),
      credentials: 'include',
    });
    if (!res.ok) throw new Error('Sign up failed');
    const data = await res.json();
    if (data.success && data.data?.accessToken) {
      localStorage.setItem('accessToken', data.data.accessToken);
    }
    return data;
  },

  async signOut() {
    const token = getToken();
    if (token) {
      await fetch(`${API_URL}/api/v1/auth/logout`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        credentials: 'include',
      });
    }
    localStorage.removeItem('accessToken');
  },

  async getSession() {
    const token = getToken();
    if (!token) return null;
    
    const res = await fetch(`${API_URL}/api/v1/auth/me`, {
      headers: { 
        'Authorization': `Bearer ${token}`,
      },
      credentials: 'include',
    });
    if (!res.ok) {
      localStorage.removeItem('accessToken');
      return null;
    }
    return res.json();
  },
};

export const useSession = () => {
  return { data: null, isLoading: true };
};
