/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../lib/api';
import { requireSupabase, supabase } from '../lib/supabase';

const AuthContext = createContext(null);
const USER_STORAGE_KEY = 'justice-ai-user';
const ACCOUNTS_STORAGE_KEY = 'justice-ai-accounts';

const readStoredJson = (key, fallback) => {
  try {
    const rawValue = localStorage.getItem(key);
    return rawValue ? JSON.parse(rawValue) : fallback;
  } catch {
    return fallback;
  }
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const toAppUser = (authUser) => authUser ? ({
  id: authUser.id,
  name: authUser.user_metadata?.full_name || authUser.user_metadata?.name || authUser.email || 'JusticeAI User',
  email: authUser.email || '',
}) : null;

const legacyIdsForEmail = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const ids = new Set();
  const oldSession = readStoredJson(USER_STORAGE_KEY, null);
  if (oldSession?.id && normalizeEmail(oldSession.email || '') === normalizedEmail) {
    ids.add(oldSession.id);
  }
  for (const account of readStoredJson(ACCOUNTS_STORAGE_KEY, [])) {
    if (account?.id && normalizeEmail(account.email || '') === normalizedEmail) {
      ids.add(account.id);
    }
  }
  return [...ids];
};

const legacyAccountForCredentials = (email, password) => {
  const normalizedEmail = normalizeEmail(email);
  return readStoredJson(ACCOUNTS_STORAGE_KEY, []).find(
    (account) => normalizeEmail(account.email || '') === normalizedEmail && account.password === password
  ) || null;
};

const clearLegacyCredentials = (email) => {
  const normalizedEmail = normalizeEmail(email);
  const oldSession = readStoredJson(USER_STORAGE_KEY, null);
  if (oldSession?.email && normalizeEmail(oldSession.email) === normalizedEmail) {
    localStorage.removeItem(USER_STORAGE_KEY);
  }
  const remainingAccounts = readStoredJson(ACCOUNTS_STORAGE_KEY, [])
    .filter((account) => normalizeEmail(account.email || '') !== normalizedEmail);
  if (remainingAccounts.length) {
    localStorage.setItem(ACCOUNTS_STORAGE_KEY, JSON.stringify(remainingAccounts));
  } else {
    localStorage.removeItem(ACCOUNTS_STORAGE_KEY);
  }
};

