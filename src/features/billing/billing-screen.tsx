import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { getInvoices, type Invoice } from '@/db/database';
import { colors } from '@/theme/tokens';

function formatCurrency(value: number) {
  return `INR ${value.toLocaleString('en-IN')}`;
}

export function BillingScreen() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);

  const totals = useMemo(
    () => ({
      totalDue: invoices.reduce((sum, invoice) => sum + invoice.totalAmount - invoice.paidAmount, 0),
      overdue: invoices
        .filter((invoice) => invoice.status === 'overdue')
        .reduce((sum, invoice) => sum + invoice.totalAmount - invoice.paidAmount, 0),
      paid: invoices
        .filter((invoice) => invoice.status === 'paid')
        .reduce((sum, invoice) => sum + invoice.paidAmount, 0),
    }),
    [invoices]
  );

  const loadInvoices = useCallback(async () => {
    setInvoices(await getInvoices());
  }, []);

  useEffect(() => {
    const loadTimer = setTimeout(() => {
      void loadInvoices();
    }, 0);

    return () => clearTimeout(loadTimer);
  }, [loadInvoices]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.title}>Billing</Text>
            <Text style={styles.subtitle}>{invoices.length} invoices</Text>
          </View>
          <Pressable
            onPress={() => router.push('/invoices/new')}
            style={({ pressed }) => [styles.primaryButton, pressed && styles.pressed]}>
            <Ionicons name="add" size={18} color="#ffffff" />
            <Text style={styles.primaryButtonText}>Invoice</Text>
          </Pressable>
        </View>

        <View style={styles.summaryRow}>
          <SummaryCard label="Total Due" value={formatCurrency(totals.totalDue)} tone="blue" />
          <SummaryCard label="Overdue" value={formatCurrency(totals.overdue)} tone="red" />
          <SummaryCard label="Paid" value={formatCurrency(totals.paid)} tone="green" />
        </View>

        <View style={styles.list}>
          {invoices.map((invoice) => (
            <View key={invoice.id} style={styles.invoiceRow}>
              <View style={styles.invoiceIcon}>
                <Ionicons name="receipt-outline" size={20} color={colors.blue} />
              </View>
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
                <Text style={styles.metaText}>
                  {invoice.studentName} ({invoice.roomNumber ?? 'No room'})
                </Text>
                <Text style={styles.metaText}>Due {invoice.dueDate}</Text>
              </View>
              <View style={styles.amountColumn}>
                <Text style={styles.amountText}>{formatCurrency(invoice.totalAmount)}</Text>
                <StatusPill status={invoice.status} />
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function SummaryCard({ label, value, tone }: { label: string; value: string; tone: 'blue' | 'red' | 'green' }) {
  const toneStyle = summaryTones[tone];

  return (
    <View style={[styles.summaryCard, { backgroundColor: toneStyle.background }]}>
      <Text style={[styles.summaryValue, { color: toneStyle.color }]}>{value}</Text>
      <Text style={styles.summaryLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }: { status: Invoice['status'] }) {
  const tone = status === 'paid' ? statusTones.paid : status === 'overdue' ? statusTones.overdue : statusTones.pending;

  return (
    <View style={[styles.statusPill, { backgroundColor: tone.background }]}>
      <Text style={[styles.statusText, { color: tone.color }]}>{status}</Text>
    </View>
  );
}

const summaryTones = {
  blue: {
    background: colors.blueSoft,
    color: colors.blue,
  },
  red: {
    background: colors.dangerSoft,
    color: colors.danger,
  },
  green: {
    background: colors.successSoft,
    color: colors.success,
  },
} as const;

const statusTones = {
  pending: {
    background: colors.warningSoft,
    color: colors.warning,
  },
  paid: {
    background: colors.successSoft,
    color: colors.success,
  },
  overdue: {
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
  summaryRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 14,
  },
  summaryCard: {
    flex: 1,
    minHeight: 78,
    justifyContent: 'center',
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  summaryValue: {
    fontSize: 13,
    fontWeight: '900',
  },
  summaryLabel: {
    marginTop: 6,
    color: colors.muted,
    fontSize: 10,
    fontWeight: '800',
  },
  list: {
    borderWidth: 1,
    borderColor: '#e1e7f0',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
  invoiceRow: {
    minHeight: 82,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#edf1f6',
  },
  invoiceIcon: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
    borderRadius: 20,
    backgroundColor: colors.blueSoft,
  },
  invoiceInfo: {
    flex: 1,
  },
  invoiceNumber: {
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
  amountColumn: {
    alignItems: 'flex-end',
    gap: 6,
  },
  amountText: {
    color: colors.ink,
    fontSize: 12,
    fontWeight: '900',
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
