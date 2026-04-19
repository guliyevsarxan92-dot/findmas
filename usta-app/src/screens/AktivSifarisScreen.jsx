import { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity,
  Linking, Alert, Dimensions, Platform, Image, ScrollView, TextInput, Modal,
} from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import { io } from 'socket.io-client';
import AsyncStorage from '@react-native-async-storage/async-storage';
import api, { WS_URL } from '../services/api';
import C from '../utils/colors';

const { height: SCREEN_H } = Dimensions.get('window');

// ─── Loading placeholder ──────────────────────────────────────────────────────
function LoadScreen() {
  return (
    <View style={ls.wrap}>
      <View style={ls.iconBox}>
        <Ionicons name="briefcase-outline" size={34} color={C.primary} />
      </View>
      <Text style={ls.text}>Yüklənir...</Text>
    </View>
  );
}

const ls = StyleSheet.create({
  wrap:    { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: C.softBg },
  iconBox: {
    width: 68, height: 68, borderRadius: 20,
    backgroundColor: C.primaryLightBg,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 14,
  },
  text: { fontSize: 15, color: C.textSoft, fontWeight: '500' },
});
// ─────────────────────────────────────────────────────────────────────────────

// ─── Completed screen ─────────────────────────────────────────────────────────
function TamamlandiScreen({ sifaris, navigation }) {
  const komisyon = sifaris?.komisyon ? parseFloat(sifaris.komisyon).toFixed(2) : '0.00';
  return (
    <View style={ts.wrap}>
      <View style={ts.topSection}>
        <View style={ts.checkCircle}>
          <Ionicons name="checkmark" size={36} color="#16A34A" />
        </View>
        <Text style={ts.title}>Sifariş tamamlandı</Text>
        <Text style={ts.subtitle}>Balansdan {komisyon} ₼ komisyon tutuldu</Text>
      </View>
      <TouchableOpacity
        style={ts.btn}
        onPress={() => navigation.goBack()}
        activeOpacity={0.8}
      >
        <Text style={ts.btnText}>Davam et</Text>
      </TouchableOpacity>
    </View>
  );
}

