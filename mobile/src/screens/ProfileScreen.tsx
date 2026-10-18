import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Linking,
  ActivityIndicator,
  Alert,
  ScrollView,
  AppState,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useAuth } from "../context/AuthContext";
import { startTelegramAuth, pollTelegramAuth } from "../api";
import {
  TelegramIcon,
  ShieldIcon,
  MedaxEmblem,
  UserIcon,
  BoltIcon,
  CertificateIcon,
} from "../components/Icons";

export function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const { customer, logout, loginWithToken } = useAuth();
  const [loading, setLoading] = useState(false);
  const [waitingTelegram, setWaitingTelegram] = useState(false);
  const [tgSession, setTgSession] = useState<any>(null);

  const pollIntervalRef = useRef<any>(null);
  const sessionIdRef = useRef<string | null>(null);

  useEffect(() => {
    return () => {
      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
    };
  }, []);

  // When app returns to foreground from Telegram, immediately check auth status
  useEffect(() => {
    const sub = AppState.addEventListener("change", async (state) => {
      if (state === "active" && sessionIdRef.current && waitingTelegram) {
        try {
          const res = await pollTelegramAuth(sessionIdRef.current);
          if (res.status === "confirmed" && res.token && res.customer) {
            if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
            setWaitingTelegram(false);
            sessionIdRef.current = null;
            await loginWithToken(res.token, res.customer);
            Alert.alert("Xush kelibsiz! 🎉", `${res.customer.name}, siz tizimga kirdingiz.`);
          }
        } catch {}
      }
    });
    return () => sub.remove();
  }, [waitingTelegram]);

  const openTelegramApp = async (sess: any) => {
    const deepLink = `tg://resolve?domain=${sess.botUsername || "MedaxAuthbot"}&start=auth_${sess.sessionId}`;
    const canOpen = await Linking.canOpenURL(deepLink).catch(() => false);
    if (canOpen) {
      await Linking.openURL(deepLink);
    } else {
      await Linking.openURL(sess.startUrl);
    }
  };

  const handleTelegramLogin = async () => {
    setLoading(true);
    try {
      const sess = await startTelegramAuth();
      setTgSession(sess);
      setWaitingTelegram(true);
      sessionIdRef.current = sess.sessionId;

      await openTelegramApp(sess);

      if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);

      pollIntervalRef.current = setInterval(async () => {
        try {
          const res = await pollTelegramAuth(sess.sessionId);
          if (res.status === "confirmed" && res.token && res.customer) {
            clearInterval(pollIntervalRef.current);
            setWaitingTelegram(false);
            sessionIdRef.current = null;
            await loginWithToken(res.token, res.customer);
            Alert.alert("Xush kelibsiz! 🎉", `${res.customer.name}, siz tizimga kirdingiz.`);
          }
        } catch {}
      }, 2000);

      setTimeout(() => {
        if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
        setWaitingTelegram(false);
        sessionIdRef.current = null;
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
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
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
              <Text style={styles.infoLabel}>Autentifikatsiya:</Text>
              <View style={{ flexDirection: "row", alignItems: "center", gap: 5 }}>
                <TelegramIcon size={14} color="#0284c7" />
                <Text style={styles.infoValue}>Telegram orqali tasdiqlangan</Text>
              </View>
            </View>
            <View style={[styles.infoRow, { marginTop: 8 }]}>
              <Text style={styles.infoLabel}>Holati:</Text>
              <Text style={[styles.infoValue, { color: "#059669" }]}>Faol mijoz</Text>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>Profildan chiqish</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Foydalanuvchi kirmagan holat */
        <View style={styles.loginCard}>
          <View style={styles.emblemWrap}>
            <MedaxEmblem size={56} />
          </View>
          <Text style={styles.loginTitle}>Shaxsiy kabinetga kirish</Text>
          <Text style={styles.loginSub}>
            Buyurtmalaringizni kuzatish va tezkor xarid qilish uchun Telegram orqali 1-klikda kiring
          </Text>

          {!waitingTelegram ? (
            <TouchableOpacity
              style={styles.telegramBtn}
              onPress={handleTelegramLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.btnInner}>
                  <TelegramIcon size={20} color="#ffffff" />
                  <Text style={styles.telegramBtnText}>Telegram orqali kirish</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingBox}>
              <ActivityIndicator color="#0284c7" size="small" style={{ marginBottom: 10 }} />
              <Text style={styles.waitingTitle}>Telegram bot kutilmoqda...</Text>
              <Text style={styles.waitingDesc}>
                Botda <Text style={{ fontWeight: "800", color: "#0284c7" }}>«📱 Telefon raqamni yuborish»</Text> tugmasini bosing
              </Text>
              {tgSession && (
                <TouchableOpacity
                  style={styles.reopenBtn}
                  onPress={() => openTelegramApp(tgSession)}
                >
                  <Text style={styles.reopenBtnText}>Botni qayta ochish →</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setWaitingTelegram(false);
                }}
              >
                <Text style={styles.cancelText}>Bekor qilish</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={styles.benefitList}>
            <View style={styles.benefitRow}>
              <BoltIcon size={16} color="#0284c7" />
              <Text style={styles.benefitItem}>SMS kutmasdan bir zumda tasdiqlash</Text>
            </View>
            <View style={styles.benefitRow}>
              <ShieldIcon size={16} color="#059669" />
              <Text style={styles.benefitItem}>100% xavfsiz va rasmiy avtorizatsiya</Text>
            </View>
            <View style={styles.benefitRow}>
              <CertificateIcon size={16} color="#0284c7" />
              <Text style={styles.benefitItem}>Kafolatli tibbiy uskunalar xaridi</Text>
            </View>
          </View>
        </View>
      )}

      {/* Kontaktlar va Do'kon manzili */}
      <View style={styles.contactCard}>
        <Text style={styles.contactCardTitle}>Medax aloqa markazi</Text>
        <Text style={styles.contactDesc}>
          Savollar, takliflar yoki servis xizmati uchun biz bilan bog'laning:
        </Text>

        <TouchableOpacity
          style={styles.contactItemRow}
          onPress={() => Linking.openURL("tel:+998932119785")}
        >
          <Text style={styles.contactItemIcon}>📞</Text>
          <View>
            <Text style={styles.contactItemTitle}>Aloqa telefoni</Text>
            <Text style={styles.contactItemValue}>+998 93 211 97 85</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.contactItemRow}
          onPress={() => Linking.openURL("https://t.me/medax_uz")}
        >
          <View style={{ marginRight: 2 }}>
            <TelegramIcon size={18} color="#0284c7" />
          </View>
          <View>
            <Text style={styles.contactItemTitle}>Rasmiy Telegram kanal</Text>
            <Text style={styles.contactItemValue}>@medax_uz</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.contactItemRow}>
          <Text style={styles.contactItemIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={styles.contactItemTitle}>Do'kon va ombor</Text>
            <Text style={styles.contactItemValue}>
              Namangan viloyati, Namangan sh., Ozod MFY, Abu Rayhon Beruniy 2-uy
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  content: { padding: 16, paddingBottom: 36 },
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
  emblemWrap: {
    marginBottom: 14,
  },
  loginTitle: { fontSize: 20, fontWeight: "900", color: "#0f172a", marginBottom: 6 },
  loginSub: { fontSize: 13, color: "#64748b", textAlign: "center", lineHeight: 19, marginBottom: 20 },
  telegramBtn: {
    width: "100%",
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#0284c7",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 3,
  },
  btnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  telegramBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  benefitList: { marginTop: 20, width: "100%", borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 14, gap: 8 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitItem: { fontSize: 12.5, color: "#475569", fontWeight: "600" },
  waitingBox: { alignItems: "center", paddingVertical: 10, width: "100%" },
  waitingTitle: { fontSize: 15, fontWeight: "800", color: "#0284c7", marginBottom: 4 },
  waitingDesc: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 14, lineHeight: 18 },
  reopenBtn: { backgroundColor: "#e0f2fe", paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginBottom: 12 },
  reopenBtnText: { color: "#0284c7", fontWeight: "800", fontSize: 13 },
  cancelText: { color: "#94a3b8", fontSize: 13, fontWeight: "600" },
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
  avatarText: { fontSize: 28, color: "#ffffff", fontWeight: "900" },
  userName: { fontSize: 20, fontWeight: "900", color: "#0f172a", marginBottom: 4 },
  userPhone: { fontSize: 14, color: "#64748b", fontWeight: "600" },
  orgBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 12, paddingVertical: 4, borderRadius: 8, marginTop: 8 },
  orgText: { fontSize: 12, color: "#334155", fontWeight: "700" },
  infoBox: { width: "100%", marginTop: 20, backgroundColor: "#f8fafc", borderRadius: 14, padding: 14, borderWidth: 1, borderColor: "#e2e8f0" },
  infoTitle: { fontSize: 13.5, fontWeight: "800", color: "#334155", marginBottom: 10 },
  infoRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  infoLabel: { fontSize: 12.5, color: "#64748b", fontWeight: "600" },
  infoValue: { fontSize: 12.5, color: "#0284c7", fontWeight: "700" },
  logoutBtn: { width: "100%", marginTop: 20, backgroundColor: "#fee2e2", paddingVertical: 13, borderRadius: 12, alignItems: "center" },
  logoutBtnText: { color: "#dc2626", fontWeight: "800", fontSize: 14 },
  contactCard: {
    backgroundColor: "#ffffff",
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  contactCardTitle: { fontSize: 16, fontWeight: "900", color: "#0f172a", marginBottom: 4 },
  contactDesc: { fontSize: 12, color: "#64748b", marginBottom: 14, lineHeight: 17 },
  contactItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
  },
  contactItemIcon: { fontSize: 18 },
  contactItemTitle: { fontSize: 11, color: "#64748b", fontWeight: "600" },
  contactItemValue: { fontSize: 13, color: "#0f172a", fontWeight: "700", marginTop: 1 },
});
