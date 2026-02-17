// Web implementation using localStorage (not as secure, but works for development)
const SESSION_KEY = 'session';

export const saveSession = async (token: string): Promise<void> => {
  try {
    localStorage.setItem(SESSION_KEY, token);
  } catch (error) {
    console.error('Failed to save session:', error);
  }
};

export const getSession = async (): Promise<string | null> => {
  try {
    return localStorage.getItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to get session:', error);
    return null;
  }
};

export const clearSession = async (): Promise<void> => {
  try {
    localStorage.removeItem(SESSION_KEY);
  } catch (error) {
    console.error('Failed to clear session:', error);
  }
};
