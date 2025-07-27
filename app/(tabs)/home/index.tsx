import React, { useEffect } from "react";
import { View, Text, StyleSheet, ScrollView } from "react-native";
import { Card, Button, Chip } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "../../context/AuthContext";

export default function HomeScreen() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace("/login");
    }
  }, [isLoading, isAuthenticated]);

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading...</Text>
      </View>
    );
  }

  if (!isAuthenticated) {
    return null; // Will redirect to login
  }

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back, {user?.name}!</Text>
        <Text style={styles.subtitle}>What would you like to do today?</Text>
      </View>

      <View style={styles.statsContainer}>
        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>12</Text>
            <Text style={styles.statLabel}>Active Items</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>3</Text>
            <Text style={styles.statLabel}>Found Items</Text>
          </Card.Content>
        </Card>

        <Card style={styles.statCard}>
          <Card.Content>
            <Text style={styles.statNumber}>$150</Text>
            <Text style={styles.statLabel}>Total Rewards</Text>
          </Card.Content>
        </Card>
      </View>

      <View style={styles.actionsContainer}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        
        <Button
          mode="contained"
          onPress={() => router.push("/add-item")}
          style={styles.actionButton}
          buttonColor="#FFD700"
          textColor="#111"
          icon="plus"
        >
          Add New Item
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push("/lost")}
          style={styles.actionButton}
          textColor="#FFD700"
          icon="magnify"
        >
          Browse Lost Items
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push("/found")}
          style={styles.actionButton}
          textColor="#FFD700"
          icon="hand"
        >
          Browse Found Items
        </Button>

        <Button
          mode="outlined"
          onPress={() => router.push("/bounty")}
          style={styles.actionButton}
          textColor="#FFD700"
          icon="cash"
        >
          Browse Bounty Items
        </Button>
      </View>

      <View style={styles.recentContainer}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        
        <Card style={styles.recentCard}>
          <Card.Content>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Lost Wallet</Text>
              <Chip mode="outlined" textStyle={{ color: "#FFD700" }}>
                Lost
              </Chip>
            </View>
            <Text style={styles.recentDescription}>
              Black leather wallet lost near Central Park
            </Text>
            <Text style={styles.recentTime}>2 hours ago</Text>
          </Card.Content>
        </Card>

        <Card style={styles.recentCard}>
          <Card.Content>
            <View style={styles.recentHeader}>
              <Text style={styles.recentTitle}>Found Keys</Text>
              <Chip mode="outlined" textStyle={{ color: "#4CAF50" }}>
                Found
              </Chip>
            </View>
            <Text style={styles.recentDescription}>
              Set of car keys found near the library
            </Text>
            <Text style={styles.recentTime}>1 day ago</Text>
          </Card.Content>
        </Card>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    color: "#fff",
    fontSize: 18,
  },
  header: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: "#bbb",
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 24,
  },
  statCard: {
    flex: 1,
    backgroundColor: "#222",
    marginHorizontal: 4,
    borderRadius: 8,
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
    textAlign: "center",
  },
  statLabel: {
    fontSize: 12,
    color: "#bbb",
    textAlign: "center",
    marginTop: 4,
  },
  actionsContainer: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  actionButton: {
    marginBottom: 12,
    borderRadius: 8,
  },
  recentContainer: {
    marginBottom: 24,
  },
  recentCard: {
    backgroundColor: "#222",
    marginBottom: 12,
    borderRadius: 8,
  },
  recentHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  recentTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
  },
  recentDescription: {
    color: "#bbb",
    marginBottom: 8,
  },
  recentTime: {
    color: "#666",
    fontSize: 12,
  },
}); 