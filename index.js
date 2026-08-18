/**
 * @format
 */

// Must come before any module that touches crypto.getRandomValues (uuid, @solana/web3.js).
import 'react-native-get-random-values';
import {Buffer} from 'buffer';
import {sha256} from '@noble/hashes/sha256';
import 'react-native-gesture-handler';
import {enableScreens} from 'react-native-screens';
import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';

globalThis.Buffer = globalThis.Buffer || Buffer;

const crypto = globalThis.crypto || {};
const subtle = crypto.subtle || {};

if (typeof subtle.digest !== 'function') {
	subtle.digest = async (algorithm, data) => {
		const name = typeof algorithm === 'string' ? algorithm : algorithm.name;
		if (name !== 'SHA-256') {
			throw new Error(`Unsupported digest algorithm: ${name}`);
		}

		const input = data instanceof ArrayBuffer
			? new Uint8Array(data)
			: new Uint8Array(data.buffer, data.byteOffset, data.byteLength);
		const digest = sha256(input);
		return digest.buffer.slice(
			digest.byteOffset,
			digest.byteOffset + digest.byteLength,
		);
	};
}

crypto.subtle = subtle;
globalThis.crypto = crypto;

enableScreens();

AppRegistry.registerComponent(appName, () => App);
