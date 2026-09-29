import { request, setStoredToken, clearStoredToken } from './client';
import { TokenResponse, User } from '@/types/auth';

export interface LoginParams {
  email: string;
  password: string;
}

export interface SignupParams {
  name: string;
  email: string;
  password: string;
}

export async function login(params: LoginParams): Promise<TokenResponse> {
  const res = await request<TokenResponse>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (res.access_token) {
    setStoredToken(res.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('meetspace_user', JSON.stringify(res.user));
    }
  }
  return res;
}

export async function signup(params: SignupParams): Promise<TokenResponse> {
  const res = await request<TokenResponse>('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify(params),
  });
  if (res.access_token) {
    setStoredToken(res.access_token);
    if (typeof window !== 'undefined') {
      localStorage.setItem('meetspace_user', JSON.stringify(res.user));
    }
  }
  return res;
}

export async function logout(): Promise<void> {
  try {
    await request('/api/auth/logout', { method: 'POST' });
  } catch {
    // Ignore backend logout errors, proceed with local cleanup
  } finally {
    clearStoredToken();
  }
}

export async function getMe(): Promise<User> {
  return request<User>('/api/auth/me');
}

export async function forgotPassword(email: string): Promise<{ message: string; reset_token?: string }> {
  return request<{ message: string; reset_token?: string }>('/api/auth/forgot-password', {
    method: 'POST',
    body: JSON.stringify({ email }),
  });
}

export async function resetPassword(token: string, newPassword: string): Promise<{ message: string }> {
  return request<{ message: string }>('/api/auth/reset-password', {
    method: 'POST',
    body: JSON.stringify({ token, new_password: newPassword }),
  });
}
