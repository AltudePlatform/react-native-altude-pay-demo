import '@react-native-anywhere/polyfill-base64';

import { createClient } from '@dynamic-labs/client';
import { ReactNativeExtension } from '@dynamic-labs/react-native-extension';
import {SolanaExtension} from '@dynamic-labs/solana-extension';
import { ViemExtension } from '@dynamic-labs/viem-extension';

import {name as appName} from '../../app.json';

export const dynamicClient = createClient({
  environmentId: process.env.DYNAMIC_ENVIRONMENT_ID || '',
  appLogoUrl: process.env.DYNAMIC_APP_LOGO || 'https://demo.dynamic.xyz/favicon-32x32.png',
  appName: appName,
})
  .extend(
    ReactNativeExtension({
      appOrigin: process.env.DYNAMIC_APP_ORIGIN || 'http://localhost:8081',
    }),
  )
  .extend(SolanaExtension())
  .extend(ViemExtension());