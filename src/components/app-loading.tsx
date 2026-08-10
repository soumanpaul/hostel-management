import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

import { colors } from '@/theme/tokens';

type AppLoadingProps = {
  message?: string;
};

export function AppLoading({ message = "Preparing Rabgyal's Hostel..." }: AppLoadingProps) {
  return (
    <View style={styles.container}>
      <ActivityIndicator color={colors.blue} size="large" />
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
    backgroundColor: colors.page,
  },
  message: {
    marginTop: 14,
    color: colors.muted,
    fontSize: 13,
    fontWeight: '700',
    textAlign: 'center',
  },
});
