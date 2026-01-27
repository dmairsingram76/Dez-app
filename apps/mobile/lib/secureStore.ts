import * as SecureStore from 'expo-secure-store';

export const saveSession = (token: string) =>
  SecureStore.setItemAsync('session', token);

export const getSession = () =>
  SecureStore.getItemAsync('session');

export const clearSession = () =>
  SecureStore.deleteItemAsync('session');
