import { useCallback, useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { getRooms, type Room, type RoomStatus } from '@/db/database';
import { colors } from '@/theme/tokens';

export function RoomsScreen() {
  const [rooms, setRooms] = useState<Room[]>([]);

  const loadRooms = useCallback(async () => {
    setRooms(await getRooms());
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadRooms();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadRooms]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Rooms</Text>
            <Text style={styles.subtitle}>{rooms.length} total rooms</Text>
          </View>
          <Pressable onPress={loadRooms} style={({ pressed }) => [styles.iconButton, pressed && styles.pressed]}>
            <Ionicons name="refresh-outline" size={20} color={colors.blue} />
          </Pressable>
        </View>

        <View style={styles.filters}>
          <StatusCount label="All" count={rooms.length} active />
          <StatusCount label="Occupied" count={rooms.filter((room) => room.status === 'occupied').length} />
          <StatusCount label="Vacant" count={rooms.filter((room) => room.status === 'vacant').length} />
        </View>

        <View style={styles.list}>
          {rooms.map((room) => (
            <View key={room.id} style={styles.roomRow}>
              <View style={styles.roomBadge}>
                <Text style={styles.roomNumber}>{room.number}</Text>
              </View>
              <View style={styles.roomInfo}>
                <Text style={styles.roomTitle}>{room.occupantName ?? 'Vacant'}</Text>
                <Text style={styles.metaText}>
                  {room.type} | INR {room.monthlyRent.toLocaleString('en-IN')}
                </Text>
              </View>
              <RoomStatusPill status={room.status} />
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function StatusCount({ label, count, active = false }: { label: string; count: number; active?: boolean }) {
  return (
    <View style={[styles.filterPill, active && styles.filterPillActive]}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>
        {label} ({count})
      </Text>
    </View>
  );
}

function RoomStatusPill({ status }: { status: RoomStatus }) {
  const tone = statusStyles[status];

  return (
    <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
      <Text style={[styles.statusText, { color: tone.color }]}>{status}</Text>
    </View>
  );
}

const statusStyles = {
  occupied: {
    background: colors.successSoft,
    color: colors.success,
  },
  vacant: {
    background: colors.warningSoft,
    color: colors.warning,
  },
  maintenance: {
    background: colors.dangerSoft,
    color: colors.danger,
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
  iconButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 20,
    backgroundColor: '#ffffff',
  },
  filters: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  filterPill: {
    height: 32,
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: '#ffffff',
  },
  filterPillActive: {
    backgroundColor: colors.blue,
  },
  filterText: {
    color: colors.ink,
    fontSize: 11,
    fontWeight: '900',
  },
  filterTextActive: {
    color: '#ffffff',
  },
  list: {
    borderWidth: 1,
    borderColor: '#e1e7f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  roomRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
  },
  roomBadge: {
    width: 42,
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 21,
    backgroundColor: colors.blueSoft,
  },
  roomNumber: {
    color: colors.blue,
    fontSize: 13,
    fontWeight: '900',
  },
  roomInfo: {
    flex: 1,
  },
  roomTitle: {
    color: colors.ink,
    fontSize: 13,
    fontWeight: '900',
  },
  metaText: {
    marginTop: 3,
    color: colors.muted,
    fontSize: 11,
    fontWeight: '700',
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  pressed: {
    opacity: 0.72,
  },
});
