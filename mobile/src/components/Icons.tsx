import React from "react";
import { View, Image, StyleSheet, Text } from "react-native";
import Svg, { Path, Circle, Rect, Line, Polyline } from "react-native-svg";

interface IconProps {
  size?: number;
  color?: string;
}

// 1. Asosiy sahifa ikonkasi (Home)
export function HomeIcon({ size = 22, color = "#64748b" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M3 10.182V20a2 2 0 002 2h4.5a1 1 0 001-1v-4.5a1 1 0 011-1h3a1 1 0 011 1V21a1 1 0 001 1H19a2 2 0 002-2v-9.818a2 2 0 00-.735-1.554l-7-5.727a2 2 0 00-2.53 0l-7 5.727A2 2 0 003 10.182z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 2. Katalog ikonkasi (Grid)
export function CatalogIcon({ size = 22, color = "#64748b" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="3" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="3" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="14" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
      <Rect x="3" y="14" width="7" height="7" rx="2" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// 3. Savatcha ikonkasi (Cart)
export function CartIcon({ size = 22, color = "#64748b" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="9" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Circle cx="20" cy="21" r="1" stroke={color} strokeWidth="2" />
      <Path
        d="M1 1h4l2.68 13.39a2 2 0 002 1.61h9.72a2 2 0 002-1.61L23 6H6"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 4. Profil ikonkasi (User)
export function UserIcon({ size = 22, color = "#64748b" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Circle cx="12" cy="7" r="4" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// 5. Qidiruv ikonkasi (Search)
export function SearchIcon({ size = 18, color = "#94a3b8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2" />
      <Line x1="21" y1="21" x2="16.65" y2="16.65" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 6. Tozalash / Yopish ikonkasi (Close / Clear)
export function CloseIcon({ size = 16, color = "#94a3b8" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Line x1="18" y1="6" x2="6" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
      <Line x1="6" y1="6" x2="18" y2="18" stroke={color} strokeWidth="2" strokeLinecap="round" />
    </Svg>
  );
}

// 7. Telegram ikonkasi
export function TelegramIcon({ size = 20, color = "#ffffff" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M21.5 2.5L2 10.5l7 3 2.5 7.5 4-4.5 6 5.5 2-19.5zM9 13.5l9-8-6.5 9.5"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 8. Rasmiy Kafolat (Shield)
export function ShieldIcon({ size = 18, color = "#0284c7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Path
        d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </Svg>
  );
}

// 9. Yetkazib berish (Truck)
export function TruckIcon({ size = 18, color = "#0284c7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Rect x="1" y="3" width="15" height="13" stroke={color} strokeWidth="2" />
      <Polyline points="16 8 20 8 23 11 23 16 16 16" stroke={color} strokeWidth="2" />
      <Circle cx="5.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
      <Circle cx="18.5" cy="18.5" r="2.5" stroke={color} strokeWidth="2" />
    </Svg>
  );
}

// 10. Tezkor xizmat (Lightning/Bolt)
export function BoltIcon({ size = 18, color = "#0284c7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Polyline points="13 2 3 14 12 14 11 22 21 10 12 10 13 2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 11. Sertifikat / Stetoskop
export function CertificateIcon({ size = 18, color = "#0284c7" }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx="12" cy="8" r="6" stroke={color} strokeWidth="2" />
      <Path d="M15.477 12.89L17 22l-5-3-5 3 1.523-9.11" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </Svg>
  );
}

// 12. Medax Asl Logotipi (Emblem)
export function MedaxEmblem({ size = 36 }: { size?: number }) {
  return (
    <Image
      source={{ uri: "https://medax.uz/favicon.png" }}
      style={{ width: size, height: size, borderRadius: size / 4 }}
      resizeMode="contain"
    />
  );
}

// 13. Medax To'liq Brend Logotipi (Logo + Text)
export function MedaxHeaderBrand() {
  return (
    <View style={brandStyles.wrap}>
      <MedaxEmblem size={34} />
      <View style={brandStyles.textWrap}>
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          <Text style={brandStyles.brandMed}>Med</Text>
          <Text style={brandStyles.brandAx}>ax</Text>
        </View>
        <Text style={brandStyles.tagline}>MEDTEXNIKA MARKAZI</Text>
      </View>
    </View>
  );
}

const brandStyles = StyleSheet.create({
  wrap: { flexDirection: "row", alignItems: "center", gap: 10 },
  textWrap: { flexDirection: "column" },
  brandMed: { fontSize: 20, fontWeight: "900", color: "#0284c7", letterSpacing: -0.5 },
  brandAx: { fontSize: 20, fontWeight: "900", color: "#0f172a", letterSpacing: -0.5 },
  tagline: { fontSize: 7.5, fontWeight: "800", color: "#64748b", letterSpacing: 0.8, marginTop: -2 },
});
