import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../../types';
import { AuthService } from './authService';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthProviderProps {
  children: ReactNode;
}

function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true); // Start with loading true
  const [otpPhase, setOtpPhase] = useState(false);
  const [otpUserId, setOtpUserId] = useState<number | null>(null);

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

  const startOtpLogin = async (email: string, password: string): Promise<number | null> => {
    setIsLoading(true);
    try {
      const res = await AuthService.startOtpLogin({ email, password });
      if (res) {
        setOtpUserId(res.userId);
        setOtpPhase(true);
      }
      return res ? res.userId : null;
    } catch (error) {
      // Do not rethrow for expected validation/credential errors
      console.error('AuthContext: OTP login error:', error);
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const verifyOtp = async (userId: number, otp: string): Promise<User | null> => {
    setIsLoading(true);
    try {
      const userData = await AuthService.verifyOtp(userId, otp);
      if (userData) {
        setUser(userData);
        setOtpPhase(false);
        setOtpUserId(null);
        return userData;
      }
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const resetOtpPhase = () => {
    setOtpPhase(false);
    setOtpUserId(null);
  };

  const value: AuthContextType = {
    user,
    login,
    logout,
    isLoading,
    startOtpLogin,
    verifyOtp,
    otpPhase,
    otpUserId,
    resetOtpPhase,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthProvider;
export { useAuth }; 