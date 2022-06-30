import { Dispatch, MutableRefObject, SetStateAction } from 'react';

export const getDevicesCount = async (): Promise<number> => {
  let cameraCount = 0;

  try {
    const devices = await navigator.mediaDevices.enumerateDevices();
    devices.map((device) => {
      if (device.kind != 'videoinput') {
        return;
      }

      cameraCount = cameraCount + 1;
    });
  } catch (err) {
    // Handle Error
  }
  return cameraCount ?? 0;
};
