import React, { useState } from "react";
import { View, StyleSheet, Text } from "react-native";
import { TextInput, Button } from "react-native-paper";
import { useRouter } from "expo-router";

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = () => {
    // Add your login logic here
    router.push("/home");
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Log In</Text>
      <TextInput
        label="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        style={styles.input}
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb" } }}
      />
      <TextInput
        label="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        style={styles.input}
        theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb" } }}
      />
      <Button
        mode="contained"
        onPress={handleLogin}
        style={styles.button}
        buttonColor="#fff"
        labelStyle={{ color: "#111" }}
        contentStyle={{ paddingVertical: 8 }}
      >
        Log In
      </Button>
      <Button
        onPress={() => router.push("/(auth)/register")}
        style={styles.link}
        labelStyle={{ color: "#fff" }}
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
    borderColor: "#fff",
  },
  link: {
    alignSelf: "center",
  },
});
