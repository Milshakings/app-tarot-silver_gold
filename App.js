import React from 'react';
import { View, StyleSheet, SafeAreaView, Platform } from 'react-native';
import DashboardScreen from './src/screens/DashboardScreen';

export default function App() {
  return (
    <View style={styles.rootContainer}>
      <DashboardScreen />
    </View>
  );
}

const styles = StyleSheet.create({
  rootContainer: {
    flex: 1,
    backgroundColor: '#0F172A',
    // En web, asegura que el contenedor ocupe el 100% de la ventana
    ...(Platform.OS === 'web' && {
      height: '100vh',
      width: '100vw',
      overflow: 'hidden',
    }),
  },
});