import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Image,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import { fetchProductDetail, Product } from "../api";
import { useCart } from "../context/CartContext";

export function ProductDetailScreen({ route, navigation }: any) {
  const { slug } = route.params;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchProductDetail(slug).then((data) => {
      setProduct(data);
      setLoading(false);
    });
  }, [slug]);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0284c7" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.notFound}>Mahsulot topilmadi</Text>
      </View>
    );
  }

  const imgUrl = product.images?.[0]?.url || "https://medax.uz/logo.png";

  return (
    <View style={styles.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scroll}>
        <Image source={{ uri: imgUrl }} style={styles.mainImg} resizeMode="contain" />

        <View style={styles.body}>
          {product.category && (
            <Text style={styles.catName}>{product.category.name}</Text>
          )}

          <Text style={styles.title}>{product.name}</Text>

          <View style={styles.priceRow}>
            {product.priceFrom ? (
              <Text style={styles.price}>
                {Number(product.priceFrom).toLocaleString()} so'm
              </Text>
            ) : (
              <Text style={styles.priceMuted}>Narx so'rov bo'yicha</Text>
            )}
            {product.country && (
              <View style={styles.countryBadge}>
                <Text style={styles.countryText}>🌍 {product.country}</Text>
              </View>
            )}
          </View>

          {product.description ? (
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Tavsif</Text>
              <Text style={styles.desc}>{product.description}</Text>
            </View>
          ) : null}

          {/* Kafolat va yetkazib berish */}
          <View style={styles.guaranteeBox}>
            <Text style={styles.guaranteeTitle}>🛡️ Medax Rasmiy Kafolati</Text>
            <Text style={styles.guaranteeDesc}>
              Barcha uskunalarimiz sertifikatlangan, rasmiy zavod kafolatiga ega va O'zbekiston bo'ylab o'rnatib beriladi.
            </Text>
          </View>
        </View>
      </ScrollView>

      {/* Bottom Bar: Quantity & Add to Cart */}
      <View style={styles.bottomBar}>
        <View style={styles.qtyControl}>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => Math.max(1, q - 1))}
          >
            <Text style={styles.qtyBtnText}>-</Text>
          </TouchableOpacity>
          <Text style={styles.qtyText}>{quantity}</Text>
          <TouchableOpacity
            style={styles.qtyBtn}
            onPress={() => setQuantity((q) => q + 1)}
          >
            <Text style={styles.qtyBtnText}>+</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          style={styles.addToCartBtn}
          onPress={() => {
            addToCart(product, quantity);
            navigation.navigate("Savatcha");
          }}
        >
          <Text style={styles.addToCartText}>Savatchaga qo'shish</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ffffff" },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  notFound: { fontSize: 16, color: "#64748b" },
  scroll: { paddingBottom: 100 },
  mainImg: { width: "100%", height: 300, backgroundColor: "#f8fafc" },
  body: { padding: 20 },
  catName: { fontSize: 12, fontWeight: "700", color: "#0284c7", textTransform: "uppercase", marginBottom: 6 },
  title: { fontSize: 20, fontWeight: "800", color: "#0f172a", lineHeight: 28, marginBottom: 12 },
  priceRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 20 },
  price: { fontSize: 22, fontWeight: "900", color: "#0284c7" },
  priceMuted: { fontSize: 16, fontWeight: "700", color: "#64748b" },
  countryBadge: { backgroundColor: "#f1f5f9", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8 },
  countryText: { fontSize: 12, fontWeight: "600", color: "#334155" },
  section: { marginTop: 10, borderTopWidth: 1, borderTopColor: "#f1f5f9", paddingTop: 16 },
  sectionHeader: { fontSize: 16, fontWeight: "700", color: "#0f172a", marginBottom: 8 },
  desc: { fontSize: 14, color: "#334155", lineHeight: 22 },
  guaranteeBox: {
    marginTop: 20,
    backgroundColor: "#f0fdf4",
    borderWidth: 1,
    borderColor: "#bbf7d0",
    borderRadius: 14,
    padding: 14,
  },
  guaranteeTitle: { fontSize: 14, fontWeight: "700", color: "#166534", marginBottom: 4 },
  guaranteeDesc: { fontSize: 12.5, color: "#15803d", lineHeight: 18 },
  bottomBar: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: "#ffffff",
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingHorizontal: 20,
    paddingVertical: 14,
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  qtyControl: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 12,
    padding: 4,
  },
  qtyBtn: { width: 36, height: 36, borderRadius: 8, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  qtyBtnText: { fontSize: 18, fontWeight: "700", color: "#0f172a" },
  qtyText: { marginHorizontal: 12, fontSize: 16, fontWeight: "700", color: "#0f172a" },
  addToCartBtn: {
    flex: 1,
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  addToCartText: { color: "#ffffff", fontSize: 15, fontWeight: "700" },
});
