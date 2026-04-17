import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import api from './api';

const TASK_NAME = 'USTA_BACKGROUND_LOCATION';

// Background task — OS tərəfindən çağırılır
TaskManager.defineTask(TASK_NAME, async ({ data, error }) => {
  if (error) return;
  if (data) {
    const { locations } = data;
    const loc = locations?.[0];
    if (loc) {
      try {
        await api.put('/usta/konum', {
          lat: loc.coords.latitude,
          lng: loc.coords.longitude,
        });
      } catch {}
    }
  }
});

export async function startBackgroundLocation() {
  const { status: fg } = await Location.requestForegroundPermissionsAsync();
  if (fg !== 'granted') return false;

  const { status: bg } = await Location.requestBackgroundPermissionsAsync();
  if (bg !== 'granted') return false;

  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (started) return true;

  await Location.startLocationUpdatesAsync(TASK_NAME, {
    accuracy: Location.Accuracy.Balanced,
    timeInterval: 30000,
    distanceInterval: 50,
    showsBackgroundLocationIndicator: true,
    foregroundService: {
      notificationTitle: 'Usta Çağır',
      notificationBody: 'Onlayn — sifariş gözlənilir',
      notificationColor: '#0EA5E9',
    },
  });

  return true;
}

export async function stopBackgroundLocation() {
  const started = await Location.hasStartedLocationUpdatesAsync(TASK_NAME).catch(() => false);
  if (started) {
    await Location.stopLocationUpdatesAsync(TASK_NAME);
  }
}
