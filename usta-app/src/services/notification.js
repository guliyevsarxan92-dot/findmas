import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function sesOyna(tip) {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    const source = tip === 'sifaris'
      ? require('../../assets/sifaris.wav')
      : require('../../assets/mesaj.wav');
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((s) => {
      if (s.didJustFinish) sound.unloadAsync().catch(() => {});
    });
  } catch (e) {
    console.warn('Səs xəta:', e);
  }
}

async function lokalBildiris(baslik, metn) {
  try {
    await Notifications.scheduleNotificationAsync({
      content: { title: baslik, body: metn, sound: true },
      trigger: null,
    });
  } catch {}
}

export async function mesajSesi() {
  await sesOyna('mesaj');
}

export async function sifarisSesi() {
  await sesOyna('sifaris');
}

export async function arqaFonBildiris(baslik, metn, tip = 'mesaj') {
  await sesOyna(tip);
  await lokalBildiris(baslik, metn);
}

export async function bildirisSisteminiQur() {
  try {
    const { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      await Notifications.requestPermissionsAsync();
    }
  } catch {}
}
