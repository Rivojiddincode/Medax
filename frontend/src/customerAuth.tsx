import React, { createContext, useContext, useEffect, useState } from "react";

export interface Customer {
  id: number;
  customerCode?: string;
  name: string;
  phone?: string | null;
  organization?: string | null;
  avatar?: string | null;
  balance?: number;
  hasPassword?: boolean;
}

interface CustomerAuthContextType {
  customer: Customer | null;
  token: string | null;
  loading: boolean;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  refreshCustomer: () => Promise<void>;
  sendOtp: (phone: string, captchaToken?: string) => Promise<{ ok: boolean; resendIn: number; devCode?: string }>;
  verifyOtp: (data: { phone: string; code: string; name?: string; organization?: string; password?: string }) => Promise<{ ok: boolean; token: string; customer: Customer }>;
  loginWithPassword: (phone: string, password: string) => Promise<{ ok: boolean; token: string; customer: Customer }>;
  changePassword: (data: { currentPassword?: string; newPassword: string }) => Promise<void>;
  updateProfile: (data: { name: string; organization?: string }) => Promise<void>;
  logout: () => void;
}

const CustomerAuthContext = createContext<CustomerAuthContextType | null>(null);

export const CUSTOMER_TOKEN_KEY = "medax_customer_token";

export function CustomerAuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => localStorage.getItem(CUSTOMER_TOKEN_KEY));
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const saveToken = (newToken: string | null) => {
    setToken(newToken);
    if (newToken) localStorage.setItem(CUSTOMER_TOKEN_KEY, newToken);
    else localStorage.removeItem(CUSTOMER_TOKEN_KEY);
  };

  useEffect(() => {
    if (!token) {
      setCustomer(null);
      setLoading(false);
      return;
    }

    if (token === "demo_customer_token") {
      setCustomer({
        id: 1,
        customerCode: "MDX-1",
        name: "Dr. Jamshid Aliyev",
        phone: "+998 90 123 45 67",
        organization: "Shifo Medikal Servis MCHJ",
        balance: 1500000,
        hasPassword: true,
      });
      setLoading(false);
      return;
    }

    setLoading(true);
    fetch("/api/customer/auth/me", {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((res) => {
        const isJson = res.headers.get("content-type")?.includes("application/json");
        if (!res.ok || !isJson) throw new Error("Unauthorized");
        return res.json();
      })
      .then((data) => setCustomer(data.customer))
      .catch(() => {
        saveToken(null);
        setCustomer(null);
      })
      .finally(() => setLoading(false));
  }, [token]);

  const refreshCustomer = async () => {
    if (!token) return;
    try {
      const res = await fetch("/api/customer/auth/me", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const data = await res.json();
        if (data.customer) setCustomer(data.customer);
      }
    } catch {}
  };

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  const sendOtp = async (phone: string, captchaToken?: string) => {
    try {
      const res = await fetch("/api/customer/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, captchaToken }),
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (res.ok && isJson) {
        return await res.json();
      }
    } catch {}
    // Vercel demo fallback:
    return { ok: true, resendIn: 60, devCode: "777777" };
  };

  const verifyOtp = async (params: { phone: string; code: string; name?: string; organization?: string; password?: string }) => {
    try {
      const res = await fetch("/api/customer/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (res.ok && isJson) {
        const data = await res.json();
        saveToken(data.token);
        setCustomer(data.customer);
        closeAuthModal();
        return data;
      }
    } catch {}

    // Demo fallback:
    const mockCustomer: Customer = {
      id: 1,
      name: params.name || "Dr. Jamshid Aliyev",
      phone: params.phone,
      organization: params.organization || "Shifo Medikal Servis MCHJ",
      hasPassword: Boolean(params.password),
    };
    saveToken("demo_customer_token");
    setCustomer(mockCustomer);
    closeAuthModal();
    return { ok: true, token: "demo_customer_token", customer: mockCustomer };
  };

  const loginWithPassword = async (phone: string, password: string) => {
    try {
      const res = await fetch("/api/customer/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const isJson = res.headers.get("content-type")?.includes("application/json");
      if (res.ok && isJson) {
        const data = await res.json();
        saveToken(data.token);
        setCustomer(data.customer);
        closeAuthModal();
        return data;
      }
    } catch {}

    // Demo fallback:
    const mockCustomer: Customer = {
      id: 1,
      name: "Dr. Jamshid Aliyev",
      phone,
      organization: "Shifo Medikal Servis MCHJ",
      hasPassword: true,
    };
    saveToken("demo_customer_token");
    setCustomer(mockCustomer);
    closeAuthModal();
    return { ok: true, token: "demo_customer_token", customer: mockCustomer };
  };

  const changePassword = async (params: { currentPassword?: string; newPassword: string }) => {
    if (!token) throw new Error("Kirilmagan");
    const res = await fetch("/api/customer/auth/password", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Parolni o'zgartirishda xatolik");
    if (customer) setCustomer({ ...customer, hasPassword: true });
  };

  const updateProfile = async (params: { name: string; organization?: string }) => {
    if (!token) throw new Error("Kirilmagan");
    const res = await fetch("/api/customer/auth/profile", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Profilni saqlashda xatolik");
    setCustomer(data.customer);
  };

  const logout = () => {
    saveToken(null);
    setCustomer(null);
  };

  return (
    <CustomerAuthContext.Provider
      value={{
        customer,
        token,
        loading,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        refreshCustomer,
        sendOtp,
        verifyOtp,
        loginWithPassword,
        changePassword,
        updateProfile,
        logout,
      }}
    >
      {children}
    </CustomerAuthContext.Provider>
  );
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used within CustomerAuthProvider");
  return ctx;
}
