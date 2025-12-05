import { Redirect, Stack } from "expo-router";
import { useAuth } from "@clerk/clerk-expo";

export default function AuthRoutesLayout() {
  const { isSignedIn, isLoaded } = useAuth();

  // Avoid flicker / wrong redirects while auth is loading
  if (!isLoaded) {
    return null;
  }

  // If the user is already signed in, kick them out of the auth stack
  if (isSignedIn) {
    return <Redirect href="/" />;
  }

  // Auth stack for signed-out users
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Only sign-in screen since you removed sign-up */}
      <Stack.Screen name="sign-in" />
      {/* If you ever add them back, you can declare: */}
      {/* <Stack.Screen name="sign-up" /> */}
      {/* <Stack.Screen name="verify-email" /> */}
    </Stack>
  );
}
