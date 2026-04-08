import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const storedUser = localStorage.getItem('justice-ai-user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Session checks via API would go here
  }, []);

  const login = async (email, password) => {
    // Mock API call
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (email && password) {
          const mockUser = { id: '1', name: 'Counselor', email };
          localStorage.setItem('justice-ai-user', JSON.stringify(mockUser));
          setUser(mockUser);
          resolve(mockUser);
        } else {
          reject('Invalid credentials');
        }
      }, 1000);
    });
  };

  const signup = async (name, email, password) => {
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        if (name && email && password) {
          const mockUser = { id: '1', name, email };
          localStorage.setItem('justice-ai-user', JSON.stringify(mockUser));
          setUser(mockUser);
          resolve(mockUser);
        } else {
          reject('Please fill all fields');
        }
      }, 1000);
    });
  };

  const logout = () => {
    localStorage.removeItem('justice-ai-user');
    setUser(null);
  };

  const value = {
    user,
    login,
    signup,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
};
