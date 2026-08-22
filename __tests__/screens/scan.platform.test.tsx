import {Platform} from 'react-native';
import {
  Camera,
  useCameraDevice,
  useCodeScanner,
} from 'react-native-vision-camera';
import ScanScreen from '../../src/screens/ScanScreen';
import {renderScreen} from '../setup/renderScreen';

describe('Scan platform support', () => {
  it('does not access VisionCamera on Android', async () => {
    const platformReplacement = jest.replaceProperty(Platform, 'OS', 'android');
    const cameraDeviceHook = jest.mocked(useCameraDevice);
    const codeScannerHook = jest.mocked(useCodeScanner);
    const permissionRequest = jest.mocked(Camera.requestCameraPermission);

    cameraDeviceHook.mockClear();
    codeScannerHook.mockClear();
    permissionRequest.mockClear();

    try {
      const tree = await renderScreen(ScanScreen);

      expect(JSON.stringify(tree)).toContain('QR scanning unavailable');
      expect(cameraDeviceHook).not.toHaveBeenCalled();
      expect(codeScannerHook).not.toHaveBeenCalled();
      expect(permissionRequest).not.toHaveBeenCalled();
    } finally {
      platformReplacement.restore();
    }
  });
});
