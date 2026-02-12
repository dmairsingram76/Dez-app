export type ChatMessage = {
  id: string;
  role: 'dez' | 'user';
  text: string;
  options?: string[];
};

export type ChatStep = {
  key: string;
  question: string;
  options?: string[];
};

export type Facility = {
  id: string;
  name: string;
  description?: string;
  activity_types: string[];
  latitude: number;
  longitude: number;
  distance_meters: number;
  metadata?: Record<string, unknown>;
};

export type Recommendation = {
  id: string;
  activity: string;
  facility_id?: string;
  reasoning?: string;
  score?: number;
  created_at?: string;
};

export type UserProfile = {
  user_id: string;
  display_name?: string;
  age?: number;
  height_cm?: number;
  weight_kg?: number;
  preferences?: Record<string, unknown>;
  created_at?: string;
  updated_at?: string;
};
