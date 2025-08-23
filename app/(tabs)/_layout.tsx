import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import Feather from '@expo/vector-icons/Feather';
import { COLORS } from "../../constants/Colors";
import SimpleLineIcons from "@expo/vector-icons/SimpleLineIcons";
import MaterialCommunityIcons from '@expo/vector-icons/MaterialCommunityIcons';

const TabsLayout = () => {
  const { isSignedIn} = useAuth();


  if (!isSignedIn) return <Redirect href={"/(auth)/sign-up"} />;

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: COLORS.primary,
        tabBarInactiveTintColor: COLORS.textLight,
        tabBarStyle: {
          backgroundColor: COLORS.white,
          borderTopColor: COLORS.border,
          borderTopWidth: 1,
          paddingBottom: 8,
          paddingTop: 8,
          height: 80,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: "Dashboard",
          tabBarIcon: ({ color, size }) => <Feather name="home" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="products"
        options={{
          title: "Products",
          tabBarIcon: ({ color, size }) => <Feather name="box" size={size} color={color} />,
        }}
      />
      <Tabs.Screen
        name="sales"
        options={{
          title: "Sales",
          tabBarIcon: ({ color, size }) => <Feather name="shopping-cart" size={size} color={color} />,
        }}
          />
          <Tabs.Screen
        name="customers"
        options={{
          title: "Customers",
            tabBarIcon: ({ color, size }) => <SimpleLineIcons name = "people" size = { size } color = { color } />,
        }}
      /><Tabs.Screen
        name="reports"
        options={{
          title: "Reports",
          tabBarIcon: ({ color, size }) => <MaterialCommunityIcons name="google-analytics" size={size} color={color} />,
        }}
      />
    </Tabs>
  );
};
export default TabsLayout;