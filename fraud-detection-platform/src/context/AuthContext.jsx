import { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try {
      const saved = localStorage.getItem('user');
      return saved ? JSON.parse(saved) : null;
    } catch (e) {
      return null;
    }
  });

  const [token, setToken] = useState(() => localStorage.getItem('token') || '');
  const [loading, setLoading] = useState(false);

  const login = async (email, password) => {
    console.log('[AUTH] Initiating login request for:', email);
    const res = await api.post('/auth/login', { email, password });
    
    const { token: newToken, user: userData } = res.data;
    console.log('[AUTH] Login successful. User role:', userData?.role);

    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(userData));
    setToken(newToken);
    setUser(userData);
    return userData;
  };

  const logout = () => {
    console.log('[AUTH] Logging out user');
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setToken('');
    setUser(null);
  };

  const refreshUser = async () => {
    const savedToken = localStorage.getItem('token');
    if (!savedToken) return;
    try {
      const res = await api.get('/user/profile');
      const profileData = res.data;
      const updatedUser = {
        id: profileData._id || profileData.id || user?.id,
        name: profileData.name || user?.name,
        email: profileData.email || user?.email,
        role: (profileData.role || user?.role || 'user').toLowerCase(),
        isFrozen: profileData.isFrozen || profileData.status === 'frozen',
        status: profileData.status
      };
      localStorage.setItem('user', JSON.stringify(updatedUser));
      setUser(updatedUser);
    } catch (err) {
      if (err.response?.status === 401 || err.response?.status === 403) {
        // If unauthenticated or token expired, log out cleanly
        logout();
      }
    }
  };

  useEffect(() => {
    if (token) {
      refreshUser();
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        logout,
        refreshUser,
        isFrozen: user?.isFrozen || user?.status === 'frozen'
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
