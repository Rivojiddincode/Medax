import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
} from "react-native";
import { useAuth } from "../context/AuthContext";
import { startTelegramAuth, pollTelegramAuth } from "../api";

export function ProfileScreen() {
  const { customer, logout, loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [waitingTelegram, setWaitingTelegram] = useState(false);
  const [tgSession, setTgSession] = useState<any>(null);

  const handleTelegramLogin = async () => {
    setLoading(true);
    try {
      const sess = await startTelegramAuth();
      setTgSession(sess);
      setWaitingTelegram(true);

      // Telefoningizdagi Telegram ilovasini ochamiz
      await Linking.openURL(sess.startUrl);

      // Tasdiqlanishini tekshirib turamiz
      const interval = setInterval(async () => {
        try {
          const res = await pollTelegramAuth(sess.sessionId);
          if (res.status === "confirmed" && res.token && res.customer) {
            clearInterval(interval);
            setWaitingTelegram(false);
            await loginWithToken(res.token, res.customer);
            Alert.alert("Xush kelibsiz!", `${res.customer.name}, siz tizimga kirdingiz.`);
          }
        } catch {}
      }, 2000);

      // 2 daqiqadan so'ng to'xtatamiz
      setTimeout(() => {
        clearInterval(interval);
        setWaitingTelegram(false);
      }, 120000);
    } catch (err: any) {
      Alert.alert("Xatolik", err.message || "Telegram sessiyasini ochishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {customer ? (
        /* Foydalanuvchi tizimga kirgan holat */
        <View style={styles.profileCard}>
          <View style={styles.avatarWrap}>
            <Text style={styles.avatarText}>
              {customer.name?.charAt(0)?.toUpperCase() || "M"}
            </Text>
          </View>
          <Text style={styles.userName}>{customer.name}</Text>
          {customer.phone && <Text style={styles.userPhone}>{customer.phone}</Text>}
          {customer.organization ? (
            <View style={styles.orgBadge}>
              <Text style={styles.orgText}>🏢 {customer.organization}</Text>
            </View>
          ) : null}

          <View style={styles.infoBox}>
            <Text style={styles.infoTitle}>Mijoz ma'lumotlari</Text>
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Holat:</Text>
              <Text style={styles.infoValue}>Tasdiqlangan mijoz ✅</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout}>
            <Text style={styles.logoutBtnText}>Chiqish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Foydalanuvchi kirmagan holat */
        <View style={styles.loginCard}>
          <Text style={styles.loginIcon}>🏥</Text>
          <Text style={styles.loginTitle}>Shaxsiy kabinetga kirish</Text>
          <Text style={styles.loginSub}>
            Buyurtmalaringizni kuzatish va xaridlarni boshqarish uchun Telegram orqali kiring
          </Text>

          {!waitingTelegram ? (
            <TouchableOpacity
              style={styles.telegramBtn}
              onPress={handleTelegramLogin}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <Text style={styles.telegramBtnText}>✈️ Telegram orqali 1-klikda kirish</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingBox}>
              <ActivityIndicator color="#0284c7" size="small" style={{ marginBottom: 10 }} />
              <Text style={styles.waitingTitle}>Telegram bot kutilmoqda...</Text>
              <Text style={styles.waitingDesc}>
                Ochilgan botda <b>«📱 Telefon raqamni yuborish»</b> tugmasini bosing
              </Text>
              {tgSession && (
                <TouchableOpacity
                  style={styles.reopenBtn}
                  onPress={() => Linking.openURL(tgSession.startUrl)}
                >
                  <Text style={styles.reopenBtnText}>Botni qayta ochish →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setWaitingTelegram(false)}>
                <Text style={styles.cancelText}>Bekor qilish</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.benefitList}>
            <Text style={styles.benefitItem}>⚡ SMS kutmasdan bir zumda kirish</Text>
            <Text style={styles.benefitItem}>🔒 Xavfsiz va 100% bepul</Text>
            <Text style={styles.benefitItem}>📱 Telefon raqamingiz bot orqali tasdiqlanadi</Text>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc", padding: 20 },
  loginCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 10,
    elevation: 2,
    marginTop: 20,
  },
  loginIcon: { fontSize: 44, marginBottom: 12 },
  loginTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  loginSub: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 20, marginBottom: 20 },
  telegramBtn: {
    width: "100%",
    backgroundColor: "#229ED9",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    shadowColor: "#229ED9",
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 3,
  },
  telegramBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
  benefitList: { marginTop: 24, width: "100%", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 16 },
  benefitItem: { fontSize: 12.5, color: "#475569", marginBottom: 8, fontWeight: "500" },
  waitingBox: { alignItems: "center", paddingVertical: 10, width: "100%" },
  waitingTitle: { fontSize: 15, fontWeight: "700", color: "#0284c7", marginBottom: 4 },
  waitingDesc: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 12 },
  reopenBtn: { backgroundColor: "#e0f2fe", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginBottom: 10 },
  reopenBtnText: { color: "#0284c7", fontWeight: "700", fontSize: 13 },
  cancelText: { color: "#94a3b8", fontSize: 13 },
  profileCard: { backgroundColor: "#ffffff", borderRadius: 24, padding: 24, alignItems: "center", borderWidth: 1, borderColor: "#e2e8f0", marginTop: 20 },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#0284c7", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, color: "#ffffff", fontWeight: "800" },
  userName: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  userPhone: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  orgBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  orgText: { fontSize: 12, color: "#334155", fontWeight: "600" },
  infoBox: { width: "100%", marginTop: 24, backgroundColor: "#f8fafc", borderRadius: 14, padding: 14 },
  infoTitle: { fontSize: 14, fontWeight: "700", color: "#334155", marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 13, color: "#64748b" },
  infoValue: { fontSize: 13, color: "#059669", fontWeight: "600" },
  logoutBtn: { width: "100%", marginTop: 20, backgroundColor: "#fee2e2", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  logoutBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
});
