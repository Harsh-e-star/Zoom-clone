import { request } from './client';
import { UserSettings, UserSettingsUpdateDto } from '@/types/auth';

export async function getSettings(): Promise<UserSettings> {
  return request<UserSettings>('/api/settings');
}

export async function updateSettings(settings: UserSettingsUpdateDto): Promise<UserSettings> {
  return request<UserSettings>('/api/settings', {
    method: 'PUT',
    body: JSON.stringify(settings),
  });
}
