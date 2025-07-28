import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, Image, ActivityIndicator, Alert } from "react-native";
import { Card, Button, Chip, Appbar, Divider } from "react-native-paper";
import { useRouter, useLocalSearchParams } from "expo-router";

// Example item type
type Item = {
  id: string;
  title: string;
  description: string;
  category: string;
  location?: string;
  reward_amount?: number;
  images?: string[];
  created_at: string;
  status: string;
  is_priority?: boolean;
  item_type: "Lost" | "Found" | "Bounty";
  contact_info?: {
    name: string;
    phone?: string;
    email?: string;
  };
};

// Mock fetch function (replace with Supabase API call)
const fetchItemDetails = async (id: string): Promise<Item | null> => {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 1000));
  
  // Mock data based on item type
  const mockItems: Record<string, Item> = {
    "1": {
      id: "1",
      title: "Lost Wallet",
      description: "Black leather wallet with brown stitching. Contains driver's license, credit cards, and some cash. Lost near Central Park entrance on 5th Avenue.",
      category: "Accessories",
      location: "Central Park, 5th Avenue Entrance",
      reward_amount: 20,
      images: [],
      created_at: "2025-07-22T10:00:00Z",
      status: "active",
      is_priority: true,
      item_type: "Lost",
      contact_info: {
        name: "John Doe",
        phone: "+1-555-0123",
        email: "john.doe@email.com"
      }
    },
    "2": {
      id: "2",
      title: "Found Keys",
      description: "Set of car keys with a red keychain. Found near the library entrance. Keys appear to be for a Toyota vehicle.",
      category: "Accessories",
      location: "City Library, Main Entrance",
      reward_amount: 0,
      images: [],
      created_at: "2025-07-22T12:00:00Z",
      status: "active",
      is_priority: false,
      item_type: "Found",
      contact_info: {
        name: "Jane Smith",
        phone: "+1-555-0456",
        email: "jane.smith@email.com"
      }
    },
    "3": {
      id: "3",
      title: "Bounty: Lost Dog",
      description: "Brown Labrador named Max, wearing a blue collar. Very friendly and responds to his name. Last seen near Green Park area.",
      category: "Pets",
      location: "Green Park Area",
      reward_amount: 100,
      images: [],
      created_at: "2025-07-20T09:00:00Z",
      status: "active",
      is_priority: true,
      item_type: "Bounty",
      contact_info: {
        name: "Mike Johnson",
        phone: "+1-555-0789",
        email: "mike.johnson@email.com"
      }
    }
  };

  return mockItems[id] || null;
};

