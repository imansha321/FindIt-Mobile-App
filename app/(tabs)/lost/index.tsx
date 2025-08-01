import React, { useEffect, useState } from "react";
import axios from "axios";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Card, Chip, Searchbar, Button, Menu, Divider } from "react-native-paper";
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

// Fetch lost items from the backend API using axios
const fetchLostItems = async (): Promise<Item[]> => {
  try {
    const apiUrl = 'http://10.215.3.79:3001/api';
    const response = await axios.get(`${apiUrl}/items`);
    console.log('Fetched lost items:', response.data);
    // The backend returns { success, data: { items, pagination } }
    return response.data?.data?.items || [];
  } catch (error) {
    console.error('Error fetching lost items:', error);
    return [];
  }
};

export default function LostItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const router = useRouter();

  useEffect(() => {
    fetchLostItems().then((data) => {
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
      <Text style={styles.header}>Lost Items Feed</Text>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search lost items..."
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
              : "No lost items available at the moment."
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
                right={() =>
                  item.is_priority ? (
                    <Chip style={styles.priorityChip} textStyle={styles.priorityChipText}>
                      PRIORITY
                    </Chip>
                  ) : null
                }
              />
              <Card.Content>
                <Text style={styles.description}>{item.description}</Text>
                <Text style={styles.location}>Location: {item.location}</Text>
                {/* No reward chip in Lost tab */}
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