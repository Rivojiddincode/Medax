import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  ScrollView,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { startTelegramAuth, pollTelegramAuth } from "../api";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
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
    <ScrollView
      style={styles.container}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      showsVerticalScrollIndicator={false}
    >
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
            Buyurtmalaringizni kuzatish va tezkor buyurtma berish uchun Telegram orqali kiring
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
                <Text style={styles.telegramBtnText}>✈️ Telegram orqali kirish</Text>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingBox}>
              <ActivityIndicator color="#0284c7" size="small" style={{ marginBottom: 10 }} />
              <Text style={styles.waitingTitle}>Telegram bot kutilmoqda...</Text>
              <Text style={styles.waitingDesc}>
                Ochilgan botda <Text style={{ fontWeight: "700", color: "#0284c7" }}>«📱 Telefon raqamni yuborish»</Text> tugmasini bosing
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
            <Text style={styles.benefitItem}>⚡ SMS kutmasdan bir zumda tasdiqlash</Text>
            <Text style={styles.benefitItem}>🔒 Xavfsiz va 100% rasmiy</Text>
            <Text style={styles.benefitItem}>📱 Telefon raqamingiz bot orqali bog'lanadi</Text>
          </View>
        </View>
      )}

      {/* Kontaktlar qismi */}
      <View style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>Bog'lanish va qo'llab-quvvatlash</Text>
        <Text style={styles.contactItem}>📞 Telefon: +998 71 200-00-00</Text>
        <Text style={styles.contactItem}>💬 Telegram: @medax_admin</Text>
        <Text style={styles.contactItem}>📍 Manzil: Toshkent sh., Chilonzor tumani</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 32 },
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
    marginBottom: 16,
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
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  telegramBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  benefitList: { marginTop: 20, width: "100%", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 14 },
  benefitItem: { fontSize: 12, color: "#475569", marginBottom: 6, fontWeight: "500" },
  waitingBox: { alignItems: "center", paddingVertical: 10, width: "100%" },
  waitingTitle: { fontSize: 15, fontWeight: "700", color: "#0284c7", marginBottom: 4 },
  waitingDesc: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 12, lineHeight: 18 },
  reopenBtn: { backgroundColor: "#e0f2fe", paddingHorizontal: 16, paddingVertical: 8, borderRadius: 10, marginBottom: 10 },
  reopenBtnText: { color: "#0284c7", fontWeight: "700", fontSize: 13 },
  cancelText: { color: "#94a3b8", fontSize: 13 },
  profileCard: {
    backgroundColor: "#ffffff",
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 16,
  },
  avatarWrap: { width: 72, height: 72, borderRadius: 36, backgroundColor: "#0284c7", justifyContent: "center", alignItems: "center", marginBottom: 12 },
  avatarText: { fontSize: 28, color: "#ffffff", fontWeight: "800" },
  userName: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 4 },
  userPhone: { fontSize: 14, color: "#64748b", fontWeight: "500" },
  orgBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  orgText: { fontSize: 12, color: "#334155", fontWeight: "600" },
  infoBox: { width: "100%", marginTop: 20, backgroundColor: "#f8fafc", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  infoTitle: { fontSize: 13.5, fontWeight: "700", color: "#334155", marginBottom: 8 },
  infoRow: { flexDirection: "row", justifyContent: "space-between" },
  infoLabel: { fontSize: 13, color: "#64748b" },
  infoValue: { fontSize: 13, color: "#059669", fontWeight: "700" },
  logoutBtn: { width: "100%", marginTop: 20, backgroundColor: "#fee2e2", paddingVertical: 12, borderRadius: 12, alignItems: "center" },
  logoutBtnText: { color: "#dc2626", fontWeight: "700", fontSize: 14 },
  contactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contactCardTitle: { fontSize: 14, fontWeight: "800", color: "#0f172a", marginBottom: 8 },
  contactItem: { fontSize: 12.5, color: "#475569", marginBottom: 4 },
});
