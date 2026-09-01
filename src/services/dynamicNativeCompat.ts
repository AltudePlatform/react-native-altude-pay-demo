import {Linking} from 'react-native';
import * as Keychain from 'react-native-keychain';

const URL_SCHEME = 'altudepay';
const KEYCHAIN_SERVICE_PREFIX = 'com.altudepay.dynamic.';

export function requireOptionalNativeModule(): null {
  return null;
}

export function requireNativeModule(): never {
  throw new Error('Optional Dynamic native overlay is unavailable.');
}

export function createURL(path = ''): string {
  return `${URL_SCHEME}://${path.replace(/^\/+/, '')}`;
}

export function getInitialURL(): Promise<string | null> {
  return Linking.getInitialURL();
}

export function addEventListener(
  type: 'url',
  handler: (event: {url: string}) => void,
): {remove: () => void} {
  return Linking.addEventListener(type, handler);
}

export function openURL(url: string): Promise<void> {
  return Linking.openURL(url);
}

export async function openAuthSessionAsync(
  url: string,
  redirectUrl: string,
): Promise<{type: 'success'; url: string}> {
  const callback = new Promise<string>(resolve => {
    const subscription = Linking.addEventListener('url', event => {
      if (event.url.startsWith(redirectUrl)) {
        subscription.remove();
        resolve(event.url);
      }
    });
  });

  await Linking.openURL(url);
  return {type: 'success', url: await callback};
}

function keychainService(key: string): string {
  return `${KEYCHAIN_SERVICE_PREFIX}${key}`;
}

export async function getItemAsync(key: string): Promise<string | null> {
  const credentials = await Keychain.getGenericPassword({
    service: keychainService(key),
  });

  return credentials ? credentials.password : null;
}

export async function setItemAsync(key: string, value: string): Promise<void> {
  await Keychain.setGenericPassword(key, value, {
    service: keychainService(key),
  });
}

export async function deleteItemAsync(key: string): Promise<void> {
  await Keychain.resetGenericPassword({service: keychainService(key)});
}