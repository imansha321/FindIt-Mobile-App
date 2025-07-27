import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { Card, Button, Chip, Appbar, Divider } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";
import { apiService, Item } from "../services/api";
import { useAuth } from "../context/AuthContext";

export default function ItemDetailScreen() {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();

  useEffect(() => {
    if (id) {
      fetchItemDetails();
    }
  }, [id]);

  const fetchItemDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      const itemData = await apiService.getItem(id);
      setItem(itemData);
    } catch (error: any) {
      console.error('Error fetching item details:', error);
      setError('Failed to load item details. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleContact = () => {
    if (item?.contact_info) {
      Alert.alert(
        "Contact Information",
        `Name: ${item.contact_info.name}\nPhone: ${item.contact_info.phone}\nEmail: ${item.contact_info.email}`,
        [{ text: "OK" }]
      );
    }
  };

  const handleReportFound = async () => {
    try {
      await apiService.reportItem(id, { action: 'found' });
      Alert.alert(
        "Success",
        "Item reported as found! The owner will be notified.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to report item as found.");
    }
  };

  const handleClaimItem = async () => {
    try {
      await apiService.reportItem(id, { action: 'claimed' });
      Alert.alert(
        "Success",
        "Item claimed! The owner will be notified.",
        [{ text: "OK", onPress: () => router.back() }]
      );
    } catch (error: any) {
      Alert.alert("Error", error.message || "Failed to claim item.");
    }
  };

  const handleSendNotification = async () => {
    Alert.prompt(
      "Send Message",
      "Enter a message for the item owner:",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Send",
          onPress: async (message) => {
            if (message) {
              try {
                await apiService.sendItemFoundNotification(id, message);
                Alert.alert("Success", "Message sent to the item owner!");
              } catch (error: any) {
                Alert.alert("Error", error.message || "Failed to send message.");
              }
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#FFD700" />
        <Text style={styles.loadingText}>Loading item details...</Text>
      </View>
    );
  }

  if (error || !item) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>
          {error || "Item not found"}
        </Text>
        <Button
          mode="contained"
          onPress={() => router.back()}
          style={styles.backButton}
          buttonColor="#FFD700"
          textColor="#111"
        >
          Go Back
        </Button>
      </View>
    );
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const isOwner = user?.id === item.user_id;

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Item Details" titleStyle={{ color: '#fff' }} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <View style={styles.badgeContainer}>
          <Chip
            mode="outlined"
            textStyle={{ color: "#FFD700" }}
            style={styles.typeChip}
          >
            {item.item_type.toUpperCase()}
          </Chip>
          {item.is_priority && (
            <Chip
              mode="outlined"
              textStyle={{ color: "#FFD700" }}
              style={styles.priorityChip}
            >
              PRIORITY
            </Chip>
          )}
        </View>

        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.category}>{item.category}</Text>

        {item.images && item.images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
            {item.images.map((image, index) => (
              <Image
                key={index}
                source={{ uri: image }}
                style={styles.image}
                resizeMode="cover"
              />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}

        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Card.Content>
        </Card>

        {item.location && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>Location</Text>
              <Text style={styles.location}>📍 {item.location}</Text>
            </Card.Content>
          </Card>
        )}

        {item.reward_amount && item.reward_amount > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                {item.item_type === 'bounty' ? 'Bounty Amount' : 'Reward'}
              </Text>
              <Text style={styles.rewardAmount}>${item.reward_amount}</Text>
            </Card.Content>
          </Card>
        )}

        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Date Posted</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </Card.Content>
        </Card>

        <View style={styles.actionContainer}>
          {!isOwner ? (
            <>
              {item.item_type === 'lost' && (
                <Button
                  mode="contained"
                  onPress={handleReportFound}
                  style={styles.actionButton}
                  buttonColor="#4CAF50"
                  textColor="#fff"
                  icon="check"
                >
                  I Found This Item
                </Button>
              )}

              {item.item_type === 'found' && (
                <Button
                  mode="contained"
                  onPress={handleClaimItem}
                  style={styles.actionButton}
                  buttonColor="#2196F3"
                  textColor="#fff"
                  icon="hand"
                >
                  This Is My Item
                </Button>
              )}

              <Button
                mode="outlined"
                onPress={handleContact}
                style={styles.actionButton}
                textColor="#FFD700"
                icon="phone"
              >
                Contact Owner
              </Button>

              <Button
                mode="outlined"
                onPress={handleSendNotification}
                style={styles.actionButton}
                textColor="#FFD700"
                icon="message"
              >
                Send Message
              </Button>
            </>
          ) : (
            <Button
              mode="contained"
              onPress={() => router.push(`/edit-item/${item.id}`)}
              style={styles.actionButton}
              buttonColor="#FFD700"
              textColor="#111"
              icon="pencil"
            >
              Edit Item
            </Button>
          )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
  loadingText: {
    color: "#fff",
    marginTop: 16,
    fontSize: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
    padding: 20,
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 16,
    textAlign: "center",
    marginBottom: 20,
  },
  backButton: {
    borderRadius: 8,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  badgeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    borderColor: "#FFD700",
  },
  priorityChip: {
    borderColor: "#FFD700",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  category: {
    fontSize: 16,
    color: "#bbb",
    marginBottom: 16,
  },
  imageContainer: {
    marginBottom: 16,
  },
  image: {
    width: 200,
    height: 150,
    borderRadius: 8,
    marginRight: 8,
  },
  noImageContainer: {
    height: 150,
    backgroundColor: "#222",
    borderRadius: 8,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 16,
  },
  noImageText: {
    color: "#666",
    fontSize: 16,
  },
  section: {
    backgroundColor: "#222",
    marginBottom: 16,
    borderRadius: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginBottom: 8,
  },
  description: {
    color: "#fff",
    fontSize: 16,
    lineHeight: 24,
  },
  location: {
    color: "#fff",
    fontSize: 16,
  },
  rewardAmount: {
    color: "#FFD700",
    fontSize: 24,
    fontWeight: "bold",
  },
  date: {
    color: "#bbb",
    fontSize: 16,
  },
  actionContainer: {
    gap: 12,
    marginTop: 16,
  },
  actionButton: {
    borderRadius: 8,
  },
}); 