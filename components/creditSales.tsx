import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";

const mockData = [
  { id: "1", name: "John Doe", status: "pending", date: "Jan 15, 2024", amount: 150, items: "Coffee x2, Sandwich x1" },
  { id: "2", name: "Jane Smith", status: "paid", date: "Jan 14, 2024", amount: 75.5, items: "Laptop bag, Mouse" },
];

export default function CreditSalesTab() {
  return (
    <FlatList
      data={mockData}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{ padding: 12 }}
      renderItem={({ item }) => (
        <View style={styles.card}>
          <View style={{ flex: 1 }}>
            <Text style={styles.name}>{item.name}</Text>
            <Text style={styles.date}>{item.date}</Text>
            <Text style={styles.items}>{item.items}</Text>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
            <Pressable
              style={item.status === "pending" ? styles.btn : styles.btnPaid}
            >
              <Text
                style={item.status === "pending" ? styles.btnText : styles.btnPaidText}
              >
                {item.status === "pending" ? "Mark Paid" : "Paid"}
              </Text>
            </Pressable>
          </View>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#fff",
    padding: 14,
    borderRadius: 10,
    marginBottom: 8,
    flexDirection: "row",
    justifyContent: "space-between",
  },
  name: { fontWeight: "600", fontSize: 16, color: "#111827" },
  date: { fontSize: 12, color: "#6B7280" },
  items: { fontSize: 12, color: "#6B7280", marginTop: 4 },
  amount: { fontSize: 16, fontWeight: "700", color: "#16A34A" },
  btn: {
    marginTop: 6,
    backgroundColor: "#16A34A",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnPaid: {
    marginTop: 6,
    backgroundColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnPaidText: { color: "#374151", fontWeight: "600" },
});