const isLocalMigrationHost = () =>
  import.meta.env.DEV && ['localhost', '127.0.0.1'].includes(window.location.hostname);

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [logoutRedirectTo, setLogoutRedirectTo] = useState(null);
  const [migrationNotice, setMigrationNotice] = useState('');

  useEffect(() => {
    if (!supabase) {
      setLoading(false);
      return undefined;
    }

    let active = true;
    supabase.auth.getSession().then(({ data, error }) => {
      if (!active) return;
      if (error) console.warn('[auth] Could not restore Supabase session:', error.message);
      setUser(toAppUser(data?.session?.user));
      setLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (active) {
        setUser(toAppUser(session?.user));
        setLoading(false);
      }
    });

    return () => {
      active = false;
      subscription.unsubscribe();
    };
  }, []);

  const migrateLegacyDocuments = async (legacyIds, accessToken, email) => {
    if (!isLocalMigrationHost()) {
      return;
    }

    let total = 0;
    let migrated = 0;
    let alreadyPresent = 0;
    let failed = 0;
    for (const legacyId of legacyIds) {
      try {
        const result = await api.migrateLegacyDocuments(legacyId, accessToken);
        total += result.total || 0;
        migrated += result.migrated || 0;
        alreadyPresent += result.already_present || 0;
        failed += result.failed || 0;
      } catch (error) {
        // Keep legacy credentials and local files in place so the transfer can
        // be retried after configuring Supabase or the local API.
        console.warn('[auth] Legacy document transfer could not complete:', error.message);
        failed += 1;
      }
    }
    const result = { total, migrated, alreadyPresent, failed };
    if (failed === 0) clearLegacyCredentials(email);
    return result;
  };

  const login = async (email, password) => {
    setLoading(true);
    try {
      const client = requireSupabase();
      const legacyIds = legacyIdsForEmail(email);
      let { data, error } = await client.auth.signInWithPassword({
        email: normalizeEmail(email),
        password,
      });
      if (error) {
        const legacyAccount = legacyAccountForCredentials(email, password);
        if (!legacyAccount) {
          if (error.message?.toLowerCase().includes('invalid login credentials')) {
            throw new Error('This email and password are not registered with shared sign-in. If you used JusticeAI before this update, that account may exist only in the browser and site where you originally created it. Use Sign up to create your shared account, or reset the password for an existing shared account.');
          }
          throw error;
        }

        const legacySignup = await client.auth.signUp({
          email: normalizeEmail(email),
          password,
          options: {
            data: { full_name: legacyAccount.name || 'JusticeAI User' },
            emailRedirectTo: `${window.location.origin}/login`,
          },
        });
        if (legacySignup.error) {
          throw new Error('Your old account was found, but this email already has a shared account. Log in with its current password or reset that password.');
        }
        if (!legacySignup.data.session) {
          if (!legacySignup.data.user?.identities?.length) {
            throw new Error('This email already has a shared account. Use its current password to log in.');
          }
          throw new Error('Your previous account was found. Check your email and confirm the new shared account, then log in again. If no confirmation email arrives, check spam or contact the site administrator.');
        }
        data = legacySignup.data;
      }
      setLogoutRedirectTo(null);
      setUser(toAppUser(data.user));
      if (data.session?.access_token && legacyIds.length) {
        if (isLocalMigrationHost()) {
          const migration = await migrateLegacyDocuments(legacyIds, data.session.access_token, email);
          if (migration?.total) {
            setMigrationNotice(
              migration.failed
                ? `Transferred ${migration.migrated} of ${migration.total} local documents. ${migration.failed} could not be transferred; your local copies are retained.`
                : `Transferred ${migration.migrated} local documents to your shared account.`
            );
          } else if (migration?.failed) {
            setMigrationNotice('Your account is signed in, but local documents could not be transferred. Your local copies are retained.');
          }
        } else {
          clearLegacyCredentials(email);
        }
      }
      return toAppUser(data.user);
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    if (!trimmedName || !normalizedEmail || !password) {
      throw new Error('Please fill in every field.');
    }

    setLoading(true);
    try {
      const client = requireSupabase();
      const legacyIds = legacyIdsForEmail(normalizedEmail);
      const { data, error } = await client.auth.signUp({
        email: normalizedEmail,
        password,
        options: {
          data: { full_name: trimmedName },
          emailRedirectTo: `${window.location.origin}/login`,
        },
      });
      if (error) throw error;

      if (data.session) {
        setLogoutRedirectTo(null);
        setUser(toAppUser(data.user));
        if (legacyIds.length) {
          if (isLocalMigrationHost()) {
            const migration = await migrateLegacyDocuments(legacyIds, data.session.access_token, normalizedEmail);
            if (migration?.total) {
              setMigrationNotice(
                migration.failed
                  ? `Transferred ${migration.migrated} of ${migration.total} local documents. ${migration.failed} could not be transferred; your local copies are retained.`
                  : `Transferred ${migration.migrated} local documents to your shared account.`
              );
            } else if (migration?.failed) {
              setMigrationNotice('Your account is signed in, but local documents could not be transferred. Your local copies are retained.');
            }
          } else {
            clearLegacyCredentials(normalizedEmail);
          }
        }
      }
      return { user: toAppUser(data.user), needsEmailConfirmation: !data.session };
    } finally {
      setLoading(false);
    }
  };

  const logout = async (redirectTo = '/') => {
    setLogoutRedirectTo(redirectTo);
    setLoading(true);
    try {
      const client = requireSupabase();
      const { error } = await client.auth.signOut();
      if (error) throw error;
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    logoutRedirectTo,
    migrationNotice,
    login,
    signup,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