const ts = StyleSheet.create({
  wrap: {
    flex: 1,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  topSection: {
    alignItems: 'center',
    marginBottom: 48,
  },
  checkCircle: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: '#F0FDF4',
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: C.dark,
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 15,
    color: C.textSoft,
    textAlign: 'center',
  },
  btn: {
    width: '100%',
    height: 54,
    borderRadius: 14,
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  btnText: { fontSize: 16, fontWeight: '700', color: C.darkSoft },
});
// ─────────────────────────────────────────────────────────────────────────────

export default function AktivSifarisScreen({ navigation }) {
  const [sifaris, setSifaris]     = useState(null);
  const [ustaLoc, setUstaLoc]     = useState(null);
  const [loading, setLoading]     = useState(true);
  const [legvModal, setLegvModal] = useState(false);
  const [legvSebeb, setLegvSebeb] = useState('');
  const [legvYuklenir, setLegvYuklenir] = useState(false);
  const [bitirilir, setBitirilir] = useState(false);
  const socketRef                 = useRef(null);
  const mapRef                    = useRef(null);

  useEffect(() => {
    yukle();
    qosul();
    return () => socketRef.current?.disconnect();
  }, []);

  async function yukle() {
    try {
      const { data } = await api.get('/sifaris/aktiv');
      setSifaris(data);
      if (data?.usta_lat && data?.usta_lng) {
        setUstaLoc({
          latitude:  parseFloat(data.usta_lat),
          longitude: parseFloat(data.usta_lng),
        });
      }
    } catch {}
    setLoading(false);
  }

  async function qosul() {
    const token = await AsyncStorage.getItem('token');
    const socket = io(WS_URL, { auth: { token } });
    socketRef.current = socket;
    socket.on('usta_konum', ({ lat, lng }) => {
      setUstaLoc({ latitude: parseFloat(lat), longitude: parseFloat(lng) });
    });
    socket.on('yeni_mesaj', () => {
      // Mesaj bildirişi — AktivSifaris ekranında aktivdirsə Chat-da göstəriləcək
    });
  }

  async function statusDeyis(novbeti) {
    try {
      await api.post(`/sifaris/${sifaris.id}/status`, { yeni_status: novbeti });
      setSifaris(prev => ({ ...prev, status: novbeti }));
      // "Yola çıxdım" basıldıqda xəritədə naviqasiya aç
      if (novbeti === 'yolda') {
        navAc();
      }
    } catch (err) {
      Alert.alert('Xəta', err.xeta || 'Xəta baş verdi');
    }
  }

  function navAc() {
    if (!sifaris) return;
    Linking.openURL(
      `https://www.google.com/maps/dir/?api=1&destination=${sifaris.unvan_lat},${sifaris.unvan_lng}`
    );
  }

  function zengVur() {
    if (sifaris?.istifadeci?.telefon) {
      Linking.openURL(`tel:${sifaris.istifadeci.telefon}`);
    }
  }

  function mesajYaz() {
    if (sifaris) navigation.navigate('Chat', { sifaris_id: sifaris.id });
  }

  async function isiBitir() {
    setBitirilir(true);
    try {
      const { data } = await api.post(`/sifaris/${sifaris.id}/status`, { yeni_status: 'tamamlandi' });
      setSifaris(prev => ({ ...prev, status: 'tamamlandi', komisyon: data.komisyon }));
    } catch (err) {
      Alert.alert('Xəta', err?.xeta || 'Xəta baş verdi');
    } finally {
      setBitirilir(false);
    }
  }

  async function ustaLegvet() {
    if (legvSebeb.trim().length < 5) {
      Alert.alert('Xəta', 'Ləğv səbəbini ən azı 5 simvol yazın');
      return;
    }
    setLegvYuklenir(true);
    try {
      await api.post(`/sifaris/${sifaris.id}/usta-legv`, { sebeb: legvSebeb.trim() });
      setLegvModal(false);
      navigation.goBack();
    } catch (err) {
      Alert.alert('Xəta', err?.xeta || 'Ləğv edilmədi');
    } finally {
      setLegvYuklenir(false);
    }
  }

  function mapeMerkezle() {
    if (!mapRef.current || !sifaris?.unvan_lat) return;
    mapRef.current.animateToRegion({
      latitude:       parseFloat(sifaris.unvan_lat),
      longitude:      parseFloat(sifaris.unvan_lng),
      latitudeDelta:  0.04,
      longitudeDelta: 0.04,
    }, 600);
  }

  function menimi() {
    if (!mapRef.current || !ustaLoc) return;
    mapRef.current.animateToRegion({ ...ustaLoc, latitudeDelta: 0.02, longitudeDelta: 0.02 }, 600);
  }

  if (loading) return <LoadScreen />;
  if (!sifaris) return <LoadScreen />;
  if (sifaris.status === 'tamamlandi') {
    return <TamamlandiScreen sifaris={sifaris} navigation={navigation} />;
  }

  const STATUS_ORDER = ['qebul_edildi', 'yolda', 'baslandi'];
  const currentIdx = STATUS_ORDER.indexOf(sifaris.status);

  const basSehri = (
    (sifaris.istifadeci?.ad?.[0]    || '') +
    (sifaris.istifadeci?.soyad?.[0] || '')
  ).toUpperCase();

  const maskedPhone = sifaris.istifadeci?.telefon
    ? sifaris.istifadeci.telefon.replace(
        /(\+?\d{3})(\d{2})(\d{3})(\d{2})(\d{2})/,
        '$1 $2 *** $4 $5'
      )
    : '—';

  const musteriAd = [sifaris.istifadeci?.ad, sifaris.istifadeci?.soyad]
    .filter(Boolean).join(' ') || 'Müştəri';

  const unvanCoord = sifaris.unvan_lat && sifaris.unvan_lng
    ? { latitude: parseFloat(sifaris.unvan_lat), longitude: parseFloat(sifaris.unvan_lng) }
    : null;

  const initialRegion = unvanCoord
    ? { ...unvanCoord, latitudeDelta: 0.06, longitudeDelta: 0.06 }
    : { latitude: 40.4093, longitude: 49.8671, latitudeDelta: 0.06, longitudeDelta: 0.06 };

  const polyCoords = ustaLoc && unvanCoord ? [ustaLoc, unvanCoord] : [];

  // Action steps shown always — enabled based on current status
  const steps = [
    { novbeti: 'yolda',      label: 'Yola çıxdım', idx: 0, icon: 'car-outline'       },
    { novbeti: 'baslandi',   label: 'Çatdım',       idx: 1, icon: 'checkmark-outline' },
    { novbeti: 'tamamlandi', label: 'İşi bitirdim', idx: 2, icon: 'flag-outline'      },
  ];

  return (
    <View style={s.wrap}>

      {/* ── FULL-SCREEN MAP ──────────────────────────────────────────────── */}
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFillObject}
        initialRegion={initialRegion}
        customMapStyle={LIGHT_MAP_STYLE}
        showsUserLocation={false}
        showsCompass={false}
        showsMyLocationButton={false}
        toolbarEnabled={false}
      >
        {ustaLoc && (
          <Marker coordinate={ustaLoc} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={s.ustaMarker}>
              <Ionicons name="person" size={13} color={C.white} />
            </View>
          </Marker>
        )}
        {unvanCoord && (
          <Marker coordinate={unvanCoord} anchor={{ x: 0.5, y: 1 }}>
            <View style={s.unvanMarker}>
              <Ionicons name="location" size={14} color={C.white} />
            </View>
          </Marker>
        )}
        {polyCoords.length === 2 && (
          <Polyline
            coordinates={polyCoords}
            strokeColor="#1F2937"
            strokeWidth={3}
          />
        )}
      </MapView>

      {/* ── MAP CONTROL BUTTONS (top-right) ─────────────────────────────── */}
      <View style={s.mapBtns}>
        <TouchableOpacity style={s.mapBtn} onPress={mapeMerkezle} activeOpacity={0.85}>
          <Ionicons name="map-outline" size={18} color={C.dark} />
        </TouchableOpacity>
        <TouchableOpacity style={s.mapBtn} onPress={menimi} activeOpacity={0.85}>
          <Ionicons name="navigate-outline" size={18} color={C.dark} />
        </TouchableOpacity>
      </View>

      {/* ── BOTTOM SHEET ────────────────────────────────────────────────── */}
      <View style={s.sheet}>
        <View style={s.handle} />
        <ScrollView style={{ maxHeight: SCREEN_H * 0.55 }} showsVerticalScrollIndicator={false} bounces={false}>

        {/* Section label */}
        <Text style={s.sectionLabel}>Customer Info</Text>

        {/* Customer info row */}
        <View style={s.custRow}>
          <View style={s.custMid}>
            <View style={s.custNameRow}>
              <Text style={s.custName} numberOfLines={1}>{musteriAd}</Text>
              <Ionicons name="star" size={12} color={C.warning} style={{ marginLeft: 6 }} />
              <Text style={s.custRating}>
                {sifaris.istifadeci?.reytinq
                  ? parseFloat(sifaris.istifadeci.reytinq).toFixed(1)
                  : '4.8'}
              </Text>
            </View>
            <Text style={s.rowLabel}>Masked Phone</Text>
            <Text style={s.maskedPhone}>{maskedPhone}</Text>
          </View>
          <TouchableOpacity style={s.callBtn} onPress={zengVur} activeOpacity={0.8}>
            <Ionicons name="call" size={20} color={C.dark} />
            <Text style={s.callBtnText}>Zəng et</Text>
          </TouchableOpacity>
        </View>

        {/* Address row */}
        <View style={s.addrRow}>
          <View style={s.addrMid}>
            <Text style={s.rowLabel}>Address</Text>
            <Text style={s.addrText} numberOfLines={1}>
              {sifaris.unvan_metn || 'Müştəri ünvanı'}
            </Text>
          </View>
          <TouchableOpacity style={s.chatBtn} onPress={mesajYaz} activeOpacity={0.8}>
            <Ionicons name="chatbubble-outline" size={20} color={C.dark} />
            <Text style={s.chatBtnText}>Mesaj yaz</Text>
          </TouchableOpacity>
        </View>

        {/* Problem description */}
        {sifaris.problem_tesvirr ? (
          <View style={s.problemBox}>
            <Text style={s.rowLabel}>Problem</Text>
            <Text style={s.problemMetn}>{sifaris.problem_tesvirr}</Text>
          </View>
        ) : null}

        {/* Problem photos */}
        {sifaris.problem_foto && sifaris.problem_foto.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.fotoScroll}>
            {sifaris.problem_foto.map((uri, i) => (
              <Image key={i} source={{ uri }} style={s.problemFoto} />
            ))}
          </ScrollView>
        ) : null}

        {/* Separator */}
        <View style={s.sep} />

        {/* Usta cancel button — only before work started (yuxarıda göstərilir) */}
        {(sifaris.status === 'qebul_edildi' || sifaris.status === 'yolda') && (
          <TouchableOpacity style={s.legvBtn} onPress={() => setLegvModal(true)} activeOpacity={0.8}>
            <Ionicons name="close-circle-outline" size={16} color={C.error} />
            <Text style={s.legvBtnMetn}>Sifarişi ləğv et</Text>
          </TouchableOpacity>
        )}

        {/* Action buttons — all 3 always shown */}
        {steps.map((step) => {
          const isDone    = step.idx < currentIdx;
          const isCurrent = step.idx === currentIdx;
          const isLast    = step.idx === 2;

          if (isDone) return null; // hide completed steps

          if (isCurrent) {
            const onPressFn = isLast
              ? () => Alert.alert('Təsdiq', 'İşi bitirdiyinizi təsdiqləyin. Xidmət haqqından 10% komisyon balansdan tutulacaq.', [
                  { text: 'Bəli, bitirdim', onPress: isiBitir },
                  { text: 'Xeyr' },
                ])
              : () => Alert.alert('Təsdiq', `"${step.label}" əməliyyatını təsdiqləyin?`, [
                  { text: 'Bəli', onPress: () => statusDeyis(step.novbeti) },
                  { text: 'Xeyr' },
                ]);
            return (
              <TouchableOpacity
                key={step.novbeti}
                style={[s.actionBtn, isLast && s.outlinedBtn]}
                onPress={onPressFn}
                activeOpacity={0.85}
              >
                <Text style={[s.actionBtnText, isLast && s.outlinedBtnText]}>{step.label}</Text>
                <View style={[s.actionBtnIcon, isLast && s.outlinedBtnIcon]}>
                  <Ionicons name={step.icon} size={18} color={isLast ? C.textSoft : C.white} />
                </View>
              </TouchableOpacity>
            );
          }

          // Future steps — outlined
          return (
            <View key={step.novbeti} style={[s.actionBtn, s.disabledBtn]}>
              <Text style={s.disabledBtnText}>{step.label}</Text>
              <View style={s.disabledBtnIcon}>
                <Ionicons name={step.icon} size={18} color={C.border} />
              </View>
            </View>
          );
        })}

        </ScrollView>
      </View>

      {/* Cancel modal */}
      <Modal visible={legvModal} transparent animationType="slide">
        <View style={s.modalOverlay}>
          <View style={s.modalBox}>
            <Text style={s.modalBasliq}>Sifarişi ləğv et</Text>
            <Text style={s.modalAciq}>Ləğv səbəbini yazın (reytinqinizə təsir edəcək)</Text>
            <TextInput
              style={s.modalInput}
              value={legvSebeb}
              onChangeText={setLegvSebeb}
              placeholder="Məs: Başqa bir işə getmək məcburiyyətindəyəm..."
              placeholderTextColor={C.textMuted}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
            />
            <TouchableOpacity
              style={[s.modalBtn, s.modalBtnRed]}
              onPress={ustaLegvet}
              disabled={legvYuklenir}
              activeOpacity={0.85}
            >
              <Text style={s.modalBtnMetn}>{legvYuklenir ? 'Göndərilir...' : 'Ləğv et'}</Text>
            </TouchableOpacity>
            <TouchableOpacity style={s.modalBtn} onPress={() => setLegvModal(false)} activeOpacity={0.85}>
              <Text style={[s.modalBtnMetn, { color: C.textSoft }]}>Geri qayıt</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: C.softBg },

  // ── map control buttons ──
  mapBtns: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 60 : 48,
    right: 16,
    gap: 10,
    zIndex: 10,
  },
  mapBtn: {
    width: 42,
    height: 42,
    borderRadius: 10,
    backgroundColor: C.white,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
    borderWidth: 1,
    borderColor: C.border,
  },

  // ── markers ──
  ustaMarker: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.primary,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.white,
  },
  unvanMarker: {
    width: 30, height: 30, borderRadius: 15,
    backgroundColor: C.error,
    alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: C.white,
  },

  // ── bottom sheet ──
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 34 : 24,
    shadowColor: '#000',
    shadowOpacity: 0.12,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: -4 },
    elevation: 14,
  },
  handle: {
    alignSelf: 'center',
    width: 44, height: 5, borderRadius: 3,
    backgroundColor: C.border,
    marginBottom: 14,
  },

  // ── section label ──
  sectionLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: C.dark,
    marginBottom: 10,
  },

  // ── customer row ──
  custRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  custMid: { flex: 1 },
  custNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  custName:   { fontSize: 15, fontWeight: '700', color: C.dark },
  custRating: { fontSize: 13, fontWeight: '600', color: C.dark, marginLeft: 2 },
  rowLabel:   { fontSize: 11, color: C.textMuted, fontWeight: '600', marginBottom: 1 },
  maskedPhone:{ fontSize: 13, color: C.textSoft, fontWeight: '500' },
  callBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.softBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  callBtnText: { fontSize: 11, fontWeight: '600', color: C.darkSoft },

  // ── problem ──
  problemBox: { marginBottom: 10 },
  problemMetn: { fontSize: 13, color: C.dark, fontWeight: '500', marginTop: 2 },
  fotoScroll: { marginBottom: 12 },
  problemFoto: {
    width: 80, height: 80, borderRadius: 10,
    marginRight: 8, backgroundColor: C.softBg,
  },

  // ── address row ──
  addrRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    marginBottom: 14,
  },
  addrMid: { flex: 1 },
  addrText: {
    fontSize: 13,
    color: C.dark,
    fontWeight: '500',
  },
  chatBtn: {
    flexDirection: 'column',
    alignItems: 'center',
    gap: 2,
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    backgroundColor: C.softBg,
    borderWidth: 1,
    borderColor: C.border,
  },
  chatBtnText: { fontSize: 11, fontWeight: '600', color: C.darkSoft },

  // ── separator ──
  sep: {
    height: 1,
    backgroundColor: C.border,
    marginBottom: 12,
  },

  // ── green action button ──
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
    height: 52,
    borderRadius: 14,
    backgroundColor: C.primary,
    marginBottom: 10,
    shadowColor: C.primary,
    shadowOpacity: 0.3,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  actionBtnText: {
    fontSize: 15,
    fontWeight: '700',
    color: C.white,
    flex: 1,
    textAlign: 'center',
    marginLeft: 34,
  },
  actionBtnIcon: {
    position: 'absolute',
    right: 14,
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },

  // ── outlined button (İşi bitirdim) ──
  outlinedBtn: {
    backgroundColor: C.white,
    borderWidth: 1.5,
    borderColor: C.border,
    shadowOpacity: 0,
    elevation: 0,
  },
  outlinedBtnText: { color: C.darkSoft },
  outlinedBtnIcon: { backgroundColor: C.softBg },

  // ── usta cancel button ──
  legvBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    marginTop: 2,
  },
  legvBtnMetn: { fontSize: 13, fontWeight: '600', color: C.error },

  // ── cancel modal ──
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalBox: {
    backgroundColor: C.white,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  modalBasliq: { fontSize: 18, fontWeight: '800', color: C.dark, marginBottom: 6 },
  modalAciq: { fontSize: 13, color: C.textSoft, marginBottom: 14, lineHeight: 18 },
  modalInput: {
    borderWidth: 1.5,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: C.dark,
    minHeight: 80,
    marginBottom: 16,
  },
  modalBtn: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: 8,
    backgroundColor: C.softBg,
  },
  modalBtnRed: { backgroundColor: '#FEF2F2', borderWidth: 1, borderColor: '#FCA5A5' },
  modalBtnMetn: { fontSize: 15, fontWeight: '700', color: C.error },

  // ── disabled future step ──
  disabledBtn: {
    backgroundColor: C.softBg,
    shadowOpacity: 0,
    elevation: 0,
    borderWidth: 1,
    borderColor: C.border,
  },
  disabledBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: C.border,
    flex: 1,
    textAlign: 'center',
    marginLeft: 34,
  },
  disabledBtnIcon: {
    position: 'absolute',
    right: 14,
    width: 32, height: 32, borderRadius: 9,
    backgroundColor: C.white,
    alignItems: 'center', justifyContent: 'center',
  },
});

