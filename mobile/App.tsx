import React, { useState, useEffect } from "react";
import { View, ActivityIndicator } from "react-native";
import { registerRootComponent } from "expo";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AuthProvider } from "./src/context/AuthContext";
import { CartProvider } from "./src/context/CartContext";
import { AppNavigator } from "./src/navigation/AppNavigator";
import { OnboardingScreen, ONBOARDING_KEY } from "./src/screens/OnboardingScreen";
import { AuthGateScreen } from "./src/screens/AuthGateScreen";
import { MedaxEmblem } from "./src/components/Icons";

export default function App() {
  const [initLoading, setInitLoading] = useState(true);
  const [step, setStep] = useState<"onboarding" | "auth" | "app">("app");

  useEffect(() => {
    AsyncStorage.getItem(ONBOARDING_KEY)
      .then((seen) => {
        if (!seen) {
          setStep("onboarding");
        } else {
          setStep("app");
        }
      })
      .catch(() => setStep("app"))
      .finally(() => setInitLoading(false));
  }, []);

  if (initLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" }}>
        <MedaxEmblem size={64} />
        <ActivityIndicator size="small" color="#0284c7" style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <AuthProvider>
        <CartProvider>
          <StatusBar style="dark" />
          {step === "onboarding" ? (
            <OnboardingScreen onFinish={() => setStep("auth")} />
          ) : step === "auth" ? (
            <AuthGateScreen onContinue={() => setStep("app")} />
          ) : (
            <NavigationContainer>
              <AppNavigator />
            </NavigationContainer>
          )}
        </CartProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}

registerRootComponent(App);
