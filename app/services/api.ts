const API_BASE_URL = 'http://10.215.3.79:3001/api';

interface LoginData {
  email: string;
  password: string;
}

interface RegisterData {
  name: string;
  email: string;
  password: string;
  phone?: string;
}

interface AuthResponse {
  success: boolean;
  data?: {
    user: {
      id: string;
      name: string;
      email: string;
      phone?: string;
      created_at: string;
    };
    token: string;
  };
  error?: string;
  details?: any[];
}

class ApiService {
  private baseURL: string;

  constructor() {
    this.baseURL = API_BASE_URL;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseURL}${endpoint}`;
    const requestId = Math.random().toString(36).substring(7);
    const startTime = Date.now();
    
    console.log(`[API-${requestId}] 🌐 Making request to: ${url}`);
    console.log(`[API-${requestId}] 📋 Method: ${options.method || 'GET'}`);
    console.log(`[API-${requestId}] 📦 Headers:`, options.headers);
    
    if (options.body) {
      const bodyData = JSON.parse(options.body as string);
      const sanitizedBody = { ...bodyData };
      if (sanitizedBody.password) {
        sanitizedBody.password = '***';
      }
      console.log(`[API-${requestId}] 📤 Request body:`, sanitizedBody);
    }
    
    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    try {
      console.log(`[API-${requestId}] 🚀 Sending request...`);
      const response = await fetch(url, config);
      const responseTime = Date.now() - startTime;
      
      console.log(`[API-${requestId}] 📥 Response received in ${responseTime}ms`);
      console.log(`[API-${requestId}] 📊 Status: ${response.status} ${response.statusText}`);
      console.log(`[API-${requestId}] 📋 Response headers:`, Object.fromEntries(response.headers.entries()));
      
      const data = await response.json();
      console.log(`[API-${requestId}] 📄 Response data:`, data);

      if (!response.ok) {
        console.error(`[API-${requestId}] ❌ Request failed:`, {
          status: response.status,
          statusText: response.statusText,
          error: data.error,
          details: data.details
        });
        throw new Error(data.error || 'Network error');
      }

      console.log(`[API-${requestId}] ✅ Request successful`);
      return data;
    } catch (error) {
      const responseTime = Date.now() - startTime;
      console.error(`[API-${requestId}] 💥 API request failed after ${responseTime}ms:`, error);
      console.error(`[API-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      throw error;
    }
  }

  // Authentication methods
  async login(credentials: LoginData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });
  }

  async register(userData: RegisterData): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  }

  async getCurrentUser(token: string): Promise<AuthResponse> {
    return this.request<AuthResponse>('/auth/me', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
  }

  // Token storage methods
  async storeToken(token: string): Promise<void> {
    try {
      // In a real app, you'd use secure storage like expo-secure-store
      // For now, we'll use AsyncStorage
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('authToken', token);
    } catch (error) {
      console.error('Error storing token:', error);
    }
  }

  async getStoredToken(): Promise<string | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      return await AsyncStorage.getItem('authToken');
    } catch (error) {
      console.error('Error getting stored token:', error);
      return null;
    }
  }

  async removeToken(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('authToken');
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  // User storage methods
  async storeUser(user: any): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('user', JSON.stringify(user));
    } catch (error) {
      console.error('Error storing user:', error);
    }
  }

  async getStoredUser(): Promise<any | null> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      const userString = await AsyncStorage.getItem('user');
      return userString ? JSON.parse(userString) : null;
    } catch (error) {
      console.error('Error getting stored user:', error);
      return null;
    }
  }

  async removeUser(): Promise<void> {
    try {
      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.removeItem('user');
    } catch (error) {
      console.error('Error removing user:', error);
    }
  }
}

export const apiService = new ApiService();
export default apiService; 