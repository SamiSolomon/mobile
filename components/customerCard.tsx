import React, { useState } from "react";
import {
  View,
  Text,
  Pressable,
  Modal,
  TextInput,
  StyleSheet,
} from "react-native";

type CustomerType = {
  id: number;
  name: string;
  balance: number;
  totalSales: number;
};

type Payment = {
  customerId: number;
  amount: number;
  collectedBy: "me" | "other";
  date: Date;
};

type CustomerCardProps = {
  customer: CustomerType;
  onAddPayment: (payment: Payment) => void;
};

const CustomerCard: React.FC<CustomerCardProps> = ({ customer, onAddPayment }) => {
  const [showForm, setShowForm] = useState(false);
  const [amount, setAmount] = useState("");
  const [collectedBy, setCollectedBy] = useState<"me" | "other">("me");

  const handleSubmit = () => {
    if (!amount) return;
    onAddPayment({
      customerId: customer.id,
      amount: parseFloat(amount),
      collectedBy,
      date: new Date(),
    });
    setShowForm(false);
    setAmount("");
  };

  return (
    <View style={styles.card}>
      <Text style={styles.name}>{customer.name}</Text>
      <Text>Balance: ETB {customer.balance.toFixed(2)}</Text>
      <Text>Total Sales: {customer.totalSales} transactions</Text>

      {/* Collect Payment button */}
      <Pressable style={styles.collectBtn} onPress={() => setShowForm(true)}>
        <Text style={{ color: "#111" }}>💵 Record Payment</Text>
      </Pressable>

      {/* Modal for form */}
      <Modal visible={showForm} transparent animationType="slide">
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Record Payment</Text>

            <TextInput
              placeholder="Amount"
              value={amount}
              keyboardType="numeric"
              onChangeText={setAmount}
              style={styles.input}
            />

            <View style={styles.radioRow}>
              <Pressable onPress={() => setCollectedBy("me")}>
                <Text style={collectedBy === "me" ? styles.activeRadio : styles.radio}>
                  Me
                </Text>
              </Pressable>
              <Pressable onPress={() => setCollectedBy("other")}>
                <Text style={collectedBy === "other" ? styles.activeRadio : styles.radio}>
                  Other Person
                </Text>
              </Pressable>
            </View>

            <Pressable style={styles.saveBtn} onPress={handleSubmit}>
              <Text style={{ color: "#fff", fontWeight: "700" }}>Save Payment</Text>
            </Pressable>

            <Pressable onPress={() => setShowForm(false)}>
              <Text style={{ color: "red", marginTop: 8 }}>Cancel</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    elevation: 2,
  },
  name: { fontSize: 16, fontWeight: "700", marginBottom: 4 },
  collectBtn: {
    marginTop: 8,
    backgroundColor: "#E5E7EB",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  modalBackdrop: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(0,0,0,0.5)",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 12,
    padding: 16,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 12 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 10,
    marginBottom: 12,
  },
  radioRow: { flexDirection: "row", justifyContent: "space-around", marginBottom: 12 },
  radio: { padding: 8, borderWidth: 1, borderColor: "#ccc", borderRadius: 6 },
  activeRadio: {
    padding: 8,
    borderWidth: 1,
    borderColor: "#16A34A",
    borderRadius: 6,
    backgroundColor: "#DCFCE7",
  },
  saveBtn: {
    backgroundColor: "#16A34A",
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
});

export default CustomerCard;
