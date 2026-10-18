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
  Image,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import { useAuth } from "../context/AuthContext";
import { useTheme } from "../context/ThemeContext";
import { useI18n, Language } from "../context/I18nContext";
import { startTelegramAuth, pollTelegramAuth, uploadCustomerAvatar, getImageUrl } from "../api";
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
  const { customer, logout, loginWithToken, refreshProfile } = useAuth();
  const { theme, colors, setTheme } = useTheme();
  const { lang, setLang, t } = useI18n();

  const [loading, setLoading] = useState(false);
  const [waitingTelegram, setWaitingTelegram] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
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
      Alert.alert(t("error"), err.message || "Telegram sessiyasini ochishda xatolik");
    } finally {
      setLoading(false);
    }
  };

  const pickAndUploadAvatar = async () => {
    try {
      const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!perm.granted) {
        Alert.alert("Ruxsat berilmadi", "Rasm tanlash uchun rasmlar galereyasiga ruxsat bering.");
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ["images"],
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.85,
      });

      if (!result.canceled && result.assets?.[0]?.uri) {
        setUploadingAvatar(true);
        const res = await uploadCustomerAvatar(result.assets[0].uri);
        setUploadingAvatar(false);
        if (res.ok) {
          await refreshProfile();
          Alert.alert("Muvaffaqiyatli", "Profil rasmingiz yangilandi!");
        } else {
          Alert.alert("Xatolik", res.error || "Rasm yuklashda xatolik yuz berdi");
        }
      }
    } catch (err: any) {
      setUploadingAvatar(false);
      Alert.alert("Xatolik", err.message || "Rasm tanlashda xatolik");
    }
  };

  // Foydalanuvchi ismining birinchi harfi yoki M (agar ismi * bo'lsa yoki bo'sh bo'lsa)
  const displayName = customer?.name && customer.name !== "*" ? customer.name : "Mijoz";
  const avatarLetter = displayName.charAt(0).toUpperCase();

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.bg }]}
      contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}
      showsVerticalScrollIndicator={false}
    >
      {customer ? (
        /* Foydalanuvchi tizimga kirgan holat */
        <View style={[styles.profileCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* Avatar with Photo & Camera button */}
          <TouchableOpacity
            style={styles.avatarContainer}
            onPress={pickAndUploadAvatar}
            activeOpacity={0.85}
          >
            {customer.avatar ? (
              <Image source={{ uri: getImageUrl(customer.avatar) }} style={styles.avatarImg} />
            ) : (
              <View style={[styles.avatarWrap, { backgroundColor: colors.primary }]}>
                <Text style={styles.avatarText}>{avatarLetter}</Text>
              </View>
            )}

            <View style={[styles.cameraBadge, { backgroundColor: colors.primary }]}>
              {uploadingAvatar ? (
                <ActivityIndicator size="small" color="#ffffff" />
              ) : (
                <Text style={styles.cameraIcon}>📷</Text>
              )}
            </View>
          </TouchableOpacity>

          <Text style={[styles.userName, { color: colors.text }]}>{displayName}</Text>
          {customer.phone && <Text style={[styles.userPhone, { color: colors.textMuted }]}>{customer.phone}</Text>}

          <TouchableOpacity style={styles.changePhotoBtn} onPress={pickAndUploadAvatar}>
            <Text style={[styles.changePhotoText, { color: colors.primary }]}>
              {t("profile_change_photo")}
            </Text>
          </TouchableOpacity>

          {/* Mijoz ma'lumotlari kartasi (tartibli va toza) */}
          <View style={[styles.infoBox, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <Text style={[styles.infoTitle, { color: colors.text }]}>{t("profile_info_title")}</Text>

            <View style={styles.infoRow}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t("profile_auth_type")}:</Text>
              <View style={styles.pillBadgeBlue}>
                <TelegramIcon size={13} color="#0284c7" />
                <Text style={styles.pillTextBlue}>{t("profile_auth_val")}</Text>
              </View>
            </View>

            <View style={[styles.infoRow, { marginTop: 10 }]}>
              <Text style={[styles.infoLabel, { color: colors.textMuted }]}>{t("profile_status")}:</Text>
              <View style={styles.pillBadgeGreen}>
                <Text style={styles.pillTextGreen}>✓ {t("profile_status_active")}</Text>
              </View>
            </View>
          </View>

          <TouchableOpacity style={styles.logoutBtn} onPress={logout} activeOpacity={0.8}>
            <Text style={styles.logoutBtnText}>{t("profile_logout")}</Text>
          </TouchableOpacity>
        </View>
      ) : (
        /* Foydalanuvchi kirmagan holat */
        <View style={[styles.loginCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={styles.emblemWrap}>
            <MedaxEmblem size={56} />
          </View>
          <Text style={[styles.loginTitle, { color: colors.text }]}>{t("profile_title")}</Text>
          <Text style={[styles.loginSub, { color: colors.textMuted }]}>
            {t("profile_login_sub")}
          </Text>

          {!waitingTelegram ? (
            <TouchableOpacity
              style={[styles.telegramBtn, { backgroundColor: colors.primary }]}
              onPress={handleTelegramLogin}
              disabled={loading}
              activeOpacity={0.88}
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" />
              ) : (
                <View style={styles.btnInner}>
                  <TelegramIcon size={20} color="#ffffff" />
                  <Text style={styles.telegramBtnText}>{t("profile_tg_btn")}</Text>
                </View>
              )}
            </TouchableOpacity>
          ) : (
            <View style={styles.waitingBox}>
              <ActivityIndicator color={colors.primary} size="small" style={{ marginBottom: 10 }} />
              <Text style={[styles.waitingTitle, { color: colors.primary }]}>{t("profile_waiting_bot")}</Text>
              <Text style={[styles.waitingDesc, { color: colors.textMuted }]}>
                {t("profile_waiting_sub")}
              </Text>
              {tgSession && (
                <TouchableOpacity
                  style={[styles.reopenBtn, { backgroundColor: colors.badgeBg }]}
                  onPress={() => openTelegramApp(tgSession)}
                >
                  <Text style={[styles.reopenBtnText, { color: colors.primary }]}>{t("profile_reopen_bot")}</Text>
                </TouchableOpacity>
              )}
              <TouchableOpacity
                onPress={() => {
                  if (pollIntervalRef.current) clearInterval(pollIntervalRef.current);
                  setWaitingTelegram(false);
                }}
              >
                <Text style={[styles.cancelText, { color: colors.textMuted }]}>{t("cancel")}</Text>
              </TouchableOpacity>
            </View>
          )}

          <View style={[styles.benefitList, { borderTopColor: colors.border }]}>
            <View style={styles.benefitRow}>
              <BoltIcon size={16} color={colors.primary} />
              <Text style={[styles.benefitItem, { color: colors.text }]}>{t("profile_benefit_1")}</Text>
            </View>
            <View style={styles.benefitRow}>
              <ShieldIcon size={16} color="#059669" />
              <Text style={[styles.benefitItem, { color: colors.text }]}>{t("profile_benefit_2")}</Text>
            </View>
            <View style={styles.benefitRow}>
              <CertificateIcon size={16} color={colors.primary} />
              <Text style={[styles.benefitItem, { color: colors.text }]}>{t("profile_benefit_3")}</Text>
            </View>
          </View>
        </View>
      )}

      {/* ILOVA SOZLAMALARI: MAVZU VA TIL */}
      <View style={[styles.settingsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.cardTitle, { color: colors.text }]}>⚙️ {t("settings_title")}</Text>

        {/* 1. Mavzu (Theme) almashtirish */}
        <View style={styles.settingItem}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>🎨 {t("settings_theme")}</Text>
          <View style={[styles.segContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.segBtn,
                theme === "light" && [styles.segBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setTheme("light")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: theme === "light" ? "#ffffff" : colors.textMuted }]}>
                ☀️ {t("settings_theme_light")}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segBtn,
                theme === "dark" && [styles.segBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setTheme("dark")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: theme === "dark" ? "#ffffff" : colors.textMuted }]}>
                🌙 {t("settings_theme_dark")}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* 2. Til (Language) almashtirish */}
        <View style={[styles.settingItem, { marginTop: 16 }]}>
          <Text style={[styles.settingLabel, { color: colors.text }]}>🌐 {t("settings_lang")}</Text>
          <View style={[styles.segContainer, { backgroundColor: colors.inputBg, borderColor: colors.border }]}>
            <TouchableOpacity
              style={[
                styles.segBtn,
                lang === "uz" && [styles.segBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setLang("uz")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: lang === "uz" ? "#ffffff" : colors.textMuted }]}>
                🇺🇿 O'zbek
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segBtn,
                lang === "ru" && [styles.segBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setLang("ru")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: lang === "ru" ? "#ffffff" : colors.textMuted }]}>
                🇷🇺 Рус
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.segBtn,
                lang === "en" && [styles.segBtnActive, { backgroundColor: colors.primary }],
              ]}
              onPress={() => setLang("en")}
              activeOpacity={0.8}
            >
              <Text style={[styles.segBtnText, { color: lang === "en" ? "#ffffff" : colors.textMuted }]}>
                🇬🇧 Eng
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Kontaktlar va Do'kon manzili */}
      <View style={[styles.contactCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.contactCardTitle, { color: colors.text }]}>{t("contact_title")}</Text>
        <Text style={[styles.contactDesc, { color: colors.textMuted }]}>
          {t("contact_sub")}
        </Text>

        <TouchableOpacity
          style={[styles.contactItemRow, { borderTopColor: colors.border }]}
          onPress={() => Linking.openURL("tel:+998932119785")}
        >
          <Text style={styles.contactItemIcon}>📞</Text>
          <View>
            <Text style={[styles.contactItemTitle, { color: colors.textMuted }]}>{t("contact_phone")}</Text>
            <Text style={[styles.contactItemValue, { color: colors.text }]}>+998 93 211 97 85</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.contactItemRow, { borderTopColor: colors.border }]}
          onPress={() => Linking.openURL("https://t.me/medax_uz")}
        >
          <View style={{ marginRight: 2 }}>
            <TelegramIcon size={18} color={colors.primary} />
          </View>
          <View>
            <Text style={[styles.contactItemTitle, { color: colors.textMuted }]}>{t("contact_tg_channel")}</Text>
            <Text style={[styles.contactItemValue, { color: colors.text }]}>@medax_uz</Text>
          </View>
        </TouchableOpacity>

        <View style={[styles.contactItemRow, { borderTopColor: colors.border }]}>
          <Text style={styles.contactItemIcon}>📍</Text>
          <View style={{ flex: 1 }}>
            <Text style={[styles.contactItemTitle, { color: colors.textMuted }]}>{t("contact_store")}</Text>
            <Text style={[styles.contactItemValue, { color: colors.text }]}>
              Namangan viloyati, Namangan sh., Ozod MFY, Abu Rayhon Beruniy 2-uy
            </Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { padding: 16, paddingBottom: 36 },
  loginCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    elevation: 2,
    marginBottom: 16,
  },
  emblemWrap: { marginBottom: 14 },
  loginTitle: { fontSize: 20, fontWeight: "900", marginBottom: 6 },
  loginSub: { fontSize: 13, textAlign: "center", lineHeight: 19, marginBottom: 20 },
  telegramBtn: {
    width: "100%",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    elevation: 3,
  },
  btnInner: { flexDirection: "row", alignItems: "center", gap: 10 },
  telegramBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  benefitList: { marginTop: 20, width: "100%", borderTopWidth: 1, paddingTop: 14, gap: 8 },
  benefitRow: { flexDirection: "row", alignItems: "center", gap: 10 },
  benefitItem: { fontSize: 12.5, fontWeight: "600" },
  waitingBox: { alignItems: "center", paddingVertical: 10, width: "100%" },
  waitingTitle: { fontSize: 15, fontWeight: "800", marginBottom: 4 },
  waitingDesc: { fontSize: 13, textAlign: "center", marginBottom: 14, lineHeight: 18 },
  reopenBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 10, marginBottom: 12 },
  reopenBtnText: { fontWeight: "800", fontSize: 13 },
  cancelText: { fontSize: 13, fontWeight: "600" },

  profileCard: {
    borderRadius: 24,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
    marginBottom: 16,
  },
  avatarContainer: { position: "relative", marginBottom: 12 },
  avatarWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
  },
  avatarImg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 2,
    borderColor: "#0284c7",
  },
  avatarText: { fontSize: 32, color: "#ffffff", fontWeight: "900" },
  cameraBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  cameraIcon: { fontSize: 13 },
  userName: { fontSize: 20, fontWeight: "900", marginBottom: 4 },
  userPhone: { fontSize: 14, fontWeight: "600" },
  changePhotoBtn: { marginTop: 6, marginBottom: 16 },
  changePhotoText: { fontSize: 12.5, fontWeight: "700" },

  infoBox: {
    width: "100%",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    marginBottom: 16,
  },
  infoTitle: { fontSize: 14, fontWeight: "800", marginBottom: 12 },
  infoRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  infoLabel: { fontSize: 13, fontWeight: "600" },

  pillBadgeBlue: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
    backgroundColor: "#e0f2fe",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillTextBlue: { fontSize: 11.5, color: "#0369a1", fontWeight: "700" },

  pillBadgeGreen: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#ecfdf5",
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  pillTextGreen: { fontSize: 11.5, color: "#065f46", fontWeight: "700" },

  logoutBtn: {
    width: "100%",
    backgroundColor: "#fee2e2",
    paddingVertical: 13,
    borderRadius: 12,
    alignItems: "center",
  },
  logoutBtnText: { color: "#dc2626", fontWeight: "800", fontSize: 14 },

  /* SETTINGS CARD */
  settingsCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    marginBottom: 16,
  },
  cardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 14 },
  settingItem: {},
  settingLabel: { fontSize: 13, fontWeight: "700", marginBottom: 8 },
  segContainer: {
    flexDirection: "row",
    borderRadius: 12,
    borderWidth: 1,
    padding: 4,
    gap: 4,
  },
  segBtn: {
    flex: 1,
    paddingVertical: 9,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 9,
  },
  segBtnActive: {
    elevation: 2,
  },
  segBtnText: { fontSize: 12.5, fontWeight: "800" },

  /* CONTACTS */
  contactCard: {
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
  },
  contactCardTitle: { fontSize: 16, fontWeight: "900", marginBottom: 4 },
  contactDesc: { fontSize: 12, marginBottom: 14, lineHeight: 17 },
  contactItemRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    paddingVertical: 10,
    borderTopWidth: 1,
  },
  contactItemIcon: { fontSize: 18 },
  contactItemTitle: { fontSize: 11, fontWeight: "600" },
  contactItemValue: { fontSize: 13, fontWeight: "700", marginTop: 1 },
});
