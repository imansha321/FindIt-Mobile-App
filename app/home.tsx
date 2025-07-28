import React, { useState } from "react";
import { View, StyleSheet, Text, ScrollView, Alert } from "react-native";
import { Appbar, Button, TextInput, Checkbox, Divider, Menu, Card, Chip } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";
import LostItemsScreen from "./(tabs)/lost/index";
import FoundItemsScreen from "./(tabs)/found/index";
import BountyItemsScreen from "./(tabs)/bounty/index";

export default function HomeScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [category, setCategory] = useState("All categories");
  const [location, setLocation] = useState("");
  const [hasReward, setHasReward] = useState(false);
  const [menuVisible, setMenuVisible] = useState(false);
  const [activeTab, setActiveTab] = useState("Lost");

  const handleLogout = () => {
    Alert.alert(
      "Logout",
      "Are you sure you want to logout?",
      [
        {
          text: "Cancel",
          style: "cancel",
        },
        {
          text: "Logout",
          style: "destructive",
          onPress: async () => {
            await logout();
            router.replace("/");
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={{ backgroundColor: "#111" }}>
        <Appbar.Action icon="magnify" color="#fff" />
        <Appbar.Content title="FindIt" titleStyle={{ color: "#fff" }} />
        <Menu
          visible={menuVisible}
          onDismiss={() => setMenuVisible(false)}
          anchor={
            <Appbar.Action 
              icon="account" 
              color="#fff" 
              onPress={() => setMenuVisible(true)} 
            />
          }
        >
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              router.push("/profile");
            }}
            title="Profile"
            leadingIcon="account"
          />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              // TODO: Navigate to settings page
            }}
            title="Settings"
            leadingIcon="cog"
          />
          <Divider />
          <Menu.Item
            onPress={() => {
              setMenuVisible(false);
              handleLogout();
            }}
            title="Logout"
            leadingIcon="logout"
            titleStyle={{ color: "#ff6b6b" }}
          />
        </Menu>
      </Appbar.Header>

      <Card style={styles.welcomeCard} elevation={2}>
        <Card.Content>
          <View style={styles.welcomeHeader}>
            <View>
              <Text style={styles.welcomeText}>
                Welcome back, {user?.name || 'User'}!
              </Text>
              <Text style={styles.matchNote}>You have 3 new matches for your lost items</Text>
            </View>
            <Button
              mode="outlined"
              onPress={handleLogout}
              style={styles.logoutButton}
              textColor="#ff6b6b"
              icon="logout"
              compact
            >
              Logout
            </Button>
          </View>
          <Chip icon="star" style={styles.trustChip} textStyle={{ color: "#111" }}>
            4.5 Trust Score <Text style={styles.verified}>Verified</Text>
          </Chip>
        </Card.Content>
      </Card>

      <View style={styles.tabContainer}>
        {[
          { label: "Lost", icon: "alert-circle-outline" },
          { label: "Found", icon: "check-circle-outline" },
          { label: "Bounty", icon: "trophy-outline" },
        ].map((tab) => (
          <Button
            key={tab.label}
            icon={tab.icon}
            mode={activeTab === tab.label ? "contained" : "text"}
            onPress={() => setActiveTab(tab.label)}
            style={styles.tabButton}
            buttonColor={activeTab === tab.label ? "#fff" : undefined}
            textColor={activeTab === tab.label ? "#111" : "#fff"}
            labelStyle={{ fontWeight: "bold" }}
          >
            {tab.label}
          </Button>
        ))}
        <Button
          mode="contained"
          icon="plus"
          onPress={() => router.push("/add-item")}
          style={styles.addButton}
          buttonColor="#fff"
          textColor="#111"
        >
          Add Item
        </Button>
      </View>

      <Divider style={{ marginVertical: 8, backgroundColor: "#333" }} />

      {activeTab === "Lost" && <LostItemsScreen />}
      {activeTab === "Found" && <FoundItemsScreen />}
      {activeTab === "Bounty" && <BountyItemsScreen />}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111" },
  welcomeCard: {
    margin: 16,
    borderRadius: 16,
    backgroundColor: "#fff",
  },
  welcomeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  welcomeText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#111",
  },
  logoutButton: {
    borderColor: "#ff6b6b",
    borderRadius: 8,
  },
  matchNote: {
    fontSize: 14,
    color: "#555",
    marginTop: 4,
  },
  trustChip: {
    marginTop: 8,
    backgroundColor: "#fff",
  },
  verified: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  tabContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 8,
    flexWrap: "wrap",
    gap: 8,
  },
  tabButton: {
    marginRight: 4,
    borderRadius: 8,
    borderColor: "#fff",
  },
  addButton: {
    marginLeft: "auto",
    borderRadius: 8,
    borderColor: "#fff",
  },
  filterContainer: {
    paddingHorizontal: 16,
  },
  filterLabel: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 12,
    color: "#fff",
  },
  dropdown: {
    marginBottom: 12,
    width: "100%",
    borderRadius: 8,
    borderColor: "#fff",
  },
  input: {
    marginBottom: 12,
    borderRadius: 8,
    color: "#fff",
    backgroundColor: "#222",
  },
  checkboxRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
  },
  emptyMessage: {
    textAlign: "center",
    color: "#bbb",
    fontSize: 14,
    marginTop: 24,
  },
});
