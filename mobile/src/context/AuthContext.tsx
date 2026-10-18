import React, { createContext, useContext, useEffect, useState } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Customer, fetchCustomerProfile, TOKEN_KEY } from "../api";

interface AuthContextType {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
  loginWithToken: (newToken: string, customerData: Customer) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    AsyncStorage.getItem(TOKEN_KEY).then((savedToken) => {
      if (savedToken) {
        setToken(savedToken);
        fetchCustomerProfile().then((profile) => {
          if (profile) setCustomer(profile);
          setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });
  }, []);

  const loginWithToken = async (newToken: string, customerData: Customer) => {
    await AsyncStorage.setItem(TOKEN_KEY, newToken);
    setToken(newToken);
    setCustomer(customerData);
  };

  const logout = async () => {
    await AsyncStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setCustomer(null);
  };

  const refreshProfile = async () => {
    const profile = await fetchCustomerProfile();
    if (profile) setCustomer(profile);
  };

  return (
    <AuthContext.Provider
      value={{
        customer,
        token,
        loading,
        loginWithToken,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
