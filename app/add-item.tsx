import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, ScrollView, Alert, Platform } from "react-native";
import { TextInput, Button, Card, HelperText, Chip, Appbar } from "react-native-paper";
import { useRouter } from "expo-router";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { apiService } from "./services/api";
import { useAuth } from "./context/AuthContext";
import PaymentModal from "./components/PaymentModal";

interface FormData {
  title: string;
  description: string;
  category: string;
  item_type: "lost" | "found" | "bounty";
  location?: string;
  latitude?: number;
  longitude?: number;
  reward_amount?: number;
  is_priority: boolean;
  images: string[];
}

const categories = [
  "Accessories", "Electronics", "Bags", "Clothing", "Documents", 
  "Jewelry", "Keys", "Toys", "Sports", "Books", "Cards", "Tools", "Pets", "Other"
];

export default function AddItemScreen() {
  const [formData, setFormData] = useState<FormData>({
    title: "",
    description: "",
    category: "",
    item_type: "lost",
    location: "",
    is_priority: false,
    images: [],
  });

  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<FormData>>({});
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [selectedImages, setSelectedImages] = useState<ImagePicker.ImagePickerAsset[]>([]);
  const [locationPermission, setLocationPermission] = useState<boolean>(false);

  const router = useRouter();
  const { user } = useAuth();

  useEffect(() => {
    checkLocationPermission();
  }, []);

  const checkLocationPermission = async () => {
    const { status } = await Location.requestForegroundPermissionsAsync();
    setLocationPermission(status === "granted");
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<FormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = "Title is required";
    }

    if (!formData.description.trim()) {
      newErrors.description = "Description is required";
    }

    if (!formData.category) {
      newErrors.category = "Category is required";
    }

    if (formData.item_type === "bounty" && (!formData.reward_amount || formData.reward_amount <= 0)) {
      newErrors.reward_amount = "Bounty amount is required and must be greater than 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const pickImages = async () => {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled) {
        setSelectedImages(result.assets);
      }
    } catch (error) {
      console.error("Error picking images:", error);
      Alert.alert("Error", "Failed to pick images");
    }
  };

  const getCurrentLocation = async () => {
    try {
      if (!locationPermission) {
        const { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== "granted") {
          Alert.alert("Permission Denied", "Location permission is required to get your current location");
          return;
        }
        setLocationPermission(true);
      }

      const location = await Location.getCurrentPositionAsync({});
      setFormData(prev => ({
        ...prev,
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      }));

      // Get address from coordinates
      const reverseGeocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (reverseGeocode.length > 0) {
        const address = reverseGeocode[0];
        const locationString = [
          address.street,
          address.city,
          address.region,
          address.country
        ].filter(Boolean).join(", ");
        
        setFormData(prev => ({
          ...prev,
          location: locationString,
        }));
      }
    } catch (error) {
      console.error("Error getting location:", error);
      Alert.alert("Error", "Failed to get current location");
    }
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      return;
    }

    if (formData.item_type === "bounty") {
      setShowPaymentModal(true);
      return;
    }

    await submitItem();
  };

  const submitItem = async () => {
    try {
      setLoading(true);

      // Create FormData for multipart/form-data
      const formDataToSend = new FormData();
      formDataToSend.append("title", formData.title);
      formDataToSend.append("description", formData.description);
      formDataToSend.append("category", formData.category);
      formDataToSend.append("item_type", formData.item_type);
      formDataToSend.append("is_priority", formData.is_priority.toString());

      if (formData.location) {
        formDataToSend.append("location", formData.location);
      }

      if (formData.latitude && formData.longitude) {
        formDataToSend.append("latitude", formData.latitude.toString());
        formDataToSend.append("longitude", formData.longitude.toString());
      }

      if (formData.reward_amount) {
        formDataToSend.append("reward_amount", formData.reward_amount.toString());
      }

      // Add images
      selectedImages.forEach((image, index) => {
        const imageFile = {
          uri: image.uri,
          type: "image/jpeg",
          name: `image_${index}.jpg`,
        } as any;
        formDataToSend.append("images", imageFile);
      });

      const createdItem = await apiService.createItem(formDataToSend);

      Alert.alert(
        "Success",
        "Item created successfully!",
        [
          {
            text: "OK",
            onPress: () => router.push(`/item/${createdItem.id}`),
          },
        ]
      );
    } catch (error: any) {
      console.error("Error creating item:", error);
      Alert.alert("Error", error.message || "Failed to create item");
    } finally {
      setLoading(false);
    }
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    await submitItem();
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  return (
    <View style={styles.container}>
      <Appbar.Header style={styles.header}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Add New Item" titleStyle={{ color: '#fff' }} />
      </Appbar.Header>

      <ScrollView style={styles.content}>
        <Card style={styles.card}>
          <Card.Content>
            <Text style={styles.sectionTitle}>Item Type</Text>
            <View style={styles.typeContainer}>
              {(["lost", "found", "bounty"] as const).map((type) => (
                <Chip
                  key={type}
                  selected={formData.item_type === type}
                  onPress={() => setFormData(prev => ({ ...prev, item_type: type }))}
                  style={styles.typeChip}
                  textStyle={{ color: formData.item_type === type ? "#111" : "#FFD700" }}
                  selectedColor="#111"
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                </Chip>
              ))}
            </View>

            <TextInput
              label="Title *"
              value={formData.title}
              onChangeText={(text) => setFormData(prev => ({ ...prev, title: text }))}
              style={styles.input}
              mode="outlined"
              theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
              placeholderTextColor="#bbb"
              selectionColor="#FFD700"
              underlineColor="#FFD700"
              textColor="#fff"
            />
            {errors.title && <HelperText type="error" visible>{errors.title}</HelperText>}

            <TextInput
              label="Description *"
              value={formData.description}
              onChangeText={(text) => setFormData(prev => ({ ...prev, description: text }))}
              style={styles.input}
              mode="outlined"
              multiline
              numberOfLines={4}
              theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
              placeholderTextColor="#bbb"
              selectionColor="#FFD700"
              underlineColor="#FFD700"
              textColor="#fff"
            />
            {errors.description && <HelperText type="error" visible>{errors.description}</HelperText>}

            <Text style={styles.sectionTitle}>Category</Text>
            <View style={styles.categoryContainer}>
              {categories.map((category) => (
                <Chip
                  key={category}
                  selected={formData.category === category}
                  onPress={() => setFormData(prev => ({ ...prev, category }))}
                  style={styles.categoryChip}
                  textStyle={{ color: formData.category === category ? "#111" : "#bbb" }}
                  selectedColor="#111"
                >
                  {category}
                </Chip>
              ))}
            </View>
            {errors.category && <HelperText type="error" visible>{errors.category}</HelperText>}

            <TextInput
              label="Location (optional)"
              value={formData.location}
              onChangeText={(text) => setFormData(prev => ({ ...prev, location: text }))}
              style={styles.input}
              mode="outlined"
              theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
              placeholderTextColor="#bbb"
              selectionColor="#FFD700"
              underlineColor="#FFD700"
              textColor="#fff"
            />

            <Button
              mode="outlined"
              onPress={getCurrentLocation}
              style={styles.locationButton}
              textColor="#FFD700"
              icon="crosshairs-gps"
            >
              Use Current Location
            </Button>

            {formData.item_type === "bounty" && (
              <TextInput
                label="Bounty Amount ($) *"
                value={formData.reward_amount?.toString() || ""}
                                 onChangeText={(text) => {
                   const amount = parseFloat(text) || 0;
                   setFormData(prev => ({ ...prev, reward_amount: amount > 0 ? amount : undefined }));
                 }}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
                placeholderTextColor="#bbb"
                selectionColor="#FFD700"
                underlineColor="#FFD700"
                textColor="#fff"
              />
            )}
            {errors.reward_amount && <HelperText type="error" visible>{errors.reward_amount}</HelperText>}

            <View style={styles.priorityContainer}>
              <Chip
                selected={formData.is_priority}
                onPress={() => setFormData(prev => ({ ...prev, is_priority: !prev.is_priority }))}
                style={styles.priorityChip}
                textStyle={{ color: formData.is_priority ? "#111" : "#FFD700" }}
                selectedColor="#111"
                icon="star"
              >
                Mark as Priority
              </Chip>
            </View>

            <Text style={styles.sectionTitle}>Images (optional)</Text>
            <Button
              mode="outlined"
              onPress={pickImages}
              style={styles.imageButton}
              textColor="#FFD700"
              icon="camera"
            >
              Pick Images
            </Button>
            {selectedImages.length > 0 && (
              <Text style={styles.imageCount}>{selectedImages.length} image(s) selected</Text>
            )}

            <Button
              mode="contained"
              onPress={handleSubmit}
              loading={loading}
              disabled={loading}
              style={styles.submitButton}
              buttonColor="#FFD700"
              textColor="#111"
            >
              {formData.item_type === "bounty" ? "Continue to Payment" : "Create Item"}
            </Button>
          </Card.Content>
        </Card>
      </ScrollView>

      <PaymentModal
        visible={showPaymentModal}
        amount={formData.reward_amount || 0}
        onSuccess={handlePaymentSuccess}
        onCancel={handlePaymentCancel}
        itemTitle={formData.title}
      />
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
  card: {
    backgroundColor: "#222",
    borderRadius: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#FFD700",
    marginTop: 16,
    marginBottom: 8,
  },
  typeContainer: {
    flexDirection: "row",
    gap: 8,
    marginBottom: 16,
  },
  typeChip: {
    backgroundColor: "transparent",
    borderColor: "#FFD700",
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#333",
  },
  categoryContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
    marginBottom: 16,
  },
  categoryChip: {
    backgroundColor: "transparent",
    borderColor: "#FFD700",
  },
  locationButton: {
    marginBottom: 16,
    borderColor: "#FFD700",
    borderRadius: 8,
  },
  priorityContainer: {
    marginBottom: 16,
  },
  priorityChip: {
    backgroundColor: "transparent",
    borderColor: "#FFD700",
  },
  imageButton: {
    marginBottom: 8,
    borderColor: "#FFD700",
    borderRadius: 8,
  },
  imageCount: {
    color: "#bbb",
    fontSize: 14,
    marginBottom: 16,
  },
  submitButton: {
    marginTop: 16,
    borderRadius: 8,
  },
});
