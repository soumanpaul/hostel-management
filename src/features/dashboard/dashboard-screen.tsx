import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getDashboardSummary, getStudents, type DashboardSummary, type Student } from '@/db/database';
import { useAuthStore } from '@/store/auth-store';
import { colors } from '@/theme/tokens';

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString('en-IN')}`;
}

export function DashboardScreen() {
  const session = useAuthStore((state) => state.session);
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [recentStudents, setRecentStudents] = useState<Student[]>([]);

  const loadDashboard = useCallback(async () => {
    const [nextSummary, students] = await Promise.all([getDashboardSummary(), getStudents()]);
    setSummary(nextSummary);
    setRecentStudents(students.slice(0, 4));
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadDashboard();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadDashboard]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.brand}>Rabgyal&apos;s Hostel</Text>
            <Text style={styles.subtle}>Welcome, {session?.user.name ?? 'Admin'}</Text>
          </View>
          <Pressable
            accessibilityLabel="Refresh dashboard"
            onPress={loadDashboard}
            style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={20} color={colors.blue} />
          </Pressable>
        </View>

        <View style={styles.metricsGrid}>
          <MetricCard
            label="Total Students"
            value={String(summary?.totalStudents ?? '--')}
            icon="people-outline"
            tone="blue"
          />
          <MetricCard
            label="Occupied Rooms"
            value={String(summary?.occupiedRooms ?? '--')}
            icon="bed-outline"
            tone="green"
          />
          <MetricCard
            label="Pending Dues"
            value={summary ? formatCurrency(summary.pendingAmount) : '--'}
            icon="alert-circle-outline"
            tone="orange"
          />
          <MetricCard
            label="Monthly Revenue"
            value={summary ? formatCurrency(summary.monthlyRevenue) : '--'}
            icon="wallet-outline"
            tone="purple"
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Quick Actions</Text>
          </View>
          <View style={styles.actionsRow}>
            <ActionButton label="Add Student" icon="person-add-outline" onPress={() => router.push('/students')} />
            <ActionButton label="Add Room" icon="bed-outline" onPress={() => router.push('/rooms')} />
            <ActionButton
              label="Create Invoice"
              icon="document-text-outline"
              onPress={() => router.push('/invoices/new')}
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Students</Text>
            <Pressable onPress={() => router.push('/students')} style={({ pressed }) => pressed && styles.pressed}>
              <Text style={styles.linkText}>View All</Text>
            </Pressable>
          </View>
          <View style={styles.list}>
            {recentStudents.map((student) => (
              <View key={student.id} style={styles.studentRow}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {student.fullName
                      .split(' ')
                      .map((part) => part[0])
                      .join('')
                      .slice(0, 2)}
                  </Text>
                </View>
                <View style={styles.studentInfo}>
                  <Text style={styles.studentName}>{student.fullName}</Text>
                  <Text style={styles.subtle}>Room {student.roomNumber ?? 'Unassigned'}</Text>
                </View>
                <Text style={styles.statusPill}>Active</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

type MetricTone = 'blue' | 'green' | 'orange' | 'purple';

function MetricCard({
  label,
  value,
  icon,
  tone,
}: {
  label: string;
  value: string;
  icon: keyof typeof Ionicons.glyphMap;
  tone: MetricTone;
}) {
  const toneStyle = metricTones[tone];

  return (
    <View style={[styles.metricCard, { backgroundColor: toneStyle.background }]}>
      <View style={[styles.metricIcon, { backgroundColor: toneStyle.iconBackground }]}>
        <Ionicons name={icon} size={18} color={toneStyle.icon} />
      </View>
      <Text style={[styles.metricValue, { color: toneStyle.value }]}>{value}</Text>
      <Text style={styles.metricLabel}>{label}</Text>
    </View>
  );
}

function ActionButton({
  label,
  icon,
  onPress,
}: {
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
}) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => [styles.actionButton, pressed && styles.pressed]}>
      <View style={styles.actionIcon}>
        <Ionicons name={icon} size={20} color={colors.blue} />
      </View>
      <Text style={styles.actionText}>{label}</Text>
    </Pressable>
  );
}

const metricTones = {
  blue: {
    background: '#edf5ff',
    iconBackground: '#d6eaff',
    icon: colors.blue,
    value: colors.blue,
  },
  green: {
    background: colors.successSoft,
    iconBackground: '#c8efd9',
    icon: colors.success,
    value: colors.success,
  },
  orange: {
    background: colors.warningSoft,
    iconBackground: '#ffe4a6',
    icon: colors.warning,
    value: colors.warning,
  },
  purple: {
    background: '#f0ecff',
    iconBackground: '#ded6ff',
    icon: '#6554c0',
    value: '#6554c0',
  },
} as const;

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
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  brand: {
    color: colors.ink,
    fontSize: 18,
    fontWeight: '900',
  },
  subtle: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  metricCard: {
    width: '48.7%',
    minHeight: 102,
    justifyContent: 'space-between',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(11, 29, 63, 0.05)',
  },
  metricIcon: {
    width: 30,
    height: 30,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 15,
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '900',
  },
  metricLabel: {
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  section: {
    marginTop: 22,
  },
  sectionHeader: {
    minHeight: 34,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  linkText: {
    color: colors.blue,
    fontSize: 12,
    fontWeight: '800',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionButton: {
    flex: 1,
    minHeight: 84,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 8,
    borderWidth: 1,
    borderColor: '#e1e7f0',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  actionIcon: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderRadius: 17,
    backgroundColor: colors.blueSoft,
  },
  actionText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '800',
    textAlign: 'center',
  },
  list: {
    borderWidth: 1,
    borderColor: '#e1e7f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  studentRow: {
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
  },
  avatar: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 19,
    backgroundColor: colors.blueSoft,
  },
  avatarText: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  studentInfo: {
    flex: 1,
  },
  studentName: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '800',
  },
  statusPill: {
    overflow: 'hidden',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
    color: colors.success,
    backgroundColor: colors.successSoft,
    fontSize: 10,
    fontWeight: '900',
  },
  pressed: {
    opacity: 0.72,
  },
});
