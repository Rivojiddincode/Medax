import React, { createContext, useContext, useEffect, useState } from "react";
import { ConfirmationResult } from "firebase/auth";
import { sendFirebasePhoneOtp, translateFirebaseError } from "./firebase";

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  organization?: string | null;
  avatar?: string | null;
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
  sendOtp: (phone: string, captchaToken?: string) => Promise<{ ok: boolean; resendIn: number }>;
  verifyOtp: (data: { phone: string; code: string; name?: string; organization?: string; password?: string }) => Promise<{ ok: boolean; token: string; customer: Customer }>;
  sendFirebaseOtp: (phone: string, containerId?: string) => Promise<{ ok: boolean; resendIn: number }>;
  verifyFirebaseOtp: (data: { code: string; name?: string; organization?: string; password?: string }) => Promise<{ ok: boolean; token: string; customer: Customer }>;
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
  const [firebaseConfirmation, setFirebaseConfirmation] = useState<ConfirmationResult | null>(null);

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

  // Firebase orqali telefon raqamga SMS kod jo'natish
  const sendFirebaseOtp = async (phone: string, containerId?: string) => {
    try {
      const cr = await sendFirebasePhoneOtp(phone, containerId || "firebase-recaptcha-container");
      setFirebaseConfirmation(cr);
      return { ok: true, resendIn: 60 };
    } catch (fbErr: any) {
      console.error("Firebase SMS yuborishda xatolik:", fbErr);
      const friendly = translateFirebaseError(fbErr);
      throw new Error(friendly);
    }
  };

  // Firebase SMS tasdiqlash kodi orqali autentifikatsiya
  const verifyFirebaseOtp = async (params: {
    code: string;
    name?: string;
    organization?: string;
    password?: string;
  }) => {
    if (!firebaseConfirmation) {
      throw new Error("Tasdiqlash kodi topilmadi yoki muddati eskirgan. Qaytadan kod oling.");
    }

    try {
      const cred = await firebaseConfirmation.confirm(params.code);
      const idToken = await cred.user.getIdToken();

      const res = await fetch("/api/customer/auth/firebase-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          idToken,
          name: params.name,
          organization: params.organization,
          password: params.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Firebase orqali tasdiqlashda server xatoligi yuz berdi");
      }

      saveToken(data.token);
      setCustomer(data.customer);
      closeAuthModal();
      return data;
    } catch (err: any) {
      console.error("Firebase verify xatosi:", err);
      const friendly = translateFirebaseError(err);
      throw new Error(friendly);
    }
  };

  // Umumiy SMS yuborish (Firebase Phone Auth)
  const sendOtp = async (phone: string, _captchaToken?: string) => {
    return await sendFirebaseOtp(phone);
  };

  // Umumiy kodni tasdiqlash
  const verifyOtp = async (params: {
    phone: string;
    code: string;
    name?: string;
    organization?: string;
    password?: string;
  }) => {
    if (firebaseConfirmation) {
      return await verifyFirebaseOtp({
        code: params.code,
        name: params.name,
        organization: params.organization,
        password: params.password,
      });
    }

    const res = await fetch("/api/customer/auth/verify-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Kodni tasdiqlashda xatolik");
    }
    saveToken(data.token);
    setCustomer(data.customer);
    closeAuthModal();
    return data;
  };

  const loginWithPassword = async (phone: string, password: string) => {
    const res = await fetch("/api/customer/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, password }),
    });
    const data = await res.json();
    if (!res.ok) {
      throw new Error(data.error || "Telefon raqam yoki parol noto'g'ri");
    }
    saveToken(data.token);
    setCustomer(data.customer);
    closeAuthModal();
    return data;
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
        sendFirebaseOtp,
        verifyFirebaseOtp,
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
