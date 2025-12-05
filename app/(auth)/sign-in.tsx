import { useSignIn } from "@clerk/clerk-expo";
import { useRouter } from "expo-router";
import { useState } from "react";
import {
  View,
  Text,
  Alert,
  TextInput,
  TouchableOpacity,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { KeyboardAwareScrollView } from "react-native-keyboard-aware-scroll-view";
import { Image } from "expo-image";

import { authStyles } from "../../assets/styles/auth.styles";
import { COLORS } from "../../constants/Colors";

const SignInScreen = () => {
  const router = useRouter();
  const { signIn, setActive, isLoaded } = useSignIn();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSignIn = async () => {
    if (!email || !password) {
      Alert.alert("Error", "Please fill in all fields");
      return;
    }

    if (!isLoaded) return;

    setLoading(true);

    try {
      const signInAttempt = await signIn.create({
        identifier: email,
        password,
      });

      if (signInAttempt.status === "complete") {
        await setActive({ session: signInAttempt.createdSessionId });
      } else {
        Alert.alert("Error", "Sign in failed. Please try again.");
      }
    } catch (err: any) {
      Alert.alert("Error", err.errors?.[0]?.message || "Sign in failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={authStyles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={authStyles.scrollContent}
        enableOnAndroid={true}
        extraScrollHeight={40}
        extraHeight={50}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* LOGO */}
        <View style={authStyles.imageContainer}>
          <Image
            source={require("../../assets/images/negadew_logo.png")}
            style={authStyles.image}
            contentFit="contain"
          />
        </View>

        <Text style={authStyles.title}>Welcome Back</Text>

        {/* FORM */}
        <View style={authStyles.formContainer}>
          {/* Email Input */}
          <View style={authStyles.inputContainer}>
            <TextInput
              style={authStyles.textInput}
              placeholder="Enter email"
              placeholderTextColor={COLORS.textLight}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>

          {/* Password Input */}
          <View style={authStyles.inputContainer}>
            <TextInput
              style={authStyles.textInput}
              placeholder="Enter password"
              placeholderTextColor={COLORS.textLight}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
              autoCapitalize="none"
            />

            <TouchableOpacity
              style={authStyles.eyeButton}
              onPress={() => setShowPassword(!showPassword)}
              activeOpacity={0.7}
            >
              <Ionicons
                name={showPassword ? "eye-outline" : "eye-off-outline"}
                size={20}
                color={COLORS.textLight}
              />
            </TouchableOpacity>
          </View>

          {/* Submit Button */}
          <TouchableOpacity
            style={[authStyles.authButton, loading && authStyles.buttonDisabled]}
            onPress={handleSignIn}
            disabled={loading}
            activeOpacity={0.8}
          >
            <Text style={authStyles.buttonText}>
              {loading ? "Signing In..." : "Sign In"}
            </Text>
          </TouchableOpacity>

          {/* Sign Up Link */}
          <TouchableOpacity
            style={authStyles.linkContainer}
            onPress={() => router.push("/(auth)/sign-up")}
          >
            <Text style={authStyles.linkText}>
              Don’t have an account?{" "}
              <Text style={authStyles.link}>Sign up</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </KeyboardAwareScrollView>
    </View>
  );
};

export default SignInScreen;
