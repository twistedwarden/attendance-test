import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../../types';
import { AuthService } from './authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        const userData = await AuthService.validateToken(token);
        if (userData) {
          setUser(userData);
        }
      }
    };
    
    checkAuth();
  }, []);

  const login = async (email: string, password: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userData = await AuthService.login({ email, password });
      if (userData) {
        setUser(userData);
        // In a real app, you'd store the JWT token
        localStorage.setItem('auth_token', 'mock_token');
        localStorage.setItem('user_data', JSON.stringify(userData));
        return userData;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    AuthService.logout();
    setUser(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}; 