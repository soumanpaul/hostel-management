import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { backupDatabaseToGoogleDrive } from '@/services/google-drive-backup';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/tokens';

export function MoreScreen() {
  const session = useAuthStore((state) => state.session);
  const signOut = useAuthStore((state) => state.signOut);
  const markBackupComplete = useAuthStore((state) => state.markBackupComplete);
  const [isBackingUp, setIsBackingUp] = useState(false);
  const [message, setMessage] = useState<string | null>(null);

  async function handleBackup() {
    setMessage(null);

    if (!session?.accessToken) {
      setMessage('Google OAuth client IDs are needed for Drive backup.');
      return;
    }

    setIsBackingUp(true);
    try {
      await backupDatabaseToGoogleDrive(session.accessToken);
      await markBackupComplete();
      setMessage('Backup saved to Google Drive.');
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Backup failed.');
    } finally {
      setIsBackingUp(false);
    }
  }

  async function handleSignOut() {
    await signOut();
    router.replace('/sign-in');
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Text style={styles.title}>More</Text>
          <Text style={styles.subtitle}>Account and data</Text>
        </View>

        <View style={styles.profilePanel}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {(session?.user.name ?? 'Admin')
                .split(' ')
                .map((part) => part[0])
                .join('')
                .slice(0, 2)}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{session?.user.name ?? 'Admin'}</Text>
            <Text style={styles.profileEmail}>{session?.user.email ?? 'No email'}</Text>
          </View>
        </View>

        <View style={styles.actions}>
          <Pressable
            disabled={isBackingUp}
            onPress={handleBackup}
            style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
            <View style={styles.actionIcon}>
              {isBackingUp ? (
                <ActivityIndicator color={colors.blue} size="small" />
              ) : (
                <Ionicons name="cloud-upload-outline" size={20} color={colors.blue} />
              )}
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Google Drive Backup</Text>
              <Text style={styles.actionSubtitle}>
                Last backup {session?.lastBackupAt ? new Date(session.lastBackupAt).toLocaleString() : 'not saved'}
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>

          <Pressable onPress={handleSignOut} style={({ pressed }) => [styles.actionRow, pressed && styles.pressed]}>
            <View style={[styles.actionIcon, styles.dangerIcon]}>
              <Ionicons name="log-out-outline" size={20} color={colors.danger} />
            </View>
            <View style={styles.actionInfo}>
              <Text style={styles.actionTitle}>Sign Out</Text>
              <Text style={styles.actionSubtitle}>Return to Google sign-in</Text>
            </View>
            <Ionicons name="chevron-forward" size={18} color={colors.muted} />
          </Pressable>
        </View>

        {message && <Text style={styles.messageText}>{message}</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 28,
  },
  header: {
    minHeight: 56,
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    color: colors.ink,
    fontSize: 20,
    fontWeight: '900',
  },
  subtitle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  profilePanel: {
    minHeight: 86,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#dfe7f2',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  avatar: {
    width: 48,
    height: 48,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 24,
    backgroundColor: colors.blueSoft,
  },
  avatarText: {
    color: colors.blue,
    fontSize: 15,
    fontWeight: '900',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    color: colors.ink,
    fontSize: 15,
    fontWeight: '900',
  },
  profileEmail: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  actions: {
    marginTop: 16,
    borderWidth: 1,
    borderColor: '#dfe7f2',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  actionRow: {
    minHeight: 68,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
  },
  actionIcon: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 19,
    backgroundColor: colors.blueSoft,
  },
  dangerIcon: {
    backgroundColor: colors.dangerSoft,
  },
  actionInfo: {
    flex: 1,
  },
  actionTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  actionSubtitle: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  messageText: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '800',
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
