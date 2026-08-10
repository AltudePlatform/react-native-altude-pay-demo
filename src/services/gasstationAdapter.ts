import AsyncStorage from '@react-native-async-storage/async-storage';

type GasStationInstance = any;

let instance: GasStationInstance | null = null;

function storageProxy() {
  return {
    getItem: async (key: string) => {
      try {
        return await AsyncStorage.getItem(key);
      } catch {
        return null;
      }
    },
    setItem: async (key: string, value: string) => {
      try {
        await AsyncStorage.setItem(key, value);
      } catch {
        // ignore
      }
    },
    removeItem: async (key: string) => {
      try {
        await AsyncStorage.removeItem(key);
      } catch {
        // ignore
      }
    },
  };
}

export function tryLoadGasstation(): GasStationInstance | null {
  if (instance !== null) return instance;

  try {
    // Use an indirect require to avoid Metro's static analysis bundling
    // (Metro tries to resolve direct `require('...')` calls at bundle time
    // which can cause native/node-only dependencies to break the bundle).
    // eslint-disable-next-line no-eval
    const dynamicRequire = eval("require");
    const pkg = dynamicRequire('@altude/gasstation');
    const AltudeGasStation = pkg?.AltudeGasStation ?? pkg?.default ?? null;
    if (!AltudeGasStation) {
      instance = null;
      return instance;
    }

    const options = {
      apiKey: (typeof process !== 'undefined' && process.env.ALTUDE_API_KEY) || '',
      network: (typeof process !== 'undefined' && process.env.ALTUDE_NETWORK) || 'devnet',
    } as any;

    instance = new AltudeGasStation(options);

    // If the package exposes a method to inject a storage adapter, prefer that.
    try {
      if (typeof instance.setStorage === 'function') {
        instance.setStorage(storageProxy());
      }
    } catch (e) {
      // ignore if storage injection not supported or fails
    }

    return instance;
  } catch (e) {
    instance = null;
    return null;
  }
}

export async function getTransactionConfig(): Promise<any> {
  const loaded = tryLoadGasstation();
  if (!loaded) throw new Error('Gasstation not available');

  if (typeof loaded.getTransactionConfig === 'function') {
    return await loaded.getTransactionConfig();
  }

  // Gasstation may not implement this; throw to let callers fallback.
  throw new Error('getTransactionConfig not implemented by gasstation');
}

export async function sendTransaction(signedTransaction: string): Promise<{signature: string}> {
  const loaded = tryLoadGasstation();
  if (!loaded) throw new Error('Gasstation not available');

  if (typeof loaded.send === 'function') {
    const res = await loaded.send({transaction: signedTransaction});
    // Normalize common shapes
    if (res && typeof res === 'object' && 'signature' in res) {
      return {signature: res.signature};
    }

    // If send returns a plain signature string
    if (typeof res === 'string') {
      return {signature: res};
    }

    // Unknown return; throw to trigger fallback
    throw new Error('Unexpected gasstation send result');
  }

  throw new Error('send not implemented by gasstation');
}

export default {
  tryLoadGasstation,
  getTransactionConfig,
  sendTransaction,
};
