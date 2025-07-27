export type User = {
  id: string;
  email: string;
  full_name: string;
  phone?: string;
  avatar_url?: string;
  trust_score: number;
  is_verified: boolean;
  created_at: string;
  last_login?: string;
};