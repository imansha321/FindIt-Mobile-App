import React from "react";
import { View, StyleSheet, ScrollView, Alert } from "react-native";
import { Text, Card, Button, Appbar, Avatar, Divider } from "react-native-paper";
import { useRouter } from "expo-router";
import { useAuth } from "./context/AuthContext";

export default function ProfileScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();

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

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Profile" titleStyle={{ color: '#fff' }} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Profile Header */}
        <Card style={styles.profileCard}>
          <Card.Content style={styles.profileContent}>
            <Avatar.Text 
              size={80} 
              label={user?.name?.charAt(0)?.toUpperCase() || 'U'} 
              style={styles.avatar}
              color="#111"
            />
            <View style={styles.profileInfo}>
              <Text style={styles.name}>{user?.name || 'User'}</Text>
              <Text style={styles.email}>{user?.email}</Text>
              <Text style={styles.memberSince}>
                Member since {user?.created_at ? formatDate(user.created_at) : 'Recently'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* User Stats */}
        <Card style={styles.statsCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Your Activity</Text>
            <View style={styles.statsRow}>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>12</Text>
                <Text style={styles.statLabel}>Items Posted</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>8</Text>
                <Text style={styles.statLabel}>Items Found</Text>
              </View>
              <View style={styles.statItem}>
                <Text style={styles.statNumber}>4.5</Text>
                <Text style={styles.statLabel}>Trust Score</Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Account Information */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Account Information</Text>
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Name:</Text>
              <Text style={styles.infoValue}>{user?.name}</Text>
            </View>
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Email:</Text>
              <Text style={styles.infoValue}>{user?.email}</Text>
            </View>
            
            {user?.phone && (
              <>
                <Divider style={styles.divider} />
                <View style={styles.infoRow}>
                  <Text style={styles.infoLabel}>Phone:</Text>
                  <Text style={styles.infoValue}>{user.phone}</Text>
                </View>
              </>
            )}
            
            <Divider style={styles.divider} />
            
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Member Since:</Text>
              <Text style={styles.infoValue}>
                {user?.created_at ? formatDate(user.created_at) : 'Recently'}
              </Text>
            </View>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Navigate to edit profile
              Alert.alert("Coming Soon", "Edit profile feature will be available soon!");
            }}
            style={styles.actionButton}
            textColor="#FFD700"
            icon="account-edit"
          >
            Edit Profile
          </Button>
          
          <Button
            mode="outlined"
            onPress={() => {
              // TODO: Navigate to settings
              Alert.alert("Coming Soon", "Settings feature will be available soon!");
            }}
            style={styles.actionButton}
            textColor="#FFD700"
            icon="cog"
          >
            Settings
          </Button>
          
          <Button
            mode="contained"
            onPress={handleLogout}
            style={[styles.actionButton, styles.logoutButton]}
            buttonColor="#ff6b6b"
            textColor="#fff"
            icon="logout"
          >
            Logout
          </Button>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
  },
  header: {
    backgroundColor: "#111",
  },
  content: {
    flex: 1,
    padding: 16,
  },
  profileCard: {
    marginBottom: 16,
    backgroundColor: "#222",
    borderRadius: 12,
  },
  profileContent: {
    alignItems: "center",
    paddingVertical: 24,
  },
  avatar: {
    backgroundColor: "#FFD700",
    marginBottom: 16,
  },
  profileInfo: {
    alignItems: "center",
  },
  name: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 4,
  },
  email: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 8,
  },
  memberSince: {
    fontSize: 14,
    color: "#888",
  },
  statsCard: {
    marginBottom: 16,
    backgroundColor: "#222",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
  statsRow: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
  },
  statLabel: {
    fontSize: 14,
    color: "#bbb",
    marginTop: 4,
  },
  infoCard: {
    marginBottom: 16,
    backgroundColor: "#222",
    borderRadius: 12,
  },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
  },
  infoLabel: {
    fontSize: 16,
    color: "#bbb",
    fontWeight: "500",
  },
  infoValue: {
    fontSize: 16,
    color: "#fff",
    flex: 1,
    textAlign: "right",
  },
  divider: {
    backgroundColor: "#333",
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 24,
  },
  actionButton: {
    borderRadius: 8,
    borderColor: "#FFD700",
  },
  logoutButton: {
    borderColor: "#ff6b6b",
    marginTop: 8,
  },
}); 