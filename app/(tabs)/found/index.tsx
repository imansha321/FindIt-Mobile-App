import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Card, Chip, Searchbar, Button, Menu } from "react-native-paper";
import { useRouter } from "expo-router";

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
};

// Mock fetch function (replace with Supabase API call)
const fetchFoundItems = async (): Promise<Item[]> => {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800));
  return [
    {
      id: "1",
      title: "Found Keys",
      description: "Set of car keys found near the library.",
      category: "Keys",
      location: "City Library",
      images: [],
      created_at: "2025-07-22T12:00:00Z",
      status: "active",
      is_priority: false,
    },
    {
      id: "2",
      title: "Found Backpack",
      description: "Blue backpack found at the bus stop.",
      category: "Bags",
      location: "Main Bus Stop",
      images: [],
      created_at: "2025-07-21T17:00:00Z",
      status: "active",
      is_priority: true,
    },
    {
      id: "3",
      title: "Found Phone",
      description: "iPhone found at the coffee shop.",
      category: "Electronics",
      location: "Starbucks Downtown",
      images: [],
      created_at: "2025-07-20T16:45:00Z",
      status: "active",
      is_priority: false,
    },
    {
      id: "4",
      title: "Found Wallet",
      description: "Brown leather wallet found at the park.",
      category: "Accessories",
      location: "Central Park",
      images: [],
      created_at: "2025-07-19T11:20:00Z",
      status: "active",
      is_priority: false,
    },
  ];
};

export default function FoundItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const router = useRouter();

  useEffect(() => {
    fetchFoundItems().then((data) => {
      // Example: Sort by is_priority first, then by created_at (newest first)
      const sorted = [...data].sort((a, b) => {
        if (a.is_priority === b.is_priority) {
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        }
        return a.is_priority ? -1 : 1;
      });
      setItems(sorted);
      setFilteredItems(sorted);
      setLoading(false);
    });
  }, []);

  // Filter items based on search query and category
  useEffect(() => {
    let filtered = items;
    
    // Filter by search query
    if (searchQuery) {
      filtered = filtered.filter(item =>
        item.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.category.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    
    // Filter by category
    if (selectedCategory !== "All") {
      filtered = filtered.filter(item => item.category === selectedCategory);
    }
    
    setFilteredItems(filtered);
  }, [items, searchQuery, selectedCategory]);

  const categories = ["All", "Accessories", "Electronics", "Bags", "Clothing", "Documents", "Jewelry", "Keys", "Toys", "Sports", "Books", "Cards", "Tools", "Pets", "Other"];

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#fff" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.header}>Found Items Feed</Text>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search found items..."
          onChangeText={setSearchQuery}
          value={searchQuery}
          style={styles.searchBar}
          iconColor="#FFD700"
          inputStyle={{ color: "#fff" }}
          theme={{ colors: { primary: "#FFD700" } }}
        />
        <Menu
          visible={filterMenuVisible}
          onDismiss={() => setFilterMenuVisible(false)}
          anchor={
            <Button
              mode="outlined"
              onPress={() => setFilterMenuVisible(true)}
              style={styles.filterButton}
              textColor="#FFD700"
              icon="filter-variant"
            >
              {selectedCategory}
            </Button>
          }
        >
          {categories.map((category) => (
            <Menu.Item
              key={category}
              onPress={() => {
                setSelectedCategory(category);
                setFilterMenuVisible(false);
              }}
              title={category}
              titleStyle={{ color: selectedCategory === category ? "#FFD700" : "#fff" }}
            />
          ))}
        </Menu>
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>
            {searchQuery || selectedCategory !== "All" 
              ? "No items found matching your search criteria."
              : "No found items available at the moment."
            }
          </Text>
        </View>
      ) : (
        <FlatList
          data={filteredItems}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <Card
              style={styles.card}
              elevation={item.is_priority ? 4 : 2}
              onPress={() => router.push(`/item/${item.id}`)}
            >
              {item.images && item.images.length > 0 && (
                <Card.Cover source={{ uri: item.images[0] }} style={styles.cardImage} />
              )}
              <Card.Title
                title={item.title}
                subtitle={item.category}
                titleStyle={styles.cardTitle}
                subtitleStyle={styles.cardSubtitle}
                // No priority chip in found tab
              />
              <Card.Content>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.location}>Location: {item.location}</Text>
              </Card.Content>
            </Card>
          )}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#111", padding: 16 },
  header: { fontSize: 22, fontWeight: "bold", color: "#fff", marginBottom: 16 },
  searchContainer: { 
    flexDirection: "row", 
    marginBottom: 16, 
    gap: 12,
    alignItems: "center"
  },
  searchBar: { 
    flex: 1, 
    backgroundColor: "#222",
    borderRadius: 8
  },
  filterButton: { 
    borderColor: "#FFD700",
    borderRadius: 8
  },
  card: { marginBottom: 16, borderRadius: 12, backgroundColor: "#222" },
  cardTitle: { color: "#fff", fontWeight: "bold" },
  cardSubtitle: { color: "#bbb" },
  cardImage: { height: 160, borderTopLeftRadius: 12, borderTopRightRadius: 12 },
  description: { color: "#fff", marginTop: 8 },
  location: { color: "#bbb", marginTop: 4 },
  priorityChip: { backgroundColor: "#FFD700", marginRight: 8 },
  priorityChipText: { color: "#111", fontWeight: "bold" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  emptyContainer: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    paddingHorizontal: 20
  },
  emptyText: { 
    color: "#bbb", 
    fontSize: 16, 
    textAlign: "center",
    lineHeight: 24
  },
});