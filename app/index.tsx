import React from "react";
import { View, Text, StyleSheet, Image } from "react-native";
import { Button } from "react-native-paper";
import { useRouter } from "expo-router";

export default function WelcomeScreen() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Image
        source={require("../assets/logo.png")}
        style={styles.logo}
        resizeMode="contain"
      />
      <Text style={styles.title}>FindIt</Text>
      <Text style={styles.subtitle}>
        Recover lost items quickly and securely with AI-powered matching.
      </Text>
      <View style={styles.buttonRow}>
        <Button
          mode="contained"
          style={styles.button}
          labelStyle={{ color: "#111" }}
          buttonColor="#fff"
          onPress={() => router.push("/(auth)/register")}
        >
          Sign Up
        </Button>
        <Button
          mode="outlined"
          style={styles.button}
          labelStyle={{ color: "#fff" }}
          textColor="#fff"
          onPress={() => router.push("/(auth)/login")}
        >
          Log In
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  logo: {
    width: 120,
    height: 120,
    marginBottom: 24,
    borderRadius: 24,
    backgroundColor: "#fff",
  },
  title: {
    fontSize: 36,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    letterSpacing: 1,
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
    textAlign: "center",
    marginBottom: 32,
    opacity: 0.8,
  },
  buttonRow: {
    flexDirection: "row",
    gap: 16,
  },
  button: {
    minWidth: 120,
    marginHorizontal: 8,
    borderRadius: 8,
    borderColor: "#fff",
  },
});