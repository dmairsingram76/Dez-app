import * as SecureStore from 'expo-secure-store';
import { v4 as uuid } from 'uuid';

const KEY = 'dez_anonymous_id';

export async function getAnonymousId(): Promise<string> {
  let id = await SecureStore.getItemAsync(KEY);

  if (!id) {
    id = uuid();
    await SecureStore.setItemAsync(KEY, id);
  }

  return id;
}
