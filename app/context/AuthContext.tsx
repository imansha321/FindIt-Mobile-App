import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import apiService from '../services/api';

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
}

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (userData: { name: string; email: string; password: string; phone?: string }) => Promise<boolean>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const isAuthenticated = !!user && !!token;

  const checkAuth = async () => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[AUTH-CHECK-${requestId}] 🔍 Auth check started`);
    console.log(`[AUTH-CHECK-${requestId}] 📱 Platform: React Native`);
    
    try {
      console.log(`[AUTH-CHECK-${requestId}] 💾 Retrieving stored token...`);
      const storedToken = await apiService.getStoredToken();
      console.log(`[AUTH-CHECK-${requestId}] 🎫 Stored token: ${storedToken ? 'Found' : 'Not found'}`);
      
      console.log(`[AUTH-CHECK-${requestId}] 💾 Retrieving stored user...`);
      const storedUser = await apiService.getStoredUser();
      console.log(`[AUTH-CHECK-${requestId}] 👤 Stored user: ${storedUser ? storedUser.name : 'Not found'}`);

      if (storedToken && storedUser) {
        console.log(`[AUTH-CHECK-${requestId}] ✅ Both token and user found, verifying with server...`);
        // Verify token with server
        try {
          console.log(`[AUTH-CHECK-${requestId}] 🌐 Verifying token with server...`);
          const response = await apiService.getCurrentUser(storedToken);
          if (response.success && response.data) {
            console.log(`[AUTH-CHECK-${requestId}] ✅ Token verified successfully`);
            console.log(`[AUTH-CHECK-${requestId}] 👤 User verified: ${response.data.user.name}`);
            setUser(response.data.user);
            setToken(storedToken);
          } else {
            console.log(`[AUTH-CHECK-${requestId}] ❌ Token verification failed, clearing data...`);
            // Token is invalid, clear stored data
            await logout();
          }
        } catch (error) {
          console.log(`[AUTH-CHECK-${requestId}] ❌ Token verification error, clearing data...`);
          console.error(`[AUTH-CHECK-${requestId}] 📍 Verification error:`, error);
          // Token verification failed, clear stored data
          await logout();
        }
      } else {
        console.log(`[AUTH-CHECK-${requestId}] ℹ️ No stored authentication data found`);
      }
    } catch (error) {
      console.error(`[AUTH-CHECK-${requestId}] 💥 Auth check error:`, error);
      console.error(`[AUTH-CHECK-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    } finally {
      const responseTime = Date.now() - startTime;
      console.log(`[AUTH-CHECK-${requestId}] ✅ Auth check completed in ${responseTime}ms`);
      setIsLoading(false);
    }
  };

  const login = async (email: string, password: string): Promise<boolean> => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[AUTH-LOGIN-${requestId}] 🔐 Login attempt started`);
    console.log(`[AUTH-LOGIN-${requestId}] 📧 Email: ${email}`);
    console.log(`[AUTH-LOGIN-${requestId}] 📱 Platform: React Native`);
    
    try {
      console.log(`[AUTH-LOGIN-${requestId}] 🌐 Calling API service...`);
      const response = await apiService.login({ email, password });
      
      if (response.success && response.data) {
        console.log(`[AUTH-LOGIN-${requestId}] ✅ API response successful`);
        console.log(`[AUTH-LOGIN-${requestId}] 👤 User data received:`, {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone ? '***' : null
        });
        
        console.log(`[AUTH-LOGIN-${requestId}] 💾 Storing token...`);
        await apiService.storeToken(response.data.token);
        console.log(`[AUTH-LOGIN-${requestId}] ✅ Token stored successfully`);
        
        console.log(`[AUTH-LOGIN-${requestId}] 💾 Storing user data...`);
        await apiService.storeUser(response.data.user);
        console.log(`[AUTH-LOGIN-${requestId}] ✅ User data stored successfully`);
        
        console.log(`[AUTH-LOGIN-${requestId}] 🔄 Updating auth context...`);
        setUser(response.data.user);
        setToken(response.data.token);
        
        const responseTime = Date.now() - startTime;
        console.log(`[AUTH-LOGIN-${requestId}] 🎉 Login completed successfully in ${responseTime}ms`);
        return true;
      } else {
        console.log(`[AUTH-LOGIN-${requestId}] ❌ API response unsuccessful:`, response.error);
        return false;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[AUTH-LOGIN-${requestId}] 💥 Login failed after ${responseTime}ms:`, error);
      console.error(`[AUTH-LOGIN-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return false;
    }
  };

  const register = async (userData: { name: string; email: string; password: string; phone?: string }): Promise<boolean> => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[AUTH-REGISTER-${requestId}] 📝 Registration attempt started`);
    console.log(`[AUTH-REGISTER-${requestId}] 👤 Name: ${userData.name}`);
    console.log(`[AUTH-REGISTER-${requestId}] 📧 Email: ${userData.email}`);
    console.log(`[AUTH-REGISTER-${requestId}] 📱 Phone: ${userData.phone || 'Not provided'}`);
    console.log(`[AUTH-REGISTER-${requestId}] 📱 Platform: React Native`);
    
    try {
      console.log(`[AUTH-REGISTER-${requestId}] 🌐 Calling API service...`);
      const response = await apiService.register(userData);
      
      if (response.success && response.data) {
        console.log(`[AUTH-REGISTER-${requestId}] ✅ API response successful`);
        console.log(`[AUTH-REGISTER-${requestId}] 👤 User data received:`, {
          id: response.data.user.id,
          name: response.data.user.name,
          email: response.data.user.email,
          phone: response.data.user.phone ? '***' : null
        });
        
        console.log(`[AUTH-REGISTER-${requestId}] 💾 Storing token...`);
        await apiService.storeToken(response.data.token);
        console.log(`[AUTH-REGISTER-${requestId}] ✅ Token stored successfully`);
        
        console.log(`[AUTH-REGISTER-${requestId}] 💾 Storing user data...`);
        await apiService.storeUser(response.data.user);
        console.log(`[AUTH-REGISTER-${requestId}] ✅ User data stored successfully`);
        
        console.log(`[AUTH-REGISTER-${requestId}] 🔄 Updating auth context...`);
        setUser(response.data.user);
        setToken(response.data.token);
        
        const responseTime = Date.now() - startTime;
        console.log(`[AUTH-REGISTER-${requestId}] 🎉 Registration completed successfully in ${responseTime}ms`);
        return true;
      } else {
        console.log(`[AUTH-REGISTER-${requestId}] ❌ API response unsuccessful:`, response.error);
        return false;
      }
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[AUTH-REGISTER-${requestId}] 💥 Registration failed after ${responseTime}ms:`, error);
      console.error(`[AUTH-REGISTER-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      return false;
    }
  };

  const logout = async () => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[AUTH-LOGOUT-${requestId}] 🚪 Logout attempt started`);
    console.log(`[AUTH-LOGOUT-${requestId}] 👤 Current user: ${user?.name || 'None'}`);
    console.log(`[AUTH-LOGOUT-${requestId}] 📱 Platform: React Native`);
    
    try {
      console.log(`[AUTH-LOGOUT-${requestId}] 🗑️ Removing token...`);
      await apiService.removeToken();
      console.log(`[AUTH-LOGOUT-${requestId}] ✅ Token removed successfully`);
      
      console.log(`[AUTH-LOGOUT-${requestId}] 🗑️ Removing user data...`);
      await apiService.removeUser();
      console.log(`[AUTH-LOGOUT-${requestId}] ✅ User data removed successfully`);
      
      console.log(`[AUTH-LOGOUT-${requestId}] 🔄 Updating auth context...`);
      setUser(null);
      setToken(null);
      
      const responseTime = Date.now() - startTime;
      console.log(`[AUTH-LOGOUT-${requestId}] 🎉 Logout completed successfully in ${responseTime}ms`);
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[AUTH-LOGOUT-${requestId}] 💥 Logout failed after ${responseTime}ms:`, error);
      console.error(`[AUTH-LOGOUT-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
    }
  };

  useEffect(() => {
    checkAuth();
  }, []);

  const value: AuthContextType = {
    user,
    token,
    isLoading,
    isAuthenticated,
    login,
    register,
    logout,
    checkAuth,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 