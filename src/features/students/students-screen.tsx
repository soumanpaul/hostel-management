import { Ionicons } from '@expo/vector-icons';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { addStudent, getRooms, getStudents, type Room, type Student } from '@/db/database';
import { colors } from '@/theme/tokens';

export function StudentsScreen() {
  const [students, setStudents] = useState<Student[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [isAddingStudent, setIsAddingStudent] = useState(false);
  const [fullName, setFullName] = useState('');
  const [mobile, setMobile] = useState('');
  const [email, setEmail] = useState('');
  const [roomId, setRoomId] = useState('');
  const [error, setError] = useState<string | null>(null);

  const availableRooms = useMemo(() => rooms.filter((room) => room.status === 'vacant'), [rooms]);

  const loadStudents = useCallback(async () => {
    const [nextStudents, nextRooms] = await Promise.all([getStudents(), getRooms()]);
    setStudents(nextStudents);
    setRooms(nextRooms);
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadStudents();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadStudents]);

  async function handleAddStudent() {
    const trimmedName = fullName.trim();
    const trimmedMobile = mobile.trim();

    if (!trimmedName || trimmedMobile.length < 10) {
      setError('Enter a student name and 10 digit mobile number.');
      return;
    }

    await addStudent({
      fullName: trimmedName,
      mobile: trimmedMobile,
      email,
      roomId,
    });

    setFullName('');
    setMobile('');
    setEmail('');
    setRoomId('');
    setError(null);
    setIsAddingStudent(false);
    await loadStudents();
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Students</Text>
            <Text style={styles.subtitle}>{students.length} active records</Text>
          </View>
          <Pressable
            onPress={() => setIsAddingStudent((current) => !current)}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Ionicons name={isAddingStudent ? 'close' : 'add'} size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>{isAddingStudent ? 'Close' : 'Add Student'}</Text>
          </Pressable>
        </View>

        {isAddingStudent && (
          <View style={styles.formPanel}>
            <Text style={styles.formTitle}>Add Student</Text>
            <TextInput
              onChangeText={setFullName}
              placeholder="Full name"
              placeholderTextColor="#9aa3b1"
              style={styles.input}
              value={fullName}
            />
            <TextInput
              keyboardType="phone-pad"
              maxLength={10}
              onChangeText={setMobile}
              placeholder="Mobile number"
              placeholderTextColor="#9aa3b1"
              style={styles.input}
              value={mobile}
            />
            <TextInput
              autoCapitalize="none"
              keyboardType="email-address"
              onChangeText={setEmail}
              placeholder="Email address"
              placeholderTextColor="#9aa3b1"
              style={styles.input}
              value={email}
            />

            <Text style={styles.fieldLabel}>Assign Room</Text>
            <View style={styles.roomGrid}>
              {availableRooms.length === 0 ? (
                <Text style={styles.emptyText}>No vacant rooms</Text>
              ) : (
                availableRooms.map((room) => (
                  <Pressable
                    key={room.id}
                    onPress={() => setRoomId(room.id)}
                    style={({ pressed }) => [
                      styles.roomChip,
                      roomId === room.id && styles.roomChipSelected,
                      pressed && styles.pressed,
                    ]}>
                    <Text
                      style={[
                        styles.roomChipText,
                        roomId === room.id && styles.roomChipTextSelected,
                      ]}>
                      {room.number}
                    </Text>
                  </Pressable>
                ))
              )}
            </View>

            {error && <Text style={styles.errorText}>{error}</Text>}

            <Pressable onPress={handleAddStudent} style={({ pressed }) => [styles.saveButton, pressed && styles.pressed]}>
              <Text style={styles.saveButtonText}>Save Student</Text>
            </Pressable>
          </View>
        )}

        <View style={styles.list}>
          {students.map((student) => (
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
                <Text style={styles.metaText}>
                  Room {student.roomNumber ?? 'Unassigned'} | {student.mobile}
                </Text>
              </View>
              <View style={styles.statusPill}>
                <Text style={styles.statusText}>{student.status}</Text>
              </View>
            </View>
          ))}
        </View>
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
  primaryButton: {
    height: 38,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderRadius: 6,
    backgroundColor: colors.blue,
    gap: 6,
  },
  primaryButtonText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '900',
  },
  formPanel: {
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#dfe7f2',
    borderRadius: 8,
    backgroundColor: '#ffffff',
  },
  formTitle: {
    marginBottom: 12,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '900',
  },
  input: {
    height: 42,
    marginBottom: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    color: colors.ink,
    fontSize: 14,
    fontWeight: '600',
    backgroundColor: '#ffffff',
  },
  fieldLabel: {
    marginTop: 4,
    marginBottom: 8,
    color: '#2e3b50',
    fontSize: 12,
    fontWeight: '800',
  },
  roomGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  roomChip: {
    minWidth: 54,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 6,
    backgroundColor: '#ffffff',
  },
  roomChipSelected: {
    borderColor: colors.blue,
    backgroundColor: colors.blue,
  },
  roomChipText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
  },
  roomChipTextSelected: {
    color: '#ffffff',
  },
  emptyText: {
    color: colors.muted,
    fontSize: 12,
    fontWeight: '700',
  },
  errorText: {
    marginTop: 10,
    color: colors.danger,
    fontSize: 12,
    fontWeight: '800',
  },
  saveButton: {
    height: 42,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 14,
    borderRadius: 6,
    backgroundColor: colors.blue,
  },
  saveButtonText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '900',
  },
  list: {
    borderWidth: 1,
    borderColor: '#e1e7f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  studentRow: {
    minHeight: 70,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
  },
  avatar: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 20,
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
    backgroundColor: colors.successSoft,
  },
  statusText: {
    color: colors.success,
    fontSize: 10,
    fontWeight: '900',
    textTransform: 'capitalize',
  },
  pressed: {
    opacity: 0.72,
  },
});
