import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { TextInput, Button, HelperText } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../context/AuthContext";

export default function RegisterScreen() {
  const router = useRouter();
  const { register } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ name?: string; email?: string; password?: string; phone?: string; general?: string }>({});

  const validateForm = () => {
    const newErrors: { name?: string; email?: string; password?: string; phone?: string } = {};
    
    if (!name.trim()) {
      newErrors.name = "Name is required";
    } else if (name.trim().length < 2) {
      newErrors.name = "Name must be at least 2 characters";
    }
    
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
    
    if (phone && !/^\+?[\d\s\-\(\)]+$/.test(phone)) {
      newErrors.phone = "Please enter a valid phone number";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    const startTime = Date.now();
    const requestId = Math.random().toString(36).substring(7);
    
    console.log(`[REGISTER-UI-${requestId}] 📝 Registration form submission started`);
    console.log(`[REGISTER-UI-${requestId}] 👤 Name: ${name}`);
    console.log(`[REGISTER-UI-${requestId}] 📧 Email: ${email}`);
    console.log(`[REGISTER-UI-${requestId}] 📱 Phone: ${phone || 'Not provided'}`);
    console.log(`[REGISTER-UI-${requestId}] 📱 Platform: React Native`);
    
    if (!validateForm()) {
      console.log(`[REGISTER-UI-${requestId}] ❌ Form validation failed`);
      return;
    }

    console.log(`[REGISTER-UI-${requestId}] ✅ Form validation passed`);
    setLoading(true);
    setErrors({});

    try {
      const userData = {
        name: name.trim(),
        email,
        password,
        ...(phone && { phone: phone.trim() })
      };

      console.log(`[REGISTER-UI-${requestId}] 🌐 Calling auth context register...`);
      const success = await register(userData);
      
      if (success) {
        const responseTime = Date.now() - startTime;
        console.log(`[REGISTER-UI-${requestId}] 🎉 Registration successful, navigating to home`);
        console.log(`[REGISTER-UI-${requestId}] ⏱️ Total registration time: ${responseTime}ms`);
        // Navigate to home
        router.replace("/home");
      } else {
        console.log(`[REGISTER-UI-${requestId}] ❌ Registration failed, showing error`);
        setErrors({ general: "Registration failed. Please try again." });
      }
    } catch (error: any) {
      const responseTime = Date.now() - startTime;
      console.error(`[REGISTER-UI-${requestId}] 💥 Registration error after ${responseTime}ms:`, error);
      console.error(`[REGISTER-UI-${requestId}] 📍 Error details:`, {
        message: error.message,
        name: error.name,
        stack: error.stack
      });
      setErrors({ 
        general: error.message || "Network error. Please try again." 
      });
    } finally {
      console.log(`[REGISTER-UI-${requestId}] 🔄 Setting loading to false`);
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      {errors.general && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.general}
        </HelperText>
      )}

      <TextInput
        label="Full Name"
        value={name}
        onChangeText={(text) => {
          setName(text);
          if (errors.name) setErrors({ ...errors, name: undefined });
        }}
        style={styles.input}
        error={!!errors.name}
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", error: "#ff6b6b", primary: "#FFD700" } }}
        underlineColor="#FFD700"
        selectionColor="#FFD700"
        placeholderTextColor="#bbb"
        style={[styles.input, { color: '#fff' }]}
      />
      {errors.name && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.name}
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
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", error: "#ff6b6b", primary: "#FFD700" } }}
        underlineColor="#FFD700"
        selectionColor="#FFD700"
        placeholderTextColor="#bbb"
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
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", error: "#ff6b6b", primary: "#FFD700" } }}
        underlineColor="#FFD700"
        selectionColor="#FFD700"
        placeholderTextColor="#bbb"
      />
      {errors.password && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.password}
        </HelperText>
      )}

      <TextInput
        label="Phone Number (Optional)"
        value={phone}
        onChangeText={(text) => {
          setPhone(text);
          if (errors.phone) setErrors({ ...errors, phone: undefined });
        }}
        keyboardType="phone-pad"
        style={styles.input}
        error={!!errors.phone}
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", error: "#ff6b6b", primary: "#FFD700" } }}
        underlineColor="#FFD700"
        selectionColor="#FFD700"
        placeholderTextColor="#bbb"
      />
      {errors.phone && (
        <HelperText type="error" visible style={styles.errorText}>
          {errors.phone}
        </HelperText>
      )}

      <Button
        mode="contained"
        onPress={handleRegister}
        loading={loading}
        disabled={loading}
        style={styles.button}
        buttonColor="#FFD700"
        textColor="#111"
        contentStyle={{ paddingVertical: 8 }}
      >
        {loading ? "Creating Account..." : "Register"}
      </Button>

      <Button
        onPress={() => router.push("/(auth)/login")}
        style={styles.link}
        textColor="#FFD700"
        disabled={loading}
      >
        Already have an account? Log In
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
    letterSpacing: 1,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#222",
    borderRadius: 8,
    color: "#fff",
  },
  button: {
    marginTop: 8,
    marginBottom: 16,
    borderRadius: 8,
    elevation: 2,
  },
  link: {
    alignSelf: "center",
    marginTop: 8,
  },
  errorText: {
    color: "#ff6b6b",
    marginBottom: 8,
    fontSize: 14,
  },
});