const LIGHT_MAP_STYLE = [
  { elementType: 'geometry',                   stylers: [{ color: '#f5f5f5' }] },
  { elementType: 'labels.icon',                stylers: [{ visibility: 'off' }] },
  { elementType: 'labels.text.fill',           stylers: [{ color: '#616161' }] },
  { elementType: 'labels.text.stroke',         stylers: [{ color: '#f5f5f5' }] },
  { featureType: 'road',           elementType: 'geometry',           stylers: [{ color: '#ffffff' }] },
  { featureType: 'road.arterial',  elementType: 'labels.text.fill',   stylers: [{ color: '#757575' }] },
  { featureType: 'road.highway',   elementType: 'geometry',           stylers: [{ color: '#dadada' }] },
  { featureType: 'water',          elementType: 'geometry',           stylers: [{ color: '#c9e8f5' }] },
  { featureType: 'water',          elementType: 'labels.text.fill',   stylers: [{ color: '#9e9e9e' }] },
  { featureType: 'poi',            elementType: 'geometry',           stylers: [{ color: '#eeeeee' }] },
  { featureType: 'poi.park',       elementType: 'geometry',           stylers: [{ color: '#d0f0d0' }] },
  { featureType: 'administrative', elementType: 'geometry.stroke',    stylers: [{ color: '#c9b2a6' }] },
];
