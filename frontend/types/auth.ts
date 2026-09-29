export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url?: string | null;
  status: string;
  timezone: string;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  user: User;
}

export interface UserSettings {
  id: number;
  user_id: number;
  audio_device: string;
  video_device: string;
  mute_on_join: boolean;
  video_off_on_join: boolean;
  theme: string;
  notifications_enabled: boolean;
  updated_at?: string;
}

export interface UserSettingsUpdateDto {
  audio_device?: string;
  video_device?: string;
  mute_on_join?: boolean;
  video_off_on_join?: boolean;
  theme?: string;
  notifications_enabled?: boolean;
}

export interface UserProfileUpdateDto {
  name?: string;
  status?: string;
  timezone?: string;
  avatar_url?: string;
}
