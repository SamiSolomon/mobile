import React, { FC, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  TouchableOpacity,
  StyleSheet,
} from "react-native";
import { money } from "../app/(tabs)/sales"; // from SalesScreen

type Mode = "cash" | "credit";

interface ListFooterProps {
  customerName: string;
  setCustomerName: (text: string) => void;
  mode: Mode;
  setMode: (mode: Mode) => void;
  paid: number;
  setPaid: (paid: number) => void;
  completeSale: () => Promise<void>;
  isCompleteDisabled: boolean;
  history: any[];
  handleDeleteSale: (id: number) => Promise<void>;
  onSelectSale: (sale: any) => void;
}

const ListFooter: FC<ListFooterProps> = ({
  customerName,
  setCustomerName,
  mode,
  setMode,
  paid,
  setPaid,
  completeSale,
  isCompleteDisabled,
  history,
  handleDeleteSale,
  onSelectSale,
}) => {
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Unique customer names from history
  const customerSuggestions = useMemo(() => {
    const all = history.map((s) => s.customerName).filter(Boolean) as string[];
    return Array.from(new Set(all));
  }, [history]);

  // Filter suggestions that start with typed text
  const filtered = useMemo(() => {
    if (!customerName.trim()) return [];
    return customerSuggestions.filter((name) =>
      name.toLowerCase().startsWith(customerName.toLowerCase())
    );
  }, [customerName, customerSuggestions]);

  return (
    <View style={styles.footerContainer}>
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Customer & Payment</Text>

        {/* Customer Name with autocomplete */}
        <TextInput
          value={customerName}
          onChangeText={(text) => {
            setCustomerName(text);
            setShowSuggestions(true);
          }}
          placeholder="Customer Name"
          style={styles.input}
        />

        {/* Suggestion Dropdown */}
        {showSuggestions && filtered.length > 0 && (
          <View style={styles.suggestionBox}>
            {filtered.map((name) => (
              <Pressable
                key={name}
                onPress={() => {
                  setCustomerName(name);
                  setShowSuggestions(false);
                }}
                style={styles.suggestionItem}
              >
                <Text>{name}</Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Payment Mode Switch */}
        <View style={styles.modeRow}>
          <Pressable
            onPress={() => setMode("cash")}
            style={[
              styles.modeBtn,
              mode === "cash" ? styles.modeActiveCash : styles.modeIdle,
            ]}
          >
            <Text
              style={[styles.modeText, mode === "cash" && styles.modeTextActive]}
            >
              Cash
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setMode("credit")}
            style={[
              styles.modeBtn,
              mode === "credit" ? styles.modeActiveCredit : styles.modeIdle,
            ]}
          >
            <Text
              style={[
                styles.modeText,
                mode === "credit" && styles.modeTextActive,
              ]}
            >
              Credit
            </Text>
          </Pressable>
        </View>

        {/* Payment Input */}
        {mode === "cash" && (
          <TextInput
            value={(paid).toFixed(2)} // FIX: show in ETB not cents
            keyboardType="numeric"
            onChangeText={(text) => {
              const num = parseFloat(text);
              setPaid(Number.isNaN(num) ? 0 : Math.round(num * 100));
            }}
            style={styles.input}
          />
        )}

        {/* Complete Sale */}
        <Pressable
          onPress={completeSale}
          disabled={isCompleteDisabled}
          style={[
            styles.completeBtn,
            isCompleteDisabled
              ? styles.completeBtnDisabled
              : styles.completeBtnActive,
          ]}
        >
          <Text style={styles.completeBtnText}>Complete Sale</Text>
        </Pressable>
      </View>

      <View style={styles.lineBreak} />

      {/* Recent Sales */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Recent Sales</Text>
        {history.length === 0 ? (
          <Text style={styles.muted}>No recent sales.</Text>
        ) : (
          history.map((sale) => (
            <Pressable
              key={sale.id}
              onPress={() => onSelectSale(sale)}
              style={styles.transactionRow}
            >
              <View>
                <Text style={styles.transactionName}>
                  {sale.customerName ?? "Cash Sale"}
                </Text>
                <Text style={styles.transactionSub}>
                  {new Date(sale.createdAt).toLocaleDateString()} •{" "}
                  {sale.items?.length ?? 0} items
                </Text>
              </View>
              <View style={{ flexDirection: "row", alignItems: "center" }}>
                <Text style={styles.transactionAmount}>
                  {money(sale.totalCents)}
                </Text>
                <TouchableOpacity
                  onPress={() => handleDeleteSale(sale.id)}
                  style={styles.saleDeleteBtn}
                >
                  <Text style={styles.deleteText}>×</Text>
                </TouchableOpacity>
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  footerContainer: { padding: 16, marginBottom: 32 },
  card: {
    backgroundColor: "#fff",
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  cardTitle: { fontWeight: "700", fontSize: 16, marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 6,
    marginBottom: 8,
    backgroundColor: "#fff",
  },

  // suggestion dropdown
  suggestionBox: {
    backgroundColor: "#f9f9f9",
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 6,
    maxHeight: 120,
    marginBottom: 8,
  },
  suggestionItem: {
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },

  modeRow: { flexDirection: "row", marginVertical: 8 },
  modeBtn: {
    flex: 1,
    padding: 10,
    marginHorizontal: 4,
    borderRadius: 6,
    alignItems: "center",
  },
  modeIdle: { backgroundColor: "#f0f0f0" },
  modeActiveCash: { backgroundColor: "#28a745" },
  modeActiveCredit: { backgroundColor: "#28a745" },
  modeText: { fontWeight: "600" },
  modeTextActive: { color: "#fff" },

  completeBtn: {
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  completeBtnActive: { backgroundColor: "#28a745" },
  completeBtnDisabled: { backgroundColor: "#77e9d8ff" },
  completeBtnText: { color: "#fff", fontWeight: "700" },

  lineBreak: { height: 1, backgroundColor: "#eee", marginVertical: 8 },
  muted: { color: "#999", fontStyle: "italic", padding: 4 },

  transactionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    backgroundColor: "#fafafa",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  transactionName: { fontSize: 15, fontWeight: "600", color: "#111827" },
  transactionSub: { fontSize: 12, color: "#6B7280" },
  transactionAmount: { fontSize: 15, fontWeight: "700", color: "#16A34A" },

  saleDeleteBtn: { paddingLeft: 8 },
  deleteText: { color: "red", fontWeight: "700" },
});

export default ListFooter;
