import React, { useState } from "react";
import { View, StyleSheet, Text, Alert } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function LoginScreen() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ email?: string; password?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { email?: string; password?: string } = {};
    
    if (!email) {
      newErrors.email = "Email is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Please enter a valid email";
    }
    
    if (!password) {
      newErrors.password = "Password is required";
    } else if (password.length < 6) {
      newErrors.password = "Password must be at least 6 characters";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[LOGIN-UI-${requestId}] 🔐 Login form submission started`);
    console.log(`[LOGIN-UI-${requestId}] 📧 Email: ${email}`);
    console.log(`[LOGIN-UI-${requestId}] 📱 Platform: React Native`);
    
    if (!validateForm()) {
      console.log(`[LOGIN-UI-${requestId}] ❌ Form validation failed`);
      return;
    }

    console.log(`[LOGIN-UI-${requestId}] ✅ Form validation passed`);
    setLoading(true);
    setErrors({});

    try {
      console.log(`[LOGIN-UI-${requestId}] 🌐 Calling auth context login...`);
      const success = await login(email, password);
      
      if (success) {
        const responseTime = Date.now() - startTime;
        console.log(`[LOGIN-UI-${requestId}] 🎉 Login successful, navigating to home`);
        console.log(`[LOGIN-UI-${requestId}] ⏱️ Total login time: ${responseTime}ms`);
        // Navigate to home
        router.replace("/home");
      } else {
        console.log(`[LOGIN-UI-${requestId}] ❌ Login failed, showing error`);
        setErrors({ general: "Invalid credentials. Please try again." });
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error(`[LOGIN-UI-${requestId}] 💥 Login error after ${responseTime}ms:`, error);
      console.error(`[LOGIN-UI-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setErrors({ 
        general: error.message || "Network error. Please try again." 
      });
    } finally {
      console.log(`[LOGIN-UI-${requestId}] 🔄 Setting loading to false`);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      
      {errors.general && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.general}
        </HelperText>
      )}
      
      <TextInput
        label="Email"
        value={email}
        onChangeText={(text) => {
          setEmail(text);
          if (errors.email) setErrors({ ...errors, email: undefined });
        }}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        error={!!errors.email}
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", error: "#ff6b6b" } }}
      />
      {errors.email && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.email}
        </HelperText>
      )}
      
      <TextInput
        label="Password"
        value={password}
        onChangeText={(text) => {
          setPassword(text);
          if (errors.password) setErrors({ ...errors, password: undefined });
        }}
        secureTextEntry
        style={styles.input}
        error={!!errors.password}
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", error: "#ff6b6b" } }}
      />
      {errors.password && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.password}
        </HelperText>
      )}
      
      <Button
        mode="contained"
        onPress={handleLogin}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor="#FFD700"
        textColor="#111"
        contentStyle={{ paddingVertical: 8 }}
      >
        {loading ? "Logging In..." : "Log In"}
      </Button>
      
      <Button
        onPress={() => router.push("/(auth)/register")}
        style={styles.link}
        textColor="#FFD700"
        disabled={loading}
      >
        Don't have an account? Sign Up
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 24,
    justifyContent: "center",
    backgroundColor: "#111",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 24,
    textAlign: "center",
    color: "#fff",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#222",
    color: "#fff",
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
  },
  link: {
    alignSelf: "center",
  },
  errorText: {
    color: "#ff6b6b",
    marginBottom: 8,
  },
});
