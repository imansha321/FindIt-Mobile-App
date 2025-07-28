import React, { useState } from "react";
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Image } from "react-native";
import { Text, TextInput, Button, RadioButton, Appbar, Snackbar, HelperText } from "react-native-paper";
import * as ImagePicker from "expo-image-picker";
import MapView, { Marker, MapPressEvent } from 'react-native-maps';
import * as Location from 'expo-location';
import { Modal, ActivityIndicator } from 'react-native';
import { useRouter } from "expo-router";
import PaymentModal from "./components/PaymentModal";

const categories = [
  "Accessories",
  "Electronics",
  "Bags",
  "Clothing",
  "Documents",
  "Jewelry",
  "Keys",
  "Toys",
  "Sports",
  "Books",
  "Cards",
  "Tools",
  "Pets",
  "Other"
];
const itemTypes = ["Lost", "Found", "Bounty"];

export default function AddItem() {
  const router = useRouter();
  const [itemType, setItemType] = useState("Lost");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [location, setLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [reward, setReward] = useState("");
  const [images, setImages] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [snackbarVisible, setSnackbarVisible] = useState(false);
  const [mapVisible, setMapVisible] = useState(false);
  const [mapLoading, setMapLoading] = useState(false);
  const [region, setRegion] = useState<{ latitude: number; longitude: number; latitudeDelta: number; longitudeDelta: number } | null>(null);
  const [tempLocation, setTempLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentError, setPaymentError] = useState("");

  const pickImage = async () => {
    let result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });
    if (!result.canceled && result.assets && result.assets.length > 0) {
      setImages((prev) => [...prev, ...result.assets.map((a) => a.uri)]);
    }
  };

  const removeImage = (uri: string) => {
    setImages((prev) => prev.filter((img) => img !== uri));
  };

  // When opening the map, start with the current location or previous selection
  const openMap = async () => {
    setMapVisible(true);
    setMapLoading(true);
    let { status } = await Location.requestForegroundPermissionsAsync();
    if (status !== 'granted') {
      setMapLoading(false);
      alert('Permission to access location was denied');
      return;
    }
    let loc = await Location.getCurrentPositionAsync({});
    setRegion({
      latitude: location?.latitude || loc.coords.latitude,
      longitude: location?.longitude || loc.coords.longitude,
      latitudeDelta: 0.01,
      longitudeDelta: 0.01,
    });
    setTempLocation(location || null);
    setMapLoading(false);
  };

  const handleMapPress = (e: MapPressEvent) => {
    setTempLocation(e.nativeEvent.coordinate);
  };

  const confirmMapSelection = () => {
    if (tempLocation) setLocation(tempLocation);
    setMapVisible(false);
  };

  const handleSubmit = () => {
    if (itemType === "Bounty") {
      const bountyAmount = parseFloat(reward);
      if (!reward || isNaN(bountyAmount) || bountyAmount < 1) {
        setPaymentError("Please enter a valid bounty amount (minimum $1.00)");
        setSnackbarVisible(true);
        return;
      }
    }

    if (itemType === "Bounty") {
      // Show payment modal for bounty items
      setShowPaymentModal(true);
    } else {
      // Submit non-bounty items directly
      submitItem();
    }
  };

  const submitItem = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      setTitle("");
      setDescription("");
      setCategory(categories[0]);
      setLocation(null);
      setReward("");
      setImages([]);
      setItemType("Lost");
      setShowPaymentModal(false);
      router.replace("/home");
    }, 1000);
  };

  const handlePaymentSuccess = () => {
    setShowPaymentModal(false);
    submitItem();
  };

  const handlePaymentFailure = (error: string) => {
    setPaymentError(error);
    setShowPaymentModal(false);
    setSnackbarVisible(true);
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <Appbar.Header style={{ backgroundColor: "#111" }}>
        <Appbar.BackAction onPress={() => router.back()} color="#fff" />
        <Appbar.Content title="Add New Item" titleStyle={{ color: "#fff" }} />
      </Appbar.Header>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.label}>Item Type</Text>
        <RadioButton.Group onValueChange={setItemType} value={itemType}>
          <View style={styles.radioRow}>
            {itemTypes.map((type) => (
              <View key={type} style={styles.radioItem}>
                <RadioButton value={type} color="#FFD700" />
                <Text style={styles.radioLabel}>{type}</Text>
              </View>
            ))}
          </View>
        </RadioButton.Group>
        <TextInput
          label="Title"
          value={title}
          onChangeText={setTitle}
          style={styles.input}
          mode="outlined"
          theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
          placeholderTextColor="#bbb"
          selectionColor="#FFD700"
          underlineColor="#FFD700"
          textColor="#fff"
        />
        <TextInput
          label="Description"
          value={description}
          onChangeText={setDescription}
          style={styles.input}
          mode="outlined"
          multiline
          numberOfLines={3}
          theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
          placeholderTextColor="#bbb"
          selectionColor="#FFD700"
          underlineColor="#FFD700"
          textColor="#fff"
        />
        <Text style={styles.label}>Category</Text>
        <RadioButton.Group onValueChange={setCategory} value={category}>
          <View style={styles.radioRow}>
            {categories.map((cat) => (
              <View key={cat} style={styles.radioItem}>
                <RadioButton value={cat} color="#FFD700" />
                <Text style={styles.radioLabel}>{cat}</Text>
              </View>
            ))}
          </View>
        </RadioButton.Group>
        <Button
          mode="outlined"
          icon="map"
          onPress={openMap}
          style={styles.imageButton}
          textColor="#FFD700"
        >
          {location ? `Location: (${location.latitude.toFixed(5)}, ${location.longitude.toFixed(5)})` : 'Pick Location on Map'}
        </Button>
        <Modal
          visible={mapVisible}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setMapVisible(false)}
        >
          <View style={{ flex: 1, backgroundColor: '#111' }}>
            <Appbar.Header style={{ backgroundColor: '#111' }}>
              <Appbar.BackAction onPress={() => setMapVisible(false)} color="#fff" />
              <Appbar.Content title="Select Location" titleStyle={{ color: '#fff' }} />
            </Appbar.Header>
            {mapLoading || !region ? (
              <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                <ActivityIndicator size="large" color="#FFD700" />
              </View>
            ) : (
              <>
                <MapView
                  style={{ flex: 1 }}
                  initialRegion={region}
                  onPress={handleMapPress}
                  showsUserLocation
                  showsMyLocationButton
                >
                  {tempLocation && <Marker coordinate={tempLocation} />}
                </MapView>
                <View style={{ padding: 16, backgroundColor: '#111' }}>
                  <Button
                    mode="contained"
                    onPress={confirmMapSelection}
                    buttonColor="#FFD700"
                    textColor="#111"
                    style={{ borderRadius: 8 }}
                  >
                    Confirm Location
                  </Button>
                </View>
              </>
            )}
          </View>
        </Modal>
        {itemType === "Bounty" && (
          <>
            <TextInput
              label="Bounty Amount ($) *"
              value={reward}
              onChangeText={setReward}
              style={styles.input}
              mode="outlined"
              keyboardType="numeric"
              theme={{ colors: { text: "#fff", background: "#222", placeholder: "#bbb", primary: "#FFD700" } }}
              placeholderTextColor="#bbb"
              selectionColor="#FFD700"
              underlineColor="#FFD700"
              textColor="#fff"
              error={itemType === "Bounty" && (!reward || isNaN(parseFloat(reward)) || parseFloat(reward) < 1)}
            />
            <HelperText type="info" visible style={{ color: "#FFD700", fontSize: 12 }}>
              Minimum bounty amount: $1.00
            </HelperText>
          </>
        )}
        <Button
          icon="camera"
          mode="outlined"
          onPress={pickImage}
          style={styles.imageButton}
          textColor="#FFD700"
        >
          {images.length > 0 ? "Add More Images" : "Upload Images"}
        </Button>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 16 }}>
          {images.map((img, idx) => (
            <View key={img} style={styles.imageThumbContainer}>
              <Image source={{ uri: img }} style={styles.imagePreview} />
              <Button
                mode="text"
                onPress={() => removeImage(img)}
                textColor="#FFD700"
                style={styles.removeImageButton}
                compact
              >
                Remove
              </Button>
            </View>
          ))}
        </ScrollView>
        <Button
          mode="contained"
          onPress={handleSubmit}
          loading={submitting}
          disabled={submitting || !title || !description || !location || (itemType === "Bounty" && (!reward || isNaN(parseFloat(reward)) || parseFloat(reward) < 1))}
          style={styles.submitButton}
          buttonColor="#FFD700"
          textColor="#111"
        >
          {itemType === "Bounty" ? "Submit with Payment" : "Submit"}
        </Button>
        <HelperText type="info" visible style={{ color: "#bbb", textAlign: "center" }}>
          {itemType === "Bounty" 
            ? "Bounty amount is required for bounty items. Payment will be processed securely."
            : "All fields are required except Bounty (only for Bounty type) and image."
          }
        </HelperText>
      </ScrollView>

      {/* Payment Modal */}
      <PaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        amount={parseFloat(reward) || 0}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailure={handlePaymentFailure}
      />

      {/* Snackbar for errors */}
      <Snackbar
        visible={snackbarVisible}
        onDismiss={() => setSnackbarVisible(false)}
        duration={4000}
        style={{ backgroundColor: '#f44336' }}
      >
        {paymentError || "Please fill in all required fields."}
      </Snackbar>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: "#111",
    flexGrow: 1,
  },
  label: {
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 8,
    marginTop: 16,
    fontSize: 16,
  },
  input: {
    marginBottom: 16,
    backgroundColor: "#222",
    color: "#fff",
  },
  radioRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginBottom: 8,
  },
  radioItem: {
    flexDirection: "row",
    alignItems: "center",
    marginRight: 16,
    marginBottom: 8,
  },
  radioLabel: {
    color: "#fff",
    marginLeft: 4,
    fontSize: 15,
  },
  imageButton: {
    marginBottom: 16,
    borderColor: "#FFD700",
    borderWidth: 1,
    borderRadius: 8,
  },
  imageThumbContainer: {
    marginRight: 12,
    alignItems: "center",
  },
  imagePreview: {
    width: 180,
    height: 120,
    borderRadius: 12,
    alignSelf: "center",
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "#FFD700",
  },
  removeImageButton: {
    marginTop: 0,
    paddingVertical: 0,
    minHeight: 24,
  },
  submitButton: {
    marginTop: 12,
    borderRadius: 8,
  },
});
