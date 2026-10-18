import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
  TextInput,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { submitOrder } from "../api";

export function CartScreen({ navigation }: any) {
  const { items, updateQuantity, removeFromCart, clearCart, totalPrice, totalItems } = useCart();
  const { customer } = useAuth();

  const [customerName, setCustomerName] = useState(customer?.name || "");
  const [phone, setPhone] = useState(customer?.phone || "+998 ");
  const [address, setAddress] = useState("");
  const [comment, setComment] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCheckout = async () => {
    if (!customerName.trim()) {
      Alert.alert("Xatolik", "Iltimos, ismingizni kiriting.");
      return;
    }
    if (phone.replace(/\D/g, "").length < 9) {
      Alert.alert("Xatolik", "Iltimos, telefon raqamingizni to'liq kiriting.");
      return;
    }
    if (!address.trim()) {
      Alert.alert("Xatolik", "Iltimos, yetkazib berish manzilini kiriting.");
      return;
    }

    setLoading(true);
    const orderItems = items.map((i) => ({
      productId: i.product.id,
      quantity: i.quantity,
    }));

    const res = await submitOrder({
      customerName: customerName.trim(),
      phone: phone.trim(),
      deliveryAddress: address.trim(),
      comment: comment.trim(),
      items: orderItems,
    });

    setLoading(false);

    if (res.ok) {
      clearCart();
      Alert.alert(
        "Buyurtma qabul qilindi!",
        `Buyurtma kodi: ${res.code || res.orderId}\nTez orada mutaxassisimiz siz bilan bog'lanadi.`,
        [{ text: "OK", onPress: () => navigation.navigate("Asosiy") }]
      );
    } else {
      Alert.alert("Xatolik", res.error || "Buyurtma yuborishda xatolik yuz berdi");
    }
  };

  if (items.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Savatchangiz bo'sh</Text>
        <Text style={styles.emptyDesc}>Katalogimizdan tibbiy uskunalarni tanlang</Text>
        <TouchableOpacity
          style={styles.shopBtn}
          onPress={() => navigation.navigate("Katalog")}
        >
          <Text style={styles.shopBtnText}>Katalogni ko'rish →</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Savatcha ({totalItems})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearAll}>Tozalash</Text>
        </TouchableOpacity>
      </View>

      {/* Cart Items */}
      <View style={styles.itemList}>
        {items.map(({ product, quantity }) => {
          const imgUrl = product.images?.[0]?.url || "https://medax.uz/logo.png";
          const price = product.priceFrom ? Number(product.priceFrom) : 0;
          return (
            <View key={product.id} style={styles.card}>
              <Image source={{ uri: imgUrl }} style={styles.cardImg} resizeMode="contain" />
              <View style={styles.cardInfo}>
                <Text style={styles.cardName} numberOfLines={2}>
                  {product.name}
                </Text>
                <Text style={styles.cardPrice}>
                  {price ? `${(price * quantity).toLocaleString()} so'm` : "Kelishuv asosida"}
                </Text>

                <View style={styles.cardActions}>
                  <View style={styles.qtyBox}>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(product.id, quantity - 1)}
                    >
                      <Text style={styles.qtyBtnText}>-</Text>
                    </TouchableOpacity>
                    <Text style={styles.qtyNumber}>{quantity}</Text>
                    <TouchableOpacity
                      style={styles.qtyBtn}
                      onPress={() => updateQuantity(product.id, quantity + 1)}
                    >
                      <Text style={styles.qtyBtnText}>+</Text>
                    </TouchableOpacity>
                  </View>

                  <TouchableOpacity onPress={() => removeFromCart(product.id)}>
                    <Text style={styles.removeText}>O'chirish</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          );
        })}
      </View>

      {/* Checkout Form */}
      <View style={styles.checkoutBox}>
        <Text style={styles.checkoutTitle}>Buyurtmani rasmiylashtirish</Text>

        <Text style={styles.label}>Ismingiz *</Text>
        <TextInput
          style={styles.input}
          placeholder="To'liq ismingiz"
          value={customerName}
          onChangeText={setCustomerName}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Telefon raqamingiz *</Text>
        <TextInput
          style={styles.input}
          placeholder="+998 90 123 45 67"
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Yetkazib berish manzili *</Text>
        <TextInput
          style={styles.input}
          placeholder="Viloyat, shahar, ko'cha, bino"
          value={address}
          onChangeText={setAddress}
          placeholderTextColor="#94a3b8"
        />

        <Text style={styles.label}>Qo'shimcha izoh (ixtiyoriy)</Text>
        <TextInput
          style={[styles.input, { height: 70 }]}
          placeholder="Klinika nomi yoki qo'shimcha ma'lumot"
          value={comment}
          onChangeText={setComment}
          multiline
          placeholderTextColor="#94a3b8"
        />

        <View style={styles.totalRow}>
          <Text style={styles.totalLabel}>Jami summa:</Text>
          <Text style={styles.totalValue}>
            {totalPrice > 0 ? `${totalPrice.toLocaleString()} so'm` : "Kelishuv asosida"}
          </Text>
        </View>

        <TouchableOpacity
          style={styles.orderBtn}
          onPress={handleCheckout}
          disabled={loading}
        >
          {loading ? (
            <ActivityIndicator color="#ffffff" />
          ) : (
            <Text style={styles.orderBtnText}>Buyurtma berish →</Text>
          )}
        </TouchableOpacity>
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
  headerTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a" },
  clearAll: { fontSize: 13, color: "#ef4444", fontWeight: "600" },
  itemList: { padding: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#f1f5f9",
  },
  cardImg: { width: 90, height: 90, borderRadius: 12, backgroundColor: "#f8fafc" },
  cardInfo: { flex: 1, marginLeft: 14, justifyContent: "space-between" },
  cardName: { fontSize: 14, fontWeight: "700", color: "#1e293b" },
  cardPrice: { fontSize: 15, fontWeight: "800", color: "#0284c7" },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qtyBox: { flexDirection: "row", alignItems: "center", backgroundColor: "#f1f5f9", borderRadius: 8, padding: 2 },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#ffffff", justifyContent: "center", alignItems: "center" },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  qtyNumber: { marginHorizontal: 10, fontSize: 14, fontWeight: "700", color: "#0f172a" },
  removeText: { fontSize: 12, color: "#ef4444", fontWeight: "600" },
  checkoutBox: {
    backgroundColor: "#ffffff",
    marginHorizontal: 16,
    marginBottom: 40,
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  checkoutTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 16 },
  label: { fontSize: 13, fontWeight: "600", color: "#475569", marginBottom: 6 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: "#0f172a",
    marginBottom: 14,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginVertical: 16,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    paddingTop: 16,
  },
  totalLabel: { fontSize: 16, fontWeight: "700", color: "#334155" },
  totalValue: { fontSize: 18, fontWeight: "900", color: "#0284c7" },
  orderBtn: {
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  orderBtnText: { color: "#ffffff", fontSize: 15, fontWeight: "800" },
  emptyContainer: { flex: 1, justifyContent: "center", alignItems: "center", padding: 30, backgroundColor: "#ffffff" },
  emptyIcon: { fontSize: 60, marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  emptyDesc: { fontSize: 14, color: "#64748b", textAlign: "center", marginBottom: 24 },
  shopBtn: { backgroundColor: "#0284c7", paddingHorizontal: 24, paddingVertical: 12, borderRadius: 14 },
  shopBtnText: { color: "#ffffff", fontSize: 14, fontWeight: "700" },
});
