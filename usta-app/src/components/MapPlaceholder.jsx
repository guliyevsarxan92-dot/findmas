import { Platform } from 'react-native';

// Web-də MapView əvəzinə boş View
export function SafeMapView({ style, children, ...props }) {
  if (Platform.OS === 'web') {
    const { View } = require('react-native');
    return <View style={[{ backgroundColor: '#e8eaf0' }, style]} />;
  }
  const MapView = require('react-native-maps').default;
  return <MapView style={style} {...props}>{children}</MapView>;
}

export function SafeMarker(props) {
  if (Platform.OS === 'web') return null;
  const { Marker } = require('react-native-maps');
  return <Marker {...props} />;
}

export function SafePolyline(props) {
  if (Platform.OS === 'web') return null;
  const { Polyline } = require('react-native-maps');
  return <Polyline {...props} />;
}
