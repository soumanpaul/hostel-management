import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import * as Google from 'expo-auth-session/providers/google';

import { AppLoading } from '@/components/app-loading';
import { backupDatabaseToGoogleDrive } from '@/services/google-drive-backup';
import {
  createGoogleSessionFromAuthResult,
  createTestModeSession,
  getGoogleOAuthConfigurationMessage,
  googleOAuthConfig,
  hasGoogleOAuthClientId,
} from '@/services/google-auth';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/tokens';

WebBrowser.maybeCompleteAuthSession();

export default function SignInScreen() {
  const isAppReady = useAppStore((state) => state.isReady);
  const session = useAuthStore((state) => state.session);
  const signInWithGoogle = useAuthStore((state) => state.signInWithGoogle);
  const markBackupComplete = useAuthStore((state) => state.markBackupComplete);
  const [isSigningIn, setIsSigningIn] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const configurationMessage = getGoogleOAuthConfigurationMessage();
  const [request, , promptAsync] = Google.useAuthRequest(googleOAuthConfig, {
    scheme: 'hostelmanagement',
  });

  if (!isAppReady) {
    return <AppLoading />;
  }

  if (session) {
    return <Redirect href="/" />;
  }

  async function handleGoogleSignIn() {
    setMessage(null);
    setIsSigningIn(true);

    try {
      if (!hasGoogleOAuthClientId()) {
        throw new Error(configurationMessage ?? 'Google OAuth client ID is missing.');
      }

      const nextSession = await createGoogleSessionFromAuthResult(await promptAsync());

      await signInWithGoogle(nextSession);

      if (nextSession.accessToken) {
        await backupDatabaseToGoogleDrive(nextSession.accessToken);
        await markBackupComplete();
      }

      router.replace('/');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Google sign-in failed.');
    } finally {
      setIsSigningIn(false);
    }
  }

  async function handleTestModeSignIn() {
    setMessage(null);
    await signInWithGoogle(createTestModeSession());
    router.replace('/');
  }

  const isGoogleButtonDisabled = isSigningIn || !hasGoogleOAuthClientId() || !request;

  return (
    <View style={styles.page}>
      <StatusBar style="light" />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}>
        <SafeAreaView style={styles.safeArea}>
          <View style={styles.phoneFrame}>
            <View style={styles.brandPanel}>
              <View style={styles.logoMark}>
                <Ionicons name="home-outline" size={42} color="#ffffff" />
                <View style={styles.logoCircle} />
              </View>
              <Text style={styles.brandTitle}>Rabgyal&apos;s Hostel</Text>
              <Text style={styles.brandSubtitle}>PG Management System</Text>
            </View>

            <View style={styles.formPanel}>
              <Text style={styles.welcomeTitle}>Welcome Back!</Text>
              <Text style={styles.welcomeSubtitle}>Sign in with Gmail to continue</Text>

              <View style={styles.googleIntro}>
                <Ionicons name="mail-outline" size={24} color={colors.blue} />
                <View style={styles.googleIntroText}>
                  <Text style={styles.googleIntroTitle}>Gmail account</Text>
                  <Text style={styles.googleIntroSubtitle}>Rabgyal&apos;s Hostel admin workspace</Text>
                </View>
              </View>

              <Pressable
                disabled={isGoogleButtonDisabled}
                onPress={handleGoogleSignIn}
                style={({ pressed }) => [
                  styles.googleButton,
                  isGoogleButtonDisabled && styles.disabledButton,
                  pressed && styles.pressed,
                ]}>
                {isSigningIn ? (
                  <ActivityIndicator color={colors.ink} size="small" />
                ) : (
                  <Ionicons name="logo-google" size={18} color="#4285f4" />
                )}
                <Text style={styles.googleText}>Continue with Google</Text>
              </Pressable>

              {configurationMessage && <Text style={styles.messageText}>{configurationMessage}</Text>}
              {message && <Text style={styles.messageText}>{message}</Text>}

              <View style={styles.dividerRow}>
                <View style={styles.divider} />
                <Text style={styles.orText}>or</Text>
                <View style={styles.divider} />
              </View>

              <Pressable
                disabled={isSigningIn}
                onPress={handleTestModeSignIn}
                style={({ pressed }) => [
                  styles.testModeButton,
                  isSigningIn && styles.disabledButton,
                  pressed && styles.pressed,
                ]}>
                <Ionicons name="flask-outline" size={17} color={colors.blue} />
                <Text style={styles.testModeText}>Continue in Test Mode</Text>
              </Pressable>

              <View style={styles.footerRow}>
                <Text style={styles.footerText}>Don&apos;t have access?</Text>
                <Text style={styles.adminText}> Contact Admin</Text>
              </View>
            </View>
          </View>
        </SafeAreaView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: colors.page,
  },
  keyboardView: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
    paddingVertical: 18,
  },
  phoneFrame: {
    width: '100%',
    maxWidth: 360,
    minHeight: 680,
    overflow: 'hidden',
    borderRadius: 14,
    backgroundColor: colors.card,
    boxShadow: '0 14px 28px rgba(18, 34, 61, 0.12)',
  },
  brandPanel: {
    minHeight: 242,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 28,
    paddingTop: 26,
    paddingBottom: 42,
    backgroundColor: colors.blue,
  },
  logoMark: {
    width: 76,
    height: 66,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  logoCircle: {
    position: 'absolute',
    width: 34,
    height: 34,
    borderWidth: 2,
    borderColor: '#ffffff',
    borderRadius: 17,
    right: 9,
    top: 10,
    opacity: 0.95,
  },
  brandTitle: {
    color: '#ffffff',
    fontSize: 28,
    fontWeight: '800',
    lineHeight: 34,
    textAlign: 'center',
  },
  brandSubtitle: {
    marginTop: 4,
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
    opacity: 0.95,
  },
  formPanel: {
    flex: 1,
    marginTop: -16,
    paddingHorizontal: 24,
    paddingTop: 30,
    paddingBottom: 30,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    backgroundColor: colors.card,
  },
  welcomeTitle: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '800',
    lineHeight: 22,
  },
  welcomeSubtitle: {
    marginTop: 3,
    marginBottom: 28,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '500',
  },
  googleIntro: {
    minHeight: 76,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    marginBottom: 22,
    borderWidth: 1,
    borderColor: '#d9e7ff',
    borderRadius: 8,
    backgroundColor: colors.blueSoft,
  },
  googleIntroText: {
    flex: 1,
    marginLeft: 12,
  },
  googleIntroTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '800',
  },
  googleIntroSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  googleButton: {
    height: 44,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    backgroundColor: '#ffffff',
    gap: 10,
  },
  disabledButton: {
    opacity: 0.62,
  },
  googleText: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  testModeButton: {
    height: 42,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#b8d4ff',
    borderRadius: 6,
    backgroundColor: colors.blueSoft,
    gap: 9,
  },
  testModeText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  messageText: {
    marginTop: 14,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 17,
    textAlign: 'center',
  },
  dividerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 28,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: '#e2e7ef',
  },
  orText: {
    paddingHorizontal: 14,
    color: '#8b95a5',
    fontSize: 12,
    fontWeight: '600',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  footerText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  adminText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  pressed: {
    opacity: 0.72,
  },
});
