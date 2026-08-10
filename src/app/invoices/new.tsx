import { Ionicons } from '@expo/vector-icons';
import { Redirect, router } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { AppLoading } from '@/components/app-loading';
import { useAppStore } from '@/store/app-store';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/tokens';

export default function NewInvoiceScreen() {
  const isAppReady = useAppStore((state) => state.isReady);
  const session = useAuthStore((state) => state.session);

  if (!isAppReady) {
    return <AppLoading />;
  }

  if (!session) {
    return <Redirect href="/sign-in" />;
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => router.back()} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="arrow-back" size={20} color={colors.blue} />
          </Pressable>
          <Text style={styles.title}>Create Invoice</Text>
          <View style={styles.iconButtonSpacer} />
        </View>

        <View style={styles.panel}>
          <View style={styles.panelIcon}>
            <Ionicons name="document-text-outline" size={24} color={colors.blue} />
          </View>
          <Text style={styles.panelTitle}>Invoice flow ready</Text>
          <Text style={styles.panelText}>Student selection, item selection, preview, and PDF export can plug into this route.</Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.page,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  header: {
    minHeight: 56,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  iconButtonSpacer: {
    width: 40,
  },
  title: {
    color: colors.ink,
    fontSize: 17,
    fontWeight: '900',
  },
  panel: {
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 220,
    marginTop: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#dfe7f2',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  panelIcon: {
    width: 52,
    height: 52,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
    borderRadius: 26,
    backgroundColor: colors.blueSoft,
  },
  panelTitle: {
    color: colors.ink,
    fontSize: 16,
    fontWeight: '900',
  },
  panelText: {
    maxWidth: 260,
    marginTop: 8,
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
    lineHeight: 18,
    textAlign: 'center',
  },
  pressed: {
    opacity: 0.72,
  },
});
