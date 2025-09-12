import { Slot } from "expo-router";
import { ClerkProvider } from "@clerk/clerk-expo";
import { tokenCache } from "@clerk/clerk-expo/token-cache";
import SafeScreen from "../components/safeScreen";
import React, { useEffect } from 'react';
import { initializeDatabase } from "./db/clients";
import { initDB as initProductDB } from "./db/product";
import { initDB as initSalesDB } from "./db/sales";

export default function RootLayout() {

initProductDB();
initSalesDB();

  useEffect(() => {
    initializeDatabase()
      .then(() => console.log('Database initialized successfully'))
      .catch(err => console.error('Failed to initialize database:', err));
  }, []);

  return (
    <ClerkProvider tokenCache={tokenCache}>
      <SafeScreen>
        <Slot />
      </SafeScreen>
    </ClerkProvider>
  );
}