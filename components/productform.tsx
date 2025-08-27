import React, { useEffect, useState } from "react";
import { Modal, View, Text, TextInput, Pressable, StyleSheet, KeyboardAvoidingView, Platform } from "react-native";

type FormShape = {
  id?: number;
  name: string;
  unitSize: number;
  pricePerDozen: number;
  costPerDozen?: number;
  stockPieces: number;
  lowStockThreshold: number;
};

type Props = {
  visible: boolean;
  initial?: Partial<FormShape>;        // when editing
  onClose: () => void;
  onSubmit: (data: FormShape) => void; // parent decides insert/update
};

export default function ProductFormModal({ visible, initial, onClose, onSubmit }: Props) {
  const [form, setForm] = useState<FormShape>({
    id: undefined,
    name: "",
    unitSize: 12,
    pricePerDozen: 0,
    costPerDozen: undefined,
    stockPieces: 0,
    lowStockThreshold: 12,
  });

  useEffect(() => {
    if (visible) {
      setForm(prev => ({
        ...prev,
        id: initial?.id,
        name: initial?.name ?? "",
        unitSize: initial?.unitSize ?? 12,
        pricePerDozen: initial?.pricePerDozen ?? 0,
        costPerDozen: initial?.costPerDozen ?? undefined,
        stockPieces: initial?.stockPieces ?? 0,
        lowStockThreshold: initial?.lowStockThreshold ?? 12,
      }));
    }
  }, [visible, initial]);

  const disabled = !form.name.trim() || form.pricePerDozen <= 0 || form.unitSize <= 0;

  const update = (k: keyof FormShape, v: string) => {
    const numeric = ["unitSize","pricePerDozen","costPerDozen","stockPieces","lowStockThreshold"].includes(k as string);
    setForm(f => ({ ...f, [k]: numeric ? Number(v) || 0 : v }));
  };

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={styles.center}>
        <View style={styles.sheet}>
          <Text style={styles.title}>{form.id ? "Edit Product" : "Add Product"}</Text>

          <View style={styles.row}>
            <Text style={styles.label}>Name</Text>
            <TextInput
              value={form.name}
              onChangeText={(t)=>update("name", t)}
              placeholder="Fresh Eggs (Large)"
              style={styles.input}
            />
          </View>

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Text style={styles.label}>Pieces/Dozen</Text>
              <TextInput
                keyboardType="numeric"
                value={String(form.unitSize)}
                onChangeText={(t)=>update("unitSize", t)}
                placeholder="12"
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Low Stock @ (pcs)</Text>
              <TextInput
                keyboardType="numeric"
                value={String(form.lowStockThreshold)}
                onChangeText={(t)=>update("lowStockThreshold", t)}
                placeholder="12"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.grid2}>
            <View style={styles.col}>
              <Text style={styles.label}>Price / dozen (ETB)</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={String(form.pricePerDozen)}
                onChangeText={(t)=>update("pricePerDozen", t)}
                placeholder="45"
                style={styles.input}
              />
            </View>
            <View style={styles.col}>
              <Text style={styles.label}>Cost / dozen (ETB)</Text>
              <TextInput
                keyboardType="decimal-pad"
                value={form.costPerDozen != null ? String(form.costPerDozen) : ""}
                onChangeText={(t)=>update("costPerDozen", t || "0")}
                placeholder="(optional)"
                style={styles.input}
              />
            </View>
          </View>

          <View style={styles.row}>
            <Text style={styles.label}>Stock (pcs)</Text>
            <TextInput
              keyboardType="numeric"
              value={String(form.stockPieces)}
              onChangeText={(t)=>update("stockPieces", t)}
              placeholder="0"
              style={styles.input}
            />
          </View>

          <View style={styles.actions}>
            <Pressable onPress={onClose} style={[styles.btn, styles.cancel]}>
              <Text style={styles.btnTextAlt}>Cancel</Text>
            </Pressable>
            <Pressable
              disabled={disabled}
              onPress={() => onSubmit(form)}
              style={[styles.btn, disabled ? styles.saveDisabled : styles.save]}
            >
              <Text style={styles.btnText}>{form.id ? "Save Changes" : "Add Product"}</Text>
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, justifyContent: "flex-end", backgroundColor: "rgba(0,0,0,0.3)" },
  sheet: { backgroundColor: "#fff", padding: 16, borderTopLeftRadius: 16, borderTopRightRadius: 16 },
  title: { fontSize: 18, fontWeight: "700", marginBottom: 8 },
  row: { marginBottom: 12 },
  label: { fontSize: 13, color: "#555", marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, paddingHorizontal: 12, paddingVertical: 10, fontSize: 16,
    backgroundColor: "#FAFAFA",
  },
  grid2: { flexDirection: "row", gap: 12, marginBottom: 12 },
  col: { flex: 1 },
  actions: { flexDirection: "row", gap: 10, marginTop: 8 },
  btn: { flex: 1, paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  cancel: { backgroundColor: "#F3F4F6" },
  save: { backgroundColor: "#16A34A" },
  saveDisabled: { backgroundColor: "#9CA3AF" },
  btnText: { color: "white", fontWeight: "700" },
  btnTextAlt: { color: "#111827", fontWeight: "600" },
});
