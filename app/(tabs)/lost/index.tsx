import React, { useEffect, useState } from "react";
import { View, Text, FlatList, StyleSheet, ActivityIndicator } from "react-native";
import { Card, Chip, Searchbar, Button, Menu } from "react-native-paper";
import { useRouter } from "expo-router";
import { apiService, Item } from "../../services/api";

export default function LostItemsScreen() {
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterMenuVisible, setFilterMenuVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const fetchLostItems = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const params: any = { type: 'lost' };
      if (selectedCategory !== "All") {
        params.category = selectedCategory;
      }
      if (searchQuery) {
        params.search = searchQuery;
      }

      const response = await apiService.getItems(params);
      setItems(response.items);
    } catch (error: any) {
      console.error('Error fetching lost items:', error);
      setError('Failed to load items. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLostItems();
  }, [searchQuery, selectedCategory]);

  const categories = ["All", "Accessories", "Electronics", "Bags", "Clothing", "Documents", "Jewelry", "Keys", "Toys", "Sports", "Books", "Cards", "Tools", "Pets", "Other"];

  const renderItem = ({ item }: { item: Item }) => (
    <Card style={styles.card} onPress={() => router.push(`/item/${item.id}`)}>
      <Card.Content>
        <View style={styles.cardHeader}>
          <Text style={styles.itemTitle}>{item.title}</Text>
          {item.is_priority && (
            <Chip
              mode="outlined"
              textStyle={{ color: "#FFD700" }}
              style={styles.priorityChip}
            >
              Priority
            </Chip>
          )}
        </View>
        <Text style={styles.itemDescription} numberOfLines={2}>
          {item.description}
        </Text>
        <View style={styles.cardFooter}>
          <Chip mode="outlined" textStyle={{ color: "#bbb" }}>
            {item.category}
          </Chip>
          {item.location && (
            <Text style={styles.location}>📍 {item.location}</Text>
          )}
        </View>
      </Card.Content>
    </Card>
  );

  if (loading && items.length === 0) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#FFD700" />
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

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      {items.length === 0 ? (
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
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#111",
    padding: 16,
  },
  header: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
  },
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
  listContainer: {
    paddingBottom: 20,
  },
  card: {
    backgroundColor: "#222",
    marginBottom: 12,
    borderRadius: 8,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 8,
  },
  itemTitle: {
    fontSize: 16,
    fontWeight: "bold",
    color: "#fff",
    flex: 1,
    marginRight: 8,
  },
  priorityChip: {
    borderColor: "#FFD700",
  },
  itemDescription: {
    color: "#bbb",
    marginBottom: 12,
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  location: {
    color: "#888",
    fontSize: 12,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#111",
  },
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
  errorText: {
    color: "#ff6b6b",
    textAlign: "center",
    marginBottom: 16,
    fontSize: 14,
  },
});