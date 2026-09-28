import Ionicons from '@expo/vector-icons/Ionicons';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import { useAuth } from '../../auth/AuthProvider';
import { Avatar } from '../../components/ui/Avatar';
import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { SegmentedControl } from '../../components/ui/Controls';
import { ScreenHeader, SectionHeader } from '../../components/ui/Headers';
import { Pill } from '../../components/ui/Pill';
import { syncNow, useSyncStatus } from '../../sync/syncManager';
import { ACCENT_NAMES, ACCENTS, STYLES, type StyleName } from '../../theme/palettes';
import { makeStyles, useTheme } from '../../theme/ThemeProvider';
import { font, space, TOUCH } from '../../theme/tokens';
import { tapFeedback } from '../../utils/feedback';

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
  offline: 'Offline, saved on this phone',
  error: 'Last sync failed',
  disabled: 'This phone only',
} as const;

const STYLE_OPTIONS = (Object.keys(STYLES) as StyleName[]).map((value) => ({
  value,
  label: STYLES[value].label,
}));

/** Who is signed in, sync status, appearance, and sign out. */
export default function AccountScreen() {
  const styles = useStyles();
  const { auth, signOut } = useAuth();
  const { theme, setStyle, setAccent } = useTheme();
  const status = useSyncStatus();
  const email = auth.status === 'signedIn' ? auth.email : null;

  function handleSignOut() {
    const warning =
      status.pending > 0
        ? `${status.pending} change(s) on this phone haven't been uploaded yet. They stay here and upload after someone signs in again.`
        : "You'll need internet to sign in again.";
    Alert.alert('Sign out?', warning, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Sign out',
        style: 'destructive',
        onPress: async () => {
          try {
            await signOut();
          } catch (error) {
            if (__DEV__) {
              console.error('Sign-out failed', error);
            }
            Alert.alert('Unable to sign out', 'Try again.');
          }
        },
      },
    ]);
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <ScreenHeader title="Account" />

      <Card style={styles.profile}>
        <Avatar name={email ?? 'This phone'} size={48} />
        <View style={styles.profileBody}>
          <Text style={styles.profileName} numberOfLines={1}>
            {email ?? 'Local-only mode'}
          </Text>
          <Text style={styles.muted}>
            {email ? 'Signed in on this phone' : 'Supabase is not set up'}
          </Text>
        </View>
      </Card>

      {status.state !== 'disabled' ? (
        <>
          <SectionHeader title="Sync" />
          <Card>
            <View style={styles.rowBetween}>
              <Text style={styles.cardTitle}>{STATE_LABEL[status.state]}</Text>
              <Pill
                label={status.pending > 0 ? `${status.pending} waiting` : 'Nothing waiting'}
                tone={status.pending > 0 ? 'warning' : 'accent'}
              />
            </View>
            {status.state === 'error' && status.error ? (
              <Text style={styles.error}>{status.error}</Text>
            ) : null}
            <Text style={styles.muted}>Last synced {formatTime(status.lastSyncedAt)}</Text>
            <Button
              label="Sync now"
              icon="sync-outline"
              variant="secondary"
              busy={status.state === 'syncing'}
              busyLabel="Syncing…"
              onPress={() => syncNow()}
              style={styles.cardButton}
            />
          </Card>
        </>
      ) : null}

      <SectionHeader title="Appearance" />
      <Card>
        <Text style={styles.fieldLabel}>Style</Text>
        <SegmentedControl options={STYLE_OPTIONS} value={theme.style} onChange={setStyle} />
        <Text style={[styles.muted, styles.hint]}>{STYLES[theme.style].description}</Text>

        <Text style={[styles.fieldLabel, styles.spaced]}>Color</Text>
        <View style={styles.swatches} accessibilityRole="radiogroup">
          {ACCENT_NAMES.map((name) => {
            const active = theme.accentName === name;
            return (
              <Pressable
                key={name}
                onPress={() => {
                  tapFeedback();
                  setAccent(name);
                }}
                accessibilityRole="radio"
                accessibilityState={{ checked: active }}
                accessibilityLabel={ACCENTS[name].label}
                style={styles.swatchHit}
              >
                <View
                  style={[
                    styles.swatch,
                    { backgroundColor: ACCENTS[name].main },
                    active && styles.swatchActive,
                  ]}
                >
                  {active ? (
                    <Ionicons name="checkmark" size={20} color={theme.colors.onAccent} />
                  ) : null}
                </View>
                <Text style={[styles.swatchLabel, active && styles.swatchLabelActive]}>
                  {ACCENTS[name].label}
                </Text>
              </Pressable>
            );
          })}
        </View>
        <Text style={[styles.muted, styles.hint]}>Saved on this phone only.</Text>
      </Card>

      {auth.status === 'signedIn' ? (
        <Button
          label="Sign out"
          icon="log-out-outline"
          variant="danger"
          onPress={handleSignOut}
          style={styles.signOut}
        />
      ) : null}
    </ScrollView>
  );
}

const useStyles = makeStyles((t) => ({
  screen: {
    flex: 1,
    backgroundColor: t.colors.background,
  },
  content: {
    paddingHorizontal: space.lg,
    paddingBottom: space.xxl,
  },
  profile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.md,
  },
  profileBody: {
    flex: 1,
  },
  profileName: {
    fontSize: font.subtitle,
    fontWeight: '700',
    color: t.colors.text,
  },
  rowBetween: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: space.sm,
    marginBottom: space.xs,
  },
  cardTitle: {
    flex: 1,
    fontSize: font.callout,
    fontWeight: '700',
    color: t.colors.text,
  },
  muted: {
    fontSize: font.footnote,
    color: t.colors.textSecondary,
  },
  error: {
    fontSize: font.footnote,
    color: t.colors.danger,
    marginBottom: space.xs,
  },
  cardButton: {
    marginTop: space.md,
  },
  fieldLabel: {
    fontSize: font.footnote,
    fontWeight: '700',
    color: t.colors.textSecondary,
    marginBottom: space.sm,
  },
  spaced: {
    marginTop: space.lg,
  },
  hint: {
    marginTop: space.sm,
  },
  swatches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    rowGap: space.md,
  },
  swatchHit: {
    alignItems: 'center',
    width: '30%',
    minHeight: TOUCH,
  },
  swatch: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  swatchActive: {
    borderWidth: 3,
    borderColor: t.colors.surface,
    shadowColor: t.colors.shadow,
    shadowOpacity: 0.25,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 3,
  },
  swatchLabel: {
    fontSize: font.caption,
    color: t.colors.textSecondary,
    marginTop: space.xs,
  },
  swatchLabelActive: {
    color: t.colors.text,
    fontWeight: '700',
  },
  signOut: {
    marginTop: space.xl,
  },
}));
