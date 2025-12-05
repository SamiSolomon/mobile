import React from "react";
import { View, Pressable, Text, StyleSheet } from "react-native";

type Props = {
  tabs: string[];
  activeIndex: number;
  onChange: (i: number) => void;
};

export default function TabHeader({ tabs, activeIndex, onChange }: Props) {
  return (
    <View style={styles.row}>
      {tabs.map((tab, i) => {
        const isActive = i === activeIndex;
        return (
          <Pressable
            key={tab}
            onPress={() => onChange(i)}
            style={[styles.btn, isActive && styles.btnActive]}
          >
            <Text style={isActive ? styles.textActive : styles.text}>
              {tab}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-around",
    padding: 8,
    backgroundColor: "#F3F4F6",
    borderRadius: 12,
    margin: 12,
  },
  btn: {
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 20,
  },
  btnActive: {
    backgroundColor: "#16A34A",
  },
  text: { color: "#374151", fontWeight: "600" },
  textActive: { color: "#fff", fontWeight: "700" },
});
