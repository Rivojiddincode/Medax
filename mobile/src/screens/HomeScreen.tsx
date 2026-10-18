import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  FlatList,
} from "react-native";
import { Category, fetchCategories, fetchProducts, Product } from "../api";
import { useCart } from "../context/CartContext";

export function HomeScreen({ navigation }: any) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [hitProducts, setHitProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    Promise.all([fetchCategories(), fetchProducts()]).then(([cats, prods]) => {
      setCategories(cats);
      setHitProducts(prods.filter((p) => p.isHit).slice(0, 8));
      setLoading(false);
    });
  }, []);

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      {/* Brand Header */}
      <View style={styles.header}>
        <View>
          <Text style={styles.brandTitle}>MEDAX</Text>
          <Text style={styles.brandSub}>Tibbiy uskunalar markazi</Text>
        </View>
        <TouchableOpacity
          style={styles.searchBtn}
          onPress={() => navigation.navigate("Katalog")}
        >
          <Text style={styles.searchBtnText}>🔍 Qidirish</Text>
        </TouchableOpacity>
      </View>

      {/* Hero Banner */}
      <View style={styles.banner}>
        <Text style={styles.bannerBadge}>KAFOLATLI XIZMAT</Text>
        <Text style={styles.bannerTitle}>Zamonaviy Tibbiy Uskunalar</Text>
        <Text style={styles.bannerDesc}>
          O'zbekiston bo'ylab tezkor yetkazib berish va 24/7 servis kafolati
        </Text>
        <TouchableOpacity
          style={styles.bannerBtn}
          onPress={() => navigation.navigate("Katalog")}
        >
          <Text style={styles.bannerBtnText}>Katalogni ko'rish →</Text>
        </TouchableOpacity>
      </View>

      {/* Categories Horizontal */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Kategoriyalar</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.catScroll}>
          {categories.map((cat) => (
            <TouchableOpacity
              key={cat.id}
              style={styles.catCard}
              onPress={() => navigation.navigate("Katalog", { categoryId: cat.id })}
            >
              <Text style={styles.catCardText}>{cat.name}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Hit Products */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Ommabop Uskunalar</Text>
          <TouchableOpacity onPress={() => navigation.navigate("Katalog")}>
            <Text style={styles.seeAll}>Barchasi →</Text>
          </TouchableOpacity>
        </View>

        {loading ? (
          <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 20 }} />
        ) : (
          <View style={styles.grid}>
            {hitProducts.map((p) => {
              const imgUrl = p.images?.[0]?.url || "https://medax.uz/logo.png";
              return (
                <TouchableOpacity
                  key={p.id}
                  style={styles.productCard}
                  onPress={() => navigation.navigate("ProductDetail", { slug: p.slug })}
                >
                  <Image source={{ uri: imgUrl }} style={styles.productImg} resizeMode="cover" />
                  <Text style={styles.productName} numberOfLines={2}>
                    {p.name}
                  </Text>
                  {p.priceFrom ? (
                    <Text style={styles.productPrice}>
                      {Number(p.priceFrom).toLocaleString()} so'm
                    </Text>
                  ) : (
                    <Text style={styles.productPriceMuted}>Narx so'rov bo'yicha</Text>
                  )}
                  <TouchableOpacity
                    style={styles.addCartBtn}
                    onPress={() => addToCart(p)}
                  >
                    <Text style={styles.addCartText}>+ Savatchaga</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  brandTitle: { fontSize: 24, fontWeight: "900", color: "#0284c7", letterSpacing: 0.5 },
  brandSub: { fontSize: 11, color: "#64748b", fontWeight: "500" },
  searchBtn: {
    backgroundColor: "#f1f5f9",
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
  },
  searchBtnText: { fontSize: 13, color: "#334155", fontWeight: "600" },
  banner: {
    margin: 16,
    backgroundColor: "#0284c7",
    borderRadius: 20,
    padding: 20,
    shadowColor: "#0284c7",
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 4,
  },
  bannerBadge: {
    color: "#e0f2fe",
    fontSize: 10,
    fontWeight: "800",
    letterSpacing: 1,
    marginBottom: 6,
  },
  bannerTitle: { color: "#ffffff", fontSize: 20, fontWeight: "800", marginBottom: 6 },
  bannerDesc: { color: "#bae6fd", fontSize: 13, lineHeight: 18, marginBottom: 16 },
  bannerBtn: {
    backgroundColor: "#ffffff",
    alignSelf: "flex-start",
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 12,
  },
  bannerBtnText: { color: "#0284c7", fontWeight: "700", fontSize: 13 },
  section: { marginTop: 12, paddingHorizontal: 16 },
  sectionHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 12 },
  sectionTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 12 },
  seeAll: { fontSize: 13, color: "#0284c7", fontWeight: "600" },
  catScroll: { flexDirection: "row", marginBottom: 16 },
  catCard: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
    marginRight: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  catCardText: { fontSize: 13, fontWeight: "600", color: "#1e293b" },
  grid: { flexDirection: "row", flexWrap: "wrap", justifyContent: "space-between" },
  productCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 1,
  },
  productImg: { width: "100%", height: 130, borderRadius: 12, backgroundColor: "#f8fafc", marginBottom: 10 },
  productName: { fontSize: 13, fontWeight: "600", color: "#1e293b", minHeight: 34, marginBottom: 6 },
  productPrice: { fontSize: 14, fontWeight: "800", color: "#0284c7", marginBottom: 10 },
  productPriceMuted: { fontSize: 12, fontWeight: "500", color: "#64748b", marginBottom: 10 },
  addCartBtn: {
    backgroundColor: "#e0f2fe",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  addCartText: { color: "#0284c7", fontWeight: "700", fontSize: 12 },
});
