import { AuthError } from '@supabase/supabase-js';
import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { supabase } from '../lib/supabase';

/**
 * Who is using the app.
 *
 * The screens are gated on "has signed in on this phone", which is kept in
 * our own `localStorage` key, not on the Supabase session being valid. The
 * access token expires every hour; gating on it would lock the mayor out of
 * an offline phone. Only the sync needs a valid token.
 */
export type AuthState =
  /** Supabase is not configured: local-only, no sign-in needed. */
  | { status: 'localOnly' }
  | { status: 'signedOut' }
  | { status: 'signedIn'; email: string };

interface AuthContextValue {
  auth: AuthState;
  signIn: (email: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const ACCOUNT_KEY = 'bayadtracker.signedInEmail';

function readStoredEmail(): string | null {
  try {
    return localStorage.getItem(ACCOUNT_KEY);
  } catch {
    return null;
  }
}

function storeEmail(email: string | null): void {
  try {
    if (email) {
      localStorage.setItem(ACCOUNT_KEY, email);
    } else {
      localStorage.removeItem(ACCOUNT_KEY);
    }
  } catch {
    // Worst case the user signs in again next launch.
  }
}

function initialAuth(): AuthState {
  if (!supabase) {
    return { status: 'localOnly' };
  }
  const email = readStoredEmail();
  return email ? { status: 'signedIn', email } : { status: 'signedOut' };
}

/** A sign-in failure with a message that is safe to show as-is. */
export class SignInError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'SignInError';
  }
}

function toSignInError(error: AuthError): SignInError {
  if (error.code === 'invalid_credentials') {
    return new SignInError('Wrong email or password.');
  }
  // Network failures come back without an HTTP status.
  if (!error.status) {
    return new SignInError('No internet connection. Connect to sign in.');
  }
  return new SignInError(error.message);
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(initialAuth);

  useEffect(() => {
    if (!supabase) {
      return;
    }
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      // No awaiting supabase calls in here: the docs warn it can deadlock.
      if (session?.user.email && (event === 'SIGNED_IN' || event === 'INITIAL_SESSION')) {
        storeEmail(session.user.email);
        setAuth({ status: 'signedIn', email: session.user.email });
      } else if (event === 'SIGNED_OUT') {
        // Only an explicit sign-out or a revoked session. Being offline
        // never signs anyone out.
        storeEmail(null);
        setAuth({ status: 'signedOut' });
      }
    });
    return () => data.subscription.unsubscribe();
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      auth,
      async signIn(email, password) {
        if (!supabase) {
          return;
        }
        const { error } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password,
        });
        if (error) {
          throw toSignInError(error);
        }
      },
      async signOut() {
        if (!supabase) {
          return;
        }
        // 'local' clears this phone's session without a network call, so
        // signing out works offline too. The local data stays: both
        // accounts share the same class records.
        await supabase.auth.signOut({ scope: 'local' });
        storeEmail(null);
        setAuth({ status: 'signedOut' });
      },
    }),
    [auth]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error('useAuth must be used inside <AuthProvider>.');
  }
  return value;
}
