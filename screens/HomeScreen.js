import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { BarCodeScanner } from 'expo-barcode-scanner';
import { Button } from 'react-native';

const HomeScreen = ({ navigation }) => {
  const [hasPermission, setHasPermission] = useState(null);

  useEffect(() => {
    const requestCameraPermission = async () => {
      const { status } = await BarCodeScanner.requestPermissionsAsync();
      setHasPermission(status === 'granted');
    };
  
    requestCameraPermission();
  }, []);
  
  const handleBarCodeScanned = ({ data }) => {
    navigation.navigate('ProductDetails', { barcode: data });
  };

  if (hasPermission === null) {
    return <View style={styles.container}><ActivityIndicator size="large" /></View>;
  }

  if (hasPermission === false) {
    return <View style={styles.container}><Text>No access to camera</Text></View>;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Is it Vegan?</Text>
      <BarCodeScanner
        onBarCodeScanned={handleBarCodeScanned}
        style={StyleSheet.absoluteFillObject}
      />
      <View style={styles.buttonContainer}>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonContainer: {
    position: 'absolute', 
    bottom: 20, 
    left: 0, 
    right: 0,
    paddingHorizontal: 16,
  },
});

export default HomeScreen;
