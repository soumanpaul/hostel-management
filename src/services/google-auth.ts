import { fetchUserInfoAsync, type AuthSessionResult } from 'expo-auth-session';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { Platform } from 'react-native';

export type GoogleUser = {
  id: string;
  email: string;
  name: string;
  picture?: string;
};

export type GoogleSession = {
  provider: 'google' | 'test';
  user: GoogleUser;
  accessToken?: string;
  idToken?: string;
  expiresAt?: number;
  issuedAt: string;
  lastBackupAt?: string;
};

type GoogleOAuthExtra = {
  webClientId?: string;
  iosClientId?: string;
  androidClientId?: string;
};

const extra = Constants.expoConfig?.extra as
  | {
      googleOAuth?: GoogleOAuthExtra;
    }
  | undefined;

function readClientId(envKey: string, configValue?: string) {
  return process.env[envKey]?.trim() || configValue?.trim() || '';
}

export const googleOAuthConfig = {
  webClientId: readClientId('EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID', extra?.googleOAuth?.webClientId),
  iosClientId: readClientId('EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID', extra?.googleOAuth?.iosClientId),
  androidClientId: readClientId(
    'EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID',
    extra?.googleOAuth?.androidClientId
  ),
  scopes: [
    'openid',
    'profile',
    'email',
    'https://www.googleapis.com/auth/drive.appdata',
  ],
  selectAccount: true,
};

export function hasGoogleOAuthClientId() {
  const platformClientId = Platform.select({
    ios: googleOAuthConfig.iosClientId,
    android: googleOAuthConfig.androidClientId,
    default: googleOAuthConfig.webClientId,
  });

  return Boolean(platformClientId);
}

export function getGoogleOAuthConfigurationMessage() {
  if (hasGoogleOAuthClientId()) {
    return null;
  }

  const platformName = Platform.select({
    ios: 'iOS',
    android: 'Android',
    default: 'web',
  });

  return `Google OAuth ${platformName} client ID is missing.`;
}

export async function createGoogleSessionFromAuthResult(
  response: AuthSessionResult
): Promise<GoogleSession> {
  if (response.type !== 'success') {
    throw new Error('Google sign-in was not completed.');
  }

  const accessToken = response.authentication?.accessToken ?? response.params.access_token;
  const idToken = response.authentication?.idToken ?? response.params.id_token;
  const expiresIn =
    response.authentication?.expiresIn ?? Number.parseInt(response.params.expires_in ?? '', 10);
  const userInfo = accessToken
    ? await fetchUserInfoAsync({ accessToken }, Google.discovery)
    : parseUserInfoFromIdToken(idToken);

  return {
    provider: 'google',
    user: {
      id: String(userInfo.sub ?? userInfo.id ?? userInfo.email),
      email: String(userInfo.email ?? ''),
      name: String(userInfo.name ?? userInfo.email ?? 'Google User'),
      picture: typeof userInfo.picture === 'string' ? userInfo.picture : undefined,
    },
    accessToken,
    idToken,
    expiresAt: Number.isFinite(expiresIn) ? Date.now() + expiresIn * 1000 : undefined,
    issuedAt: new Date().toISOString(),
  };
}

function parseUserInfoFromIdToken(idToken?: string) {
  if (!idToken) {
    return {};
  }

  try {
    const [, payload] = idToken.split('.');
    const normalizedPayload = payload.replace(/-/g, '+').replace(/_/g, '/');
    if (typeof atob !== 'function') {
      return {};
    }
    const decodedPayload = atob(normalizedPayload);
    return JSON.parse(decodedPayload) as Record<string, unknown>;
  } catch {
    return {};
  }
}

export function createTestModeSession(): GoogleSession {
  return {
    provider: 'test',
    user: {
      id: 'test-mode-admin',
      email: 'test@rabgyals-hostel.local',
      name: 'Test Admin',
    },
    issuedAt: new Date().toISOString(),
  };
}
