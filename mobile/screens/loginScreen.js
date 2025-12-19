import React, { useState } from 'react';
import { 
  View, Text, TextInput, TouchableOpacity, Alert, StyleSheet, 
  ActivityIndicator, Image, KeyboardAvoidingView, Platform 
} from 'react-native';
import { login } from '../services/authService';

export default function LoginScreen({ navigation }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      Alert.alert("Error", "Please enter both username and password.");
      return;
    }

    setLoading(true);
    const result = await login(username, password);
    setLoading(false);

    if (result.success) {
      navigation.replace('Home', { user: result.user });
    } else {
      Alert.alert("Login Failed", result.message || "Invalid username or password.");
      setPassword(''); 
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      style={styles.container}
    >
      <View style={styles.card}>
        
        {/* LOGO SECTION */}
        <View style={styles.logoContainer}>
          <Image 
            source={{ uri: 'https://ub.edu.ph/wp-content/uploads/2023/02/white-out-UB-Master-Logo.png' }} 
            style={styles.logo} 
          />
        </View>

        <Text style={styles.title}>Clinic Staff Login</Text>
        
        <Text style={styles.label}>Username</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter username"
          value={username}
          onChangeText={setUsername}
          autoCapitalize="none"
        />

        <Text style={styles.label}>Password</Text>
        <TextInput 
          style={styles.input} 
          placeholder="Enter password"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />

        <TouchableOpacity style={styles.button} onPress={handleLogin} disabled={loading}>
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Login ➜</Text>
          )}
        </TouchableOpacity>

      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', backgroundColor: '#f0f4f7', padding: 20 },
  card: { backgroundColor: '#fff', padding: 30, borderRadius: 20, elevation: 5 },
  
  // LOGO STYLES
  logoContainer: { 
    alignItems: 'center', 
    marginBottom: 20,
    backgroundColor: '#800000', // Added UB Red/Maroon background so the white logo shows up
    padding: 10,
    borderRadius: 10
  },
  logo: { width: 150, height: 60, resizeMode: 'contain' }, // Adjusted size for wide logo
  title: { fontSize: 26, fontWeight: 'bold', color: '#2c3e50', marginBottom: 25, textAlign: 'center' },
  label: { color: '#7f8c8d', marginBottom: 5, fontWeight: '600', marginLeft: 5 },
  input: { backgroundColor: '#f9f9f9', borderWidth: 1, borderColor: '#e0e0e0', padding: 15, borderRadius: 12, marginBottom: 20, fontSize: 16 },
  button: { backgroundColor: '#800000', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 }, // Changed button to UB color
  buttonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' }
});