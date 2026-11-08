/* eslint-disable react-refresh/only-export-components */
import React, { createContext, useContext, useState } from 'react';

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

const writeStoredJson = (key, value) => {
  localStorage.setItem(key, JSON.stringify(value));
};

const normalizeEmail = (email) => email.trim().toLowerCase();

const createUserId = () => {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID();
  }

  return `justice-ai-${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const buildSessionUser = (account) => ({
  id: account.id,
  name: account.name,
  email: account.email,
});

const getStoredAccounts = () => readStoredJson(ACCOUNTS_STORAGE_KEY, []);

const getStoredSession = () => {
  const storedUser = readStoredJson(USER_STORAGE_KEY, null);
  if (!storedUser) {
    return null;
  }

  return {
    id: storedUser.id || createUserId(),
    name: storedUser.name || storedUser.full_name || 'JusticeAI User',
    email: storedUser.email || '',
  };
};

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => getStoredSession());
  const [loading, setLoading] = useState(false);
  const [logoutRedirectTo, setLogoutRedirectTo] = useState(null);

  const persistSession = (nextUser) => {
    if (nextUser) {
      writeStoredJson(USER_STORAGE_KEY, nextUser);
    } else {
      localStorage.removeItem(USER_STORAGE_KEY);
    }
  };

  const login = async (email, password) => {
    const normalizedEmail = normalizeEmail(email);
    const accounts = getStoredAccounts();

    setLoading(true);
    try {
      const matchedAccount = accounts.find(
        (account) => account.email === normalizedEmail
      );

      if (!matchedAccount) {
        throw new Error('No account found for that email. Please sign up first.');
      }

      if (matchedAccount.password !== password) {
        throw new Error('Incorrect password. Please try again.');
      }

      const sessionUser = buildSessionUser(matchedAccount);
      setLogoutRedirectTo(null);
      persistSession(sessionUser);
      setUser(sessionUser);
      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const signup = async (name, email, password) => {
    const trimmedName = name.trim();
    const normalizedEmail = normalizeEmail(email);
    const accounts = getStoredAccounts();

    setLoading(true);
    try {
      if (!trimmedName || !normalizedEmail || !password) {
        throw new Error('Please fill in every field.');
      }

      const existingAccount = accounts.find(
        (account) => account.email === normalizedEmail
      );

      if (existingAccount) {
        throw new Error('An account with that email already exists. Please log in.');
      }

      const nextAccount = {
        id: createUserId(),
        name: trimmedName,
        email: normalizedEmail,
        password,
        createdAt: new Date().toISOString(),
      };

      writeStoredJson(ACCOUNTS_STORAGE_KEY, [...accounts, nextAccount]);

      const sessionUser = buildSessionUser(nextAccount);
      setLogoutRedirectTo(null);
      persistSession(sessionUser);
      setUser(sessionUser);
      return sessionUser;
    } finally {
      setLoading(false);
    }
  };

  const logout = (redirectTo = '/') => {
    setLogoutRedirectTo(redirectTo);
    persistSession(null);
    setUser(null);
  };

  const value = {
    user,
    loading,
    isAuthenticated: Boolean(user),
    logoutRedirectTo,
    login,
    signup,
    logout,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
