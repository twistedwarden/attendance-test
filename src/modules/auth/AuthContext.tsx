import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../../types';
import { AuthService } from './authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true

  useEffect(() => {
    // Check for existing session on app load
    const checkAuth = async () => {
      try {
        const token = AuthService.getStoredToken();
        const storedUser = AuthService.getStoredUser();
        
        if (token && storedUser) {
          // Validate token with backend
          const validatedUser = await AuthService.validateToken(token);
          if (validatedUser) {
            setUser(validatedUser);
          } else {
            // Token is invalid, clear storage
            AuthService.logout();
          }
        }
      } catch (error) {
        console.error('Auth check error:', error);
        // Clear any invalid data
        AuthService.logout();
      } finally {
        setIsLoading(false);
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
        return userData;
      }
      return null;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    setIsLoading(true);
    try {
      await AuthService.logout();
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      setUser(null);
      setIsLoading(false);
    }
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