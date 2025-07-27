import AsyncStorage from '@react-native-async-storage/async-storage';

const API_BASE_URL = 'http://localhost:3001/api'; // Change this to your backend URL

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  details?: any[];
}

interface PaginationData {
  current_page: number;
  total_pages: number;
  total_items: number;
  items_per_page: number;
}

interface ItemsResponse {
  items: Item[];
  pagination: PaginationData;
}

interface AuthResponse {
  user: User;
  token: string;
}

interface User {
  id: string;
  name: string;
  email: string;
  phone?: string;
  created_at: string;
  updated_at?: string;
}

interface Item {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  item_type: 'lost' | 'found' | 'bounty';
  location?: string;
  latitude?: number;
  longitude?: number;
  reward_amount?: number;
  images?: string[];
  is_priority: boolean;
  status: string;
  payment_status?: string;
  payout_status?: string;
  payout_amount?: number;
  created_at: string;
  updated_at?: string;
  contact_info?: {
    name: string;
    phone: string;
    email: string;
  };
}

interface PaymentIntent {
  client_secret: string;
  payment_id: string;
  amount: number;
  platform_fee: number;
}

interface Notification {
  id: string;
  sender_id: string;
  recipient_id: string;
  type: string;
  title: string;
  message: string;
  item_id?: string;
  read_status: boolean;
  created_at: string;
  sender_name?: string;
  item_title?: string;
}

class ApiService {
  private token: string | null = null;

  constructor() {
    this.loadToken();
  }

  private async loadToken() {
    try {
      this.token = await AsyncStorage.getItem('auth_token');
    } catch (error) {
      console.error('Error loading token:', error);
    }
  }

  private async saveToken(token: string) {
    try {
      await AsyncStorage.setItem('auth_token', token);
      this.token = token;
    } catch (error) {
      console.error('Error saving token:', error);
    }
  }

  private async removeToken() {
    try {
      await AsyncStorage.removeItem('auth_token');
      this.token = null;
    } catch (error) {
      console.error('Error removing token:', error);
    }
  }

  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers.Authorization = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const url = `${API_BASE_URL}${endpoint}`;
      const response = await fetch(url, {
        ...options,
        headers: this.getHeaders(),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Request failed');
      }

      return data;
    } catch (error) {
      console.error('API request failed:', error);
      throw error;
    }
  }

  // Authentication
  async register(userData: {
    name: string;
    email: string;
    password: string;
    phone?: string;
  }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.success && response.data) {
      await this.saveToken(response.data.token);
    }

    return response.data!;
  }

  async login(credentials: { email: string; password: string }): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.success && response.data) {
      await this.saveToken(response.data.token);
    }

    return response.data!;
  }

  async logout(): Promise<void> {
    await this.removeToken();
  }

  async getCurrentUser(): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/me');
    return response.data!.user;
  }

  async updateProfile(profileData: { name?: string; phone?: string }): Promise<User> {
    const response = await this.request<{ user: User }>('/auth/profile', {
      method: 'PUT',
      body: JSON.stringify(profileData),
    });
    return response.data!.user;
  }

  async changePassword(passwordData: {
    currentPassword: string;
    newPassword: string;
  }): Promise<void> {
    await this.request('/auth/password', {
      method: 'PUT',
      body: JSON.stringify(passwordData),
    });
  }

  // Items
  async getItems(params?: {
    type?: 'lost' | 'found' | 'bounty';
    category?: string;
    search?: string;
    page?: number;
    limit?: number;
  }): Promise<ItemsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.category) queryParams.append('category', params.category);
    if (params?.search) queryParams.append('search', params.search);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<ItemsResponse>(endpoint);
    return response.data!;
  }

  async getItem(id: string): Promise<Item> {
    const response = await this.request<{ item: Item }>(`/items/${id}`);
    return response.data!.item;
  }

  async createItem(itemData: FormData): Promise<Item> {
    const headers = this.getHeaders();
    delete headers['Content-Type']; // Let the browser set the content type for FormData

    const response = await fetch(`${API_BASE_URL}/items`, {
      method: 'POST',
      headers,
      body: itemData,
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.error || 'Failed to create item');
    }

    return data.data.item;
  }

  async updateItem(id: string, itemData: Partial<Item>): Promise<Item> {
    const response = await this.request<{ item: Item }>(`/items/${id}`, {
      method: 'PUT',
      body: JSON.stringify(itemData),
    });
    return response.data!.item;
  }

  async deleteItem(id: string): Promise<void> {
    await this.request(`/items/${id}`, {
      method: 'DELETE',
    });
  }

  async reportItem(id: string, reportData: {
    action: 'found' | 'claimed';
    message?: string;
  }): Promise<void> {
    await this.request(`/items/${id}/report`, {
      method: 'POST',
      body: JSON.stringify(reportData),
    });
  }

  // Payments
  async createPaymentIntent(itemId: string, amount: number): Promise<PaymentIntent> {
    const response = await this.request<PaymentIntent>('/payments/create-intent', {
      method: 'POST',
      body: JSON.stringify({ item_id: itemId, amount }),
    });
    return response.data!;
  }

  async confirmPayment(paymentIntentId: string, itemId: string): Promise<void> {
    await this.request('/payments/confirm', {
      method: 'POST',
      body: JSON.stringify({
        payment_intent_id: paymentIntentId,
        item_id: itemId,
      }),
    });
  }

  async processPayout(itemId: string, finderId: string): Promise<void> {
    await this.request('/payments/payout', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        finder_id: finderId,
      }),
    });
  }

  async getPaymentHistory(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    payments: any[];
    pagination: PaginationData;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/payments/history${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{
      payments: any[];
      pagination: PaginationData;
    }>(endpoint);
    return response.data!;
  }

  // Users
  async getUserProfile(): Promise<User> {
    const response = await this.request<{ user: User }>('/users/profile');
    return response.data!.user;
  }

  async getUserItems(params?: {
    type?: 'lost' | 'found' | 'bounty';
    status?: string;
    page?: number;
    limit?: number;
  }): Promise<ItemsResponse> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/users/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<ItemsResponse>(endpoint);
    return response.data!;
  }

  async getUserStats(): Promise<any> {
    const response = await this.request<{ stats: any }>('/users/stats');
    return response.data!.stats;
  }

  async getUserReports(params?: {
    page?: number;
    limit?: number;
  }): Promise<{
    reports: any[];
    pagination: PaginationData;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());

    const endpoint = `/users/reports${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{
      reports: any[];
      pagination: PaginationData;
    }>(endpoint);
    return response.data!;
  }

  // Notifications
  async getNotifications(params?: {
    page?: number;
    limit?: number;
    unread_only?: boolean;
  }): Promise<{
    notifications: Notification[];
    pagination: PaginationData;
  }> {
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.limit) queryParams.append('limit', params.limit.toString());
    if (params?.unread_only) queryParams.append('unread_only', params.unread_only.toString());

    const endpoint = `/notifications${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
    const response = await this.request<{
      notifications: Notification[];
      pagination: PaginationData;
    }>(endpoint);
    return response.data!;
  }

  async markNotificationAsRead(id: string): Promise<Notification> {
    const response = await this.request<{ notification: Notification }>(`/notifications/${id}/read`, {
      method: 'PUT',
    });
    return response.data!.notification;
  }

  async markAllNotificationsAsRead(): Promise<void> {
    await this.request('/notifications/read-all', {
      method: 'PUT',
    });
  }

  async deleteNotification(id: string): Promise<void> {
    await this.request(`/notifications/${id}`, {
      method: 'DELETE',
    });
  }

  async getNotificationCount(): Promise<{
    total: number;
    unread: number;
  }> {
    const response = await this.request<{
      total: number;
      unread: number;
    }>('/notifications/count');
    return response.data!;
  }

  async sendItemFoundNotification(itemId: string, message?: string): Promise<void> {
    await this.request('/notifications/item-found', {
      method: 'POST',
      body: JSON.stringify({
        item_id: itemId,
        message,
      }),
    });
  }

  // Health check
  async healthCheck(): Promise<{ status: string; timestamp: string; environment: string }> {
    const response = await fetch(`${API_BASE_URL.replace('/api', '')}/health`);
    return response.json();
  }
}

export const apiService = new ApiService();
export type { Item, User, Notification, PaymentIntent }; 