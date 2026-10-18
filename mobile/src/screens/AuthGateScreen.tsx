import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  AppState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { startTelegramAuth, pollTelegramAuth } from "../api";
import { MedaxEmblem, TelegramIcon } from "../components/Icons";

interface AuthGateScreenProps {
  onContinue: () => void;
}

export function AuthGateScreen({ onContinue }: AuthGateScreenProps) {
  const insets = useSafeAreaInsets();
  const { loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [waiting, setWaiting] = useState(false);
  const [tgSession, setTgSession] = useState<any>(null);
  const intervalRef = useRef<any>(null);

  // App holati o'zgarganda (Telegramdan qaytganda) avtomatik tekshirish
  useEffect(() => {
    const subscription = AppState.addEventListener("change", (nextState) => {
      if (nextState === "active" && tgSession?.sessionId) {
        checkAuthOnce(tgSession.sessionId);
      }
    });
    return () => {
      subscription.remove();
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [tgSession]);

  const checkAuthOnce = async (sessionId: string) => {
    try {
      const res = await pollTelegramAuth(sessionId);
      if (res.status === "confirmed" && res.token && res.customer) {
        if (intervalRef.current) clearInterval(intervalRef.current);
        setWaiting(false);
        await loginWithToken(res.token, res.customer);
        Alert.alert("Xush kelibsiz!", `${res.customer.name}, tizimga muvaffaqiyatli kirdingiz.`);
        onContinue();
      }
    } catch {}
  };

  const handleStartTelegram = async () => {
    setLoading(true);
    try {
      const sess = await startTelegramAuth();
      setTgSession(sess);
      setWaiting(true);

      const bot = sess.botUsername || "MedaxAuthbot";
      const nativeUrl = `tg://resolve?domain=${bot}&start=auth_${sess.sessionId}`;
      const webUrl = sess.startUrl || `https://t.me/${bot}?start=auth_${sess.sessionId}`;

      const canOpen = await Linking.canOpenURL(nativeUrl).catch(() => false);
      if (canOpen) {
        await Linking.openURL(nativeUrl);
      } else {
        await Linking.openURL(webUrl);
      }

      // Interval orqali tekshirib turamiz
      if (intervalRef.current) clearInterval(intervalRef.current);
      intervalRef.current = setInterval(() => {
        checkAuthOnce(sess.sessionId);
      }, 2000);
    } catch (err: any) {
      Alert.alert("Xatolik", err?.message || "Telegram sessiyasini ochishda xatolik");
      setWaiting(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + 20, paddingBottom: Math.max(insets.bottom, 20) }]}>
      {/* Brand Center Header */}
      <View style={styles.topSection}>
        <MedaxEmblem size={64} />
        <View style={styles.brandTitleWrap}>
          <Text style={styles.brandMed}>Med</Text>
          <Text style={styles.brandAx}>ax</Text>
        </View>
        <Text style={styles.tagline}>RASMIY TIBBIY USKUNALAR MARKAZI</Text>
      </View>

      {/* Main Auth Card */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Shaxsiy kabinetga ulanish</Text>
        <Text style={styles.cardDesc}>
          Buyurtmalarni tezkor kuzatish, hisob-faktura va kafolat hujjatlarini olish uchun Telegram orqali kiring.
        </Text>

        {!waiting ? (
          <TouchableOpacity
            style={styles.tgBtn}
            onPress={handleStartTelegram}
            disabled={loading}
            activeOpacity={0.88}
          >
            {loading ? (
              <ActivityIndicator color="#ffffff" />
            ) : (
              <View style={styles.tgBtnContent}>
                <TelegramIcon size={22} color="#ffffff" />
                <Text style={styles.tgBtnText}>Telegram orqali 1-klikda kirish</Text>
              </View>
            )}
          </TouchableOpacity>
        ) : (
          <View style={styles.waitingContainer}>
            <ActivityIndicator size="small" color="#0284c7" style={{ marginBottom: 10 }} />
            <Text style={styles.waitingTitle}>Telegram bot kutilmoqda...</Text>
            <Text style={styles.waitingDesc}>
              Ochilgan botda <Text style={{ fontWeight: "800", color: "#0284c7" }}>«📱 Telefon raqamni yuborish»</Text> tugmasini bosing.
            </Text>

            <TouchableOpacity
              style={styles.verifyBtn}
              onPress={() => tgSession && checkAuthOnce(tgSession.sessionId)}
            >
              <Text style={styles.verifyBtnText}>✅ Tasdiqladim, tekshirish</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.reopenLink}
              onPress={() => tgSession && Linking.openURL(tgSession.startUrl)}
            >
              <Text style={styles.reopenText}>Botni qayta ochish →</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.benefitsRow}>
          <Text style={styles.benefitText}>🔒 100% xavfsiz va tezkor</Text>
          <Text style={styles.benefitText}>⚡ SMS kutmasdan tasdiqlash</Text>
        </View>
      </View>

      {/* Bottom Guest Continue */}
      <View style={styles.bottomSection}>
        <TouchableOpacity style={styles.guestBtn} onPress={onContinue}>
          <Text style={styles.guestBtnText}>Ilovaga o'tish (Mehmon sifatida) →</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", justifyContent: "space-between", paddingHorizontal: 20 },
  topSection: { alignItems: "center", marginTop: 20 },
  brandTitleWrap: { flexDirection: "row", marginTop: 12 },
  brandMed: { fontSize: 28, fontWeight: "900", color: "#0284c7" },
  brandAx: { fontSize: 28, fontWeight: "900", color: "#0f172a" },
  tagline: { fontSize: 9, fontWeight: "800", color: "#64748b", letterSpacing: 1, marginTop: 2 },

  card: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#0f172a",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 14,
    elevation: 3,
  },
  cardTitle: { fontSize: 19, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  cardDesc: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 19, marginBottom: 22 },

  tgBtn: {
    width: "100%",
    backgroundColor: "#229ED9",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    shadowColor: "#229ED9",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 4,
  },
  tgBtnContent: { flexDirection: "row", alignItems: "center", gap: 10 },
  tgBtnText: { color: "#ffffff", fontSize: 14.5, fontWeight: "800" },

  waitingContainer: { width: "100%", alignItems: "center" },
  waitingTitle: { fontSize: 15, fontWeight: "800", color: "#0284c7", marginBottom: 4 },
  waitingDesc: { fontSize: 12.5, color: "#64748b", textAlign: "center", lineHeight: 18, marginBottom: 14 },
  verifyBtn: { backgroundColor: "#0284c7", width: "100%", paddingVertical: 12, borderRadius: 12, alignItems: "center", marginBottom: 8 },
  verifyBtnText: { color: "#ffffff", fontSize: 13.5, fontWeight: "800" },
  reopenLink: { paddingVertical: 4 },
  reopenText: { fontSize: 12.5, color: "#0284c7", fontWeight: "700" },

  benefitsRow: { marginTop: 18, width: "100%", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 12, flexDirection: "row", justifyContent: "space-around" },
  benefitText: { fontSize: 11, color: "#64748b", fontWeight: "600" },

  bottomSection: { alignItems: "center", marginBottom: 8 },
  guestBtn: { paddingVertical: 10, paddingHorizontal: 16 },
  guestBtnText: { fontSize: 13.5, color: "#0284c7", fontWeight: "700" },
});
