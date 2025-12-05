import { useAuth } from "@clerk/clerk-expo";
import { Redirect, Tabs } from "expo-router";
import Feather from "@expo/vector-icons/Feather";
import MaterialCommunityIcons from "@expo/vector-icons/MaterialCommunityIcons";

const ACTIVE_COLOR = "#16A34A"; // Tailwind's green-600
const INACTIVE_COLOR = "#9CA3AF"; // gray-400
const BG_COLOR = "#FFFFFF"; // white background
const BORDER_COLOR = "#E5E7EB"; // light gray border

const TabsLayout = () => {
  const { isSignedIn } = useAuth();
  if (!isSignedIn) return <Redirect href={"/(auth)/sign-up"} />;

  return (
    <Tabs
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarActiveTintColor: ACTIVE_COLOR,
        tabBarInactiveTintColor: INACTIVE_COLOR,
        tabBarStyle: {
          backgroundColor: BG_COLOR,
          borderTopColor: BORDER_COLOR,
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 8,
          paddingTop: 8,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "600",
        },
        tabBarIcon: ({ color, size }) => {
          let iconName: any;
          let IconComponent: any = Feather;

          if (route.name === "index") iconName = "home";
          else if (route.name === "products") iconName = "box";
          else if (route.name === "sales") iconName = "shopping-cart";
          else if (route.name === "reports") {
            iconName = "google-analytics";
            IconComponent = MaterialCommunityIcons;
          } else if (route.name === "customer") {
            iconName = "users"; // Feather's users icon
          }

          return <IconComponent name={iconName} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="index" options={{ title: "Dashboard" }} />
      <Tabs.Screen name="products" options={{ title: "Products" }} />
      <Tabs.Screen name="sales" options={{ title: "Sales" }} />
      <Tabs.Screen name="reports" options={{ title: "Reports" }} />
      <Tabs.Screen name="customer" options={{ title: "Customers" }} />
    </Tabs>
  );
};

export default TabsLayout;
