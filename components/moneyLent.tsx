import React from "react";
import { View, Text, FlatList, Pressable, StyleSheet } from "react-native";

const mockData = [
  { id: "1", name: "Michael Johnson", status: "outstanding", date: "Jan 10, 2024", amount: 500 },
  { id: "2", name: "Sarah Wilson", status: "paid", date: "Jan 8, 2024", amount: 350 },
];

export default function MoneyLentTab() {
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
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={styles.amount}>${item.amount.toFixed(2)}</Text>
            <Pressable
              style={item.status === "outstanding" ? styles.btnOutstanding : styles.btnPaid}
            >
              <Text
                style={
                  item.status === "outstanding" ? styles.btnTextOutstanding : styles.btnPaidText
                }
              >
                {item.status === "outstanding" ? "Mark Paid" : "Paid"}
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
  amount: { fontSize: 16, fontWeight: "700", color: "#EA580C" },
  btnOutstanding: {
    marginTop: 6,
    backgroundColor: "#EA580C",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnTextOutstanding: { color: "#fff", fontWeight: "700" },
  btnPaid: {
    marginTop: 6,
    backgroundColor: "#E5E7EB",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
  },
  btnPaidText: { color: "#374151", fontWeight: "600" },
});
