import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
} from "react-native";
import { Category, fetchCategories, fetchProducts, Product } from "../api";
import { useCart } from "../context/CartContext";

export function CatalogScreen({ navigation, route }: any) {
  const initialCategory = route?.params?.categoryId;
  const [categories, setCategories] = useState<Category[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedCat, setSelectedCat] = useState<number | undefined>(initialCategory);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const { addToCart } = useCart();

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchProducts({ categoryId: selectedCat, search }).then((data) => {
      setProducts(data);
      setLoading(false);
    });
  }, [selectedCat, search]);

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.searchWrap}>
        <TextInput
          style={styles.searchInput}
          placeholder="Uskuna nomini qidiring..."
          value={search}
          onChangeText={setSearch}
          placeholderTextColor="#94a3b8"
        />
        {search.length > 0 && (
          <TouchableOpacity onPress={() => setSearch("")} style={styles.clearBtn}>
            <Text style={{ color: "#94a3b8", fontSize: 13 }}>✕</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Category Pills */}
      <View style={styles.pillsWrap}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={[{ id: 0, name: "Barchasi", slug: "all" }, ...categories]}
          keyExtractor={(item) => String(item.id)}
          renderItem={({ item }) => {
            const active = (!selectedCat && item.id === 0) || selectedCat === item.id;
            return (
              <TouchableOpacity
                style={[styles.pill, active && styles.pillActive]}
                onPress={() => setSelectedCat(item.id === 0 ? undefined : item.id)}
              >
                <Text style={[styles.pillText, active && styles.pillTextActive]}>{item.name}</Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Product List */}
      {loading ? (
        <ActivityIndicator size="large" color="#0284c7" style={{ marginTop: 40 }} />
      ) : products.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Uskuna topilmadi</Text>
          <Text style={styles.emptySub}>Boshqa kalit so'z bilan qidirib ko'ring</Text>
        </View>
      ) : (
        <FlatList
          data={products}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.listContent}
          columnWrapperStyle={styles.columnWrapper}
          showsVerticalScrollIndicator={false}
          renderItem={({ item }) => {
            const imgUrl = item.images?.[0]?.url || "https://medax.uz/logo.png";
            return (
              <TouchableOpacity
                style={styles.productCard}
                onPress={() => navigation.navigate("ProductDetail", { slug: item.slug })}
              >
                <Image source={{ uri: imgUrl }} style={styles.productImg} resizeMode="cover" />
                <Text style={styles.productName} numberOfLines={2}>
                  {item.name}
                </Text>
                {item.priceFrom ? (
                  <Text style={styles.productPrice}>
                    {Number(item.priceFrom).toLocaleString()} so'm
                  </Text>
                ) : (
                  <Text style={styles.productPriceMuted}>Narx so'rov bo'yicha</Text>
                )}
                <TouchableOpacity
                  style={styles.addCartBtn}
                  onPress={() => addToCart(item)}
                >
                  <Text style={styles.addCartText}>+ Savatchaga</Text>
                </TouchableOpacity>
              </TouchableOpacity>
            );
          }}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  searchWrap: {
    padding: 16,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
    position: "relative",
  },
  searchInput: {
    backgroundColor: "#f1f5f9",
    borderRadius: 14,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 14,
    color: "#0f172a",
  },
  clearBtn: { position: "absolute", right: 30, top: 28 },
  pillsWrap: { backgroundColor: "#ffffff", paddingVertical: 10, paddingLeft: 16, borderBottomWidth: 1, borderBottomColor: "#f1f5f9" },
  pill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: "#f1f5f9",
    marginRight: 8,
  },
  pillActive: { backgroundColor: "#0284c7" },
  pillText: { fontSize: 13, fontWeight: "600", color: "#475569" },
  pillTextActive: { color: "#ffffff" },
  listContent: { padding: 16 },
  columnWrapper: { justifyContent: "space-between" },
  productCard: {
    width: "48%",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#f1f5f9",
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
  emptyWrap: { alignItems: "center", justifyContent: "center", marginTop: 60 },
  emptyTitle: { fontSize: 16, fontWeight: "700", color: "#334155" },
  emptySub: { fontSize: 13, color: "#94a3b8", marginTop: 4 },
});