export default function ItemDetailScreen() {
  const [item, setItem] = useState<Item | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  useEffect(() => {
    if (id) {
      fetchItemDetails(id).then((data) => {
        setItem(data);
        setLoading(false);
      });
    }
  }, [id]);

  const handleContact = () => {
    if (item?.contact_info) {
      Alert.alert(
        "Contact Information",
        `Name: ${item.contact_info.name}\nPhone: ${item.contact_info.phone}\nEmail: ${item.contact_info.email}`,
        [
          { text: "Copy Phone", onPress: () => console.log("Copy phone number") },
          { text: "Copy Email", onPress: () => console.log("Copy email") },
          { text: "Cancel", style: "cancel" }
        ]
      );
    }
  };

  const handleReportFound = () => {
    Alert.alert(
      "Report Item Found",
      "Are you sure you found this item? This will notify the owner.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Report Found", onPress: () => console.log("Report found") }
      ]
    );
  };

  const handleClaimItem = () => {
    Alert.alert(
      "Claim Item",
      "Are you sure this is your item? You'll need to provide proof of ownership.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Claim Item", onPress: () => console.log("Claim item") }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  if (!item) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Item not found</Text>
        <Button mode="contained" onPress={() => router.back()} style={styles.backButton}>
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

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title={item.item_type} titleStyle={{ color: '#fff' }} />
        <Appbar.Action icon="share" onPress={() => console.log("Share")} color="#fff" />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        {/* Item Type Badge */}
        <View style={styles.badgeContainer}>
          <Chip 
            style={[
              styles.typeChip, 
              item.item_type === "Bounty" ? styles.bountyChip : 
              item.item_type === "Lost" ? styles.lostChip : styles.foundChip
            ]} 
            textStyle={styles.typeChipText}
          >
            {item.item_type}
          </Chip>
          {item.is_priority && (
            <Chip style={styles.priorityChip} textStyle={styles.priorityChipText}>
              PRIORITY
            </Chip>
          )}
        </View>

        {/* Title and Category */}
        <Text style={styles.title}>{item.title}</Text>
        <Text style={styles.category}>{item.category}</Text>

        {/* Images */}
        {item.images && item.images.length > 0 ? (
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.imageContainer}>
            {item.images.map((image, index) => (
              <Image key={index} source={{ uri: image }} style={styles.image} />
            ))}
          </ScrollView>
        ) : (
          <View style={styles.noImageContainer}>
            <Text style={styles.noImageText}>No images available</Text>
          </View>
        )}

        {/* Description */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Description</Text>
            <Text style={styles.description}>{item.description}</Text>
          </Card.Content>
        </Card>

        {/* Location */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Location</Text>
            <Text style={styles.location}>{item.location}</Text>
          </Card.Content>
        </Card>

        {/* Reward/Bounty */}
        {item.reward_amount && item.reward_amount > 0 && (
          <Card style={styles.section}>
            <Card.Content>
              <Text style={styles.sectionTitle}>
                {item.item_type === "Bounty" ? "Bounty Amount" : "Reward"}
              </Text>
              <Text style={styles.rewardAmount}>${item.reward_amount}</Text>
            </Card.Content>
          </Card>
        )}

        {/* Date Posted */}
        <Card style={styles.section}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Posted</Text>
            <Text style={styles.date}>{formatDate(item.created_at)}</Text>
          </Card.Content>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionContainer}>
          {item.item_type === "Lost" && (
            <Button
              mode="contained"
              onPress={handleReportFound}
              style={styles.actionButton}
              buttonColor="#4CAF50"
              textColor="#fff"
            >
              I Found This Item
            </Button>
          )}

          {item.item_type === "Found" && (
            <Button
              mode="contained"
              onPress={handleClaimItem}
              style={styles.actionButton}
              buttonColor="#2196F3"
              textColor="#fff"
            >
              This Is My Item
            </Button>
          )}

          {item.item_type === "Bounty" && (
            <Button
              mode="contained"
              onPress={handleReportFound}
              style={styles.actionButton}
              buttonColor="#FFD700"
              textColor="#111"
            >
              I Found This Item
            </Button>
          )}

          <Button
            mode="outlined"
            onPress={handleContact}
            style={styles.actionButton}
            textColor="#FFD700"
          >
            Contact Owner
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
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  errorText: {
    color: "#fff",
    fontSize: 18,
    marginBottom: 20,
  },
  backButton: {
    marginTop: 10,
    backgroundColor: "#FFD700",
  },
  badgeContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 8,
  },
  typeChip: {
    marginRight: 8,
  },
  bountyChip: {
    backgroundColor: "#FFD700",
  },
  lostChip: {
    backgroundColor: "#FF5722",
  },
  foundChip: {
    backgroundColor: "#4CAF50",
  },
  typeChipText: {
    color: "#111",
    fontWeight: "bold",
  },
  priorityChip: {
    backgroundColor: "#FFD700",
  },
  priorityChipText: {
    color: "#111",
    fontWeight: "bold",
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
    marginRight: 12,
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
    marginBottom: 16,
    backgroundColor: "#222",
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  description: {
    fontSize: 16,
    color: "#fff",
    lineHeight: 24,
  },
  location: {
    fontSize: 16,
    color: "#fff",
  },
  rewardAmount: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#FFD700",
  },
  date: {
    fontSize: 16,
    color: "#bbb",
  },
  actionContainer: {
    marginTop: 16,
    gap: 12,
  },
  actionButton: {
    borderRadius: 8,
  },
}); 