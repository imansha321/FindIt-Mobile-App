import React, { useState } from 'react';
import { View, StyleSheet, Modal } from 'react-native';
import { Text, Button, TextInput, Card, Appbar, ActivityIndicator } from 'react-native-paper';
import { useRouter } from 'expo-router';

interface PaymentModalProps {
  visible: boolean;
  onClose: () => void;
  amount: number;
  onPaymentSuccess: () => void;
  onPaymentFailure: (error: string) => void;
}

export default function PaymentModal({ 
  visible, 
  onClose, 
  amount, 
  onPaymentSuccess, 
  onPaymentFailure 
}: PaymentModalProps) {
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardholderName, setCardholderName] = useState('');
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const formatCardNumber = (text: string) => {
    const cleaned = text.replace(/\s/g, '');
    const groups = cleaned.match(/.{1,4}/g);
    return groups ? groups.join(' ') : cleaned;
  };

  const formatExpiryDate = (text: string) => {
    const cleaned = text.replace(/\D/g, '');
    if (cleaned.length >= 2) {
      return cleaned.slice(0, 2) + '/' + cleaned.slice(2, 4);
    }
    return cleaned;
  };

  const handlePayment = async () => {
    if (!cardNumber || !expiryDate || !cvv || !cardholderName) {
      onPaymentFailure('Please fill in all payment details');
      return;
    }

    if (cardNumber.replace(/\s/g, '').length !== 16) {
      onPaymentFailure('Please enter a valid 16-digit card number');
      return;
    }

    if (cvv.length !== 3) {
      onPaymentFailure('Please enter a valid 3-digit CVV');
      return;
    }

    setProcessing(true);

    // Simulate payment processing
    setTimeout(() => {
      setProcessing(false);
      
      // Simulate 90% success rate
      if (Math.random() > 0.1) {
        onPaymentSuccess();
      } else {
        onPaymentFailure('Payment failed. Please try again.');
      }
    }, 2000);
  };

  const resetForm = () => {
    setCardNumber('');
    setExpiryDate('');
    setCvv('');
    setCardholderName('');
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <View style={styles.container}>
        <Appbar.Header style={styles.header}>
          <Appbar.BackAction onPress={onClose} color="#fff" />
          <Appbar.Content title="Bounty Payment" titleStyle={{ color: '#fff' }} />
        </Appbar.Header>

        <View style={styles.content}>
          <Card style={styles.paymentCard}>
            <Card.Content>
              <Text style={styles.amountText}>Bounty Amount: ${amount}</Text>
              <Text style={styles.description}>
                This payment will be held securely and only released when the item is successfully returned.
              </Text>

              <TextInput
                label="Card Number"
                value={cardNumber}
                onChangeText={(text) => setCardNumber(formatCardNumber(text))}
                style={styles.input}
                mode="outlined"
                keyboardType="numeric"
                maxLength={19}
                theme={{ 
                  colors: { 
                    text: "#fff", 
                    background: "#222", 
                    placeholder: "#bbb", 
                    primary: "#FFD700" 
                  } 
                }}
                placeholderTextColor="#bbb"
                selectionColor="#FFD700"
                underlineColor="#FFD700"
                textColor="#fff"
              />

              <TextInput
                label="Cardholder Name"
                value={cardholderName}
                onChangeText={setCardholderName}
                style={styles.input}
                mode="outlined"
                theme={{ 
                  colors: { 
                    text: "#fff", 
                    background: "#222", 
                    placeholder: "#bbb", 
                    primary: "#FFD700" 
                  } 
                }}
                placeholderTextColor="#bbb"
                selectionColor="#FFD700"
                underlineColor="#FFD700"
                textColor="#fff"
              />

              <View style={styles.row}>
                <TextInput
                  label="Expiry Date (MM/YY)"
                  value={expiryDate}
                  onChangeText={(text) => setExpiryDate(formatExpiryDate(text))}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  maxLength={5}
                  theme={{ 
                    colors: { 
                      text: "#fff", 
                      background: "#222", 
                      placeholder: "#bbb", 
                      primary: "#FFD700" 
                    } 
                  }}
                  placeholderTextColor="#bbb"
                  selectionColor="#FFD700"
                  underlineColor="#FFD700"
                  textColor="#fff"
                />

                <TextInput
                  label="CVV"
                  value={cvv}
                  onChangeText={setCvv}
                  style={[styles.input, styles.halfInput]}
                  mode="outlined"
                  keyboardType="numeric"
                  maxLength={3}
                  secureTextEntry
                  theme={{ 
                    colors: { 
                      text: "#fff", 
                      background: "#222", 
                      placeholder: "#bbb", 
                      primary: "#FFD700" 
                    } 
                  }}
                  placeholderTextColor="#bbb"
                  selectionColor="#FFD700"
                  underlineColor="#FFD700"
                  textColor="#fff"
                />
              </View>

              <View style={styles.securityInfo}>
                <Text style={styles.securityText}>
                  🔒 Your payment information is encrypted and secure
                </Text>
                <Text style={styles.feeText}>
                  Platform fee: ${(amount * 0.1).toFixed(2)} (10%)
                </Text>
                <Text style={styles.totalText}>
                  Total: ${(amount * 1.1).toFixed(2)}
                </Text>
              </View>

              <Button
                mode="contained"
                onPress={handlePayment}
                loading={processing}
                disabled={processing || !cardNumber || !expiryDate || !cvv || !cardholderName}
                style={styles.payButton}
                buttonColor="#FFD700"
                textColor="#111"
              >
                {processing ? 'Processing Payment...' : `Pay $${(amount * 1.1).toFixed(2)}`}
              </Button>
            </Card.Content>
          </Card>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#111',
  },
  header: {
    backgroundColor: '#111',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  paymentCard: {
    backgroundColor: '#222',
    borderRadius: 12,
  },
  amountText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFD700',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    color: '#bbb',
    textAlign: 'center',
    marginBottom: 24,
    lineHeight: 20,
  },
  input: {
    marginBottom: 16,
    backgroundColor: '#333',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  halfInput: {
    flex: 0.48,
  },
  securityInfo: {
    marginTop: 16,
    marginBottom: 24,
    padding: 16,
    backgroundColor: '#333',
    borderRadius: 8,
  },
  securityText: {
    color: '#4CAF50',
    textAlign: 'center',
    marginBottom: 8,
  },
  feeText: {
    color: '#bbb',
    textAlign: 'center',
    fontSize: 12,
  },
  totalText: {
    color: '#FFD700',
    textAlign: 'center',
    fontWeight: 'bold',
    fontSize: 16,
    marginTop: 4,
  },
  payButton: {
    borderRadius: 8,
    marginTop: 8,
  },
}); 