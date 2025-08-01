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
const fetchBountyItems = async (): Promise<Item[]> => {
  // Simulate network delay
  await new Promise((r) => setTimeout(r, 800));
  return [
    {
      id: "1",
      title: "Bounty: Lost Laptop",
      description: "Dell Inspiron laptop lost in Engineering Faculty. LKR 10,000 bounty for return.",
      category: "Electronics",
      location: "Engineering Faculty",
      reward_amount: 10000,
      images: [],
      created_at: "2025-07-20T09:00:00Z",
      status: "active",
      is_priority: true,
    },
    {
      id: "2",
      title: "Bounty: Lost Phone",
      description: "Samsung Galaxy S22 lost in University Library. LKR 5,000 bounty for return.",
      category: "Electronics",
      location: "University Library",
      reward_amount: 5000,
      images: [],
      created_at: "2025-07-19T18:00:00Z",
      status: "active",
      is_priority: false,
    },
    {
      id: "3",
      title: "Bounty: Lost Student ID Card",
      description: "University student ID card lost near Cafeteria. LKR 1,000 bounty for return.",
      category: "Documents",
      location: "Cafeteria",
      reward_amount: 1000,
      images: [],
      created_at: "2025-07-18T15:30:00Z",
      status: "active",
      is_priority: true,
    },
    {
      id: "4",
      title: "Bounty: Lost Backpack",
      description: "Black Nike backpack with textbooks lost in Main Lecture Hall. LKR 2,500 bounty for return.",
      category: "Bags",
      location: "Main Lecture Hall",
      reward_amount: 2500,
      images: [],
      created_at: "2025-07-17T12:00:00Z",
      status: "active",
      is_priority: false,
    },
    {
      id: "5",
      title: "Bounty: Lost Calculator",
      description: "Casio fx-991ES calculator lost in Science Block. LKR 800 bounty for return.",
      category: "Electronics",
      location: "Science Block",
      reward_amount: 800,
      images: [],
      created_at: "2025-07-16T10:00:00Z",
      status: "active",
      is_priority: false,
    },
  ];
};

export default function BountyItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [filteredItems, setFilteredItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const router = useRouter();

  useEffect(() => {
    fetchBountyItems().then((data) => {
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
      <Text style={styles.header}>Bounty Items Feed</Text>
      
      {/* Search and Filter */}
      <View style={styles.searchContainer}>
        <Searchbar
          placeholder="Search bounty items..."
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
              : "No bounty items available at the moment."
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
                {item.reward_amount ? (
                  <Chip style={styles.rewardChip} textStyle={styles.rewardChipText}>
                    Bounty: LKR {item.reward_amount}
                  </Chip>
                ) : null}
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
  rewardChip: { backgroundColor: "#FFD700", marginTop: 8 },
  rewardChipText: { color: "#111", fontWeight: "bold" },
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