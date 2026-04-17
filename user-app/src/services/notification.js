import { Audio } from 'expo-av';
import * as Notifications from 'expo-notifications';

const mesajSes = require('../../assets/mesaj.wav');
const bildirisSes = require('../../assets/bildiris.wav');

Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

async function sesYukle() {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
  } catch {}
}

async function sesOyna(tip) {
  try {
    await sesYukle();
    const source = tip === 'bildiris' ? bildirisSes : mesajSes;
    const { sound } = await Audio.Sound.createAsync(source);
    await sound.playAsync();
    sound.setOnPlaybackStatusUpdate((status) => {
      if (status.didJustFinish) sound.unloadAsync();
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

export async function bildirisSesi() {
  await sesOyna('bildiris');
}

export async function arqaFonBildiris(baslik, metn, tip = 'mesaj') {
  await sesOyna(tip);
  await lokalBildiris(baslik, metn);
}

export async function bildirisSisteminiQur() {
  const { status } = await Notifications.getPermissionsAsync();
  if (status !== 'granted') {
    await Notifications.requestPermissionsAsync();
  }
}
