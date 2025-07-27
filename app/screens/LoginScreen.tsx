import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { Text, TextInput, Button, Card, HelperText } from 'react-native-paper';
import { useAuth } from '../context/AuthContext';
import { useRouter } from 'expo-router';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const { login, register } = useAuth();
  const router = useRouter();

  const handleSubmit = async () => {
    if (!email || !password) {
      setError('Please fill in all required fields');
      return;
    }

    if (isRegister) {
      if (!name) {
        setError('Please enter your name');
        return;
      }
      if (password !== confirmPassword) {
        setError('Passwords do not match');
        return;
      }
      if (password.length < 6) {
        setError('Password must be at least 6 characters');
        return;
      }
    }

    try {
      setIsLoading(true);
      setError('');

      if (isRegister) {
        await register({
          name,
          email,
          password,
          phone: phone || undefined,
        });
      } else {
        await login(email, password);
      }

      router.replace('/home');
    } catch (error: any) {
      setError(error.message || 'Authentication failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.content}>
          <Text style={styles.title}>FindIt</Text>
          <Text style={styles.subtitle}>
            {isRegister ? 'Create your account' : 'Welcome back'}
          </Text>

          <Card style={styles.card}>
            <Card.Content>
              {isRegister && (
                <TextInput
                  label="Full Name *"
                  value={name}
                  onChangeText={setName}
                  style={styles.input}
                  mode="outlined"
                  theme={{ colors: { text: '#fff', background: '#222', placeholder: '#bbb', primary: '#FFD700' } }}
                  placeholderTextColor="#bbb"
                  selectionColor="#FFD700"
                  underlineColor="#FFD700"
                  textColor="#fff"
                />
              )}

              <TextInput
                label="Email *"
                value={email}
                onChangeText={setEmail}
                style={styles.input}
                mode="outlined"
                keyboardType="email-address"
                autoCapitalize="none"
                theme={{ colors: { text: '#fff', background: '#222', placeholder: '#bbb', primary: '#FFD700' } }}
                placeholderTextColor="#bbb"
                selectionColor="#FFD700"
                underlineColor="#FFD700"
                textColor="#fff"
              />

              {isRegister && (
                <TextInput
                  label="Phone (optional)"
                  value={phone}
                  onChangeText={setPhone}
                  style={styles.input}
                  mode="outlined"
                  keyboardType="phone-pad"
                  theme={{ colors: { text: '#fff', background: '#222', placeholder: '#bbb', primary: '#FFD700' } }}
                  placeholderTextColor="#bbb"
                  selectionColor="#FFD700"
                  underlineColor="#FFD700"
                  textColor="#fff"
                />
              )}

              <TextInput
                label="Password *"
                value={password}
                onChangeText={setPassword}
                style={styles.input}
                mode="outlined"
                secureTextEntry
                theme={{ colors: { text: '#fff', background: '#222', placeholder: '#bbb', primary: '#FFD700' } }}
                placeholderTextColor="#bbb"
                selectionColor="#FFD700"
                underlineColor="#FFD700"
                textColor="#fff"
              />

              {isRegister && (
                <TextInput
                  label="Confirm Password *"
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  style={styles.input}
                  mode="outlined"
                  secureTextEntry
                  theme={{ colors: { text: '#fff', background: '#222', placeholder: '#bbb', primary: '#FFD700' } }}
                  placeholderTextColor="#bbb"
                  selectionColor="#FFD700"
                  underlineColor="#FFD700"
                  textColor="#fff"
                />
              )}

              {error ? (
                <HelperText type="error" visible>
                  {error}
                </HelperText>
              ) : null}

              <Button
                mode="contained"
                onPress={handleSubmit}
                loading={isLoading}
                disabled={isLoading}
                style={styles.button}
                buttonColor="#FFD700"
                textColor="#111"
              >
                {isRegister ? 'Create Account' : 'Sign In'}
              </Button>

              <Button
                mode="text"
                onPress={() => setIsRegister(!isRegister)}
                style={styles.switchButton}
                textColor="#FFD700"
              >
                {isRegister ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
              </Button>
            </Card.Content>
          </Card>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 32,
  },
  card: {
    backgroundColor: '#222',
    borderRadius: 12,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#333',
  },
  button: {
    marginTop: 8,
    borderRadius: 8,
  },
  switchButton: {
    marginTop: 16,
  },
}); 