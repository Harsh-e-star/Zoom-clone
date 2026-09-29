import { request } from './client';
import { User, UserProfileUpdateDto } from '@/types/auth';

export async function getUserProfile(): Promise<User> {
  return request<User>('/api/users/me');
}

export async function updateUserProfile(profile: UserProfileUpdateDto): Promise<User> {
  const updated = await request<User>('/api/users/me', {
    method: 'PUT',
    body: JSON.stringify(profile),
  });
  if (typeof window !== 'undefined') {
    localStorage.setItem('meetspace_user', JSON.stringify(updated));
  }
  return updated;
}
