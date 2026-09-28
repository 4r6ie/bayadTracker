import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { syncNow, useSyncStatus } from '../../sync/syncManager';

function formatTime(iso: string | null): string {
  if (!iso) {
    return 'Never';
  }
  return new Date(iso).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

const STATE_LABEL = {
  idle: 'Up to date',
  syncing: 'Syncing…',
  offline: 'Offline — changes are saved on this phone',
  error: 'Last sync failed',
  disabled: 'Not set up (this phone only)',
} as const;

/** Who is signed in, whether the data reached the other phone, sign out. */
export default function AccountScreen() {
  const { auth, signOut } = useAuth();
  const status = useSyncStatus();

  function handleSignOut() {
    const warning =
      status.pending > 0
        ? `${status.pending} change(s) on this phone have not been uploaded yet. They stay here and upload after someone signs in again.`
        : 'You will need internet to sign in again.';
    Alert.alert('Sign out?', warning, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign Out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            if (__DEV__) {
              console.error('Sign-out failed', error);
            }
            Alert.alert('Unable to Sign Out', 'Please try again.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <View style={styles.card}>
        <Text style={styles.cardLabel}>Signed in as</Text>
        <Text style={styles.cardValue}>
          {auth.status === 'signedIn' ? auth.email : 'Nobody (local-only mode)'}
        </Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardLabel}>Sync</Text>
        <Text
          style={[
            styles.cardValue,
            status.state === 'error' && styles.errorText,
          ]}
        >
          {STATE_LABEL[status.state]}
        </Text>
        {status.state === 'error' && status.error ? (
          <Text style={styles.detail}>{status.error}</Text>
        ) : null}
        <Text style={styles.detail}>
          Waiting to upload: {status.pending}
        </Text>
        <Text style={styles.detail}>Last synced: {formatTime(status.lastSyncedAt)}</Text>
        {status.state !== 'disabled' ? (
          <Pressable
            style={[styles.button, status.state === 'syncing' && styles.disabled]}
            onPress={() => syncNow()}
            disabled={status.state === 'syncing'}
            accessibilityRole="button"
          >
            <Text style={styles.buttonLabel}>Sync Now</Text>
          </Pressable>
        ) : null}
      </View>

      {auth.status === 'signedIn' ? (
        <Pressable
          style={styles.signOut}
          onPress={handleSignOut}
          accessibilityRole="button"
        >
          <Text style={styles.signOutLabel}>Sign Out</Text>
        </Pressable>
      ) : null}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F4F6F5',
  },
  content: {
    padding: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E1E7E3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  cardLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#5B6660',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  cardValue: {
    fontSize: 16,
    fontWeight: '600',
    color: '#17211C',
  },
  errorText: {
    color: '#C63B3B',
  },
  detail: {
    fontSize: 14,
    color: '#5B6660',
    marginTop: 6,
  },
  button: {
    minHeight: 48,
    borderRadius: 12,
    backgroundColor: '#127A52',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
  },
  disabled: {
    opacity: 0.5,
  },
  buttonLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  signOut: {
    minHeight: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#C63B3B',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  signOutLabel: {
    fontSize: 15,
    fontWeight: '700',
    color: '#C63B3B',
  },
});
