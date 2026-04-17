import { Audio } from 'expo-av';

async function sesOyna(tip) {
  try {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      playsInSilentModeIOS: true,
      staysActiveInBackground: true,
      shouldDuckAndroid: true,
    });
    const source = tip === 'bildiris'
      ? require('../../assets/bildiris.wav')
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

export async function mesajSesi() {
  await sesOyna('mesaj');
}

export async function bildirisSesi() {
  await sesOyna('bildiris');
}

export async function arqaFonBildiris(baslik, metn, tip = 'mesaj') {
  await sesOyna(tip);
}

export function bildirisSisteminiQur() {}
