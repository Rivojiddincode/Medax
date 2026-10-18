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
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { submitOrder, getImageUrl, formatPrice } from "../api";

export function CartScreen({ navigation }: any) {
  const insets = useSafeAreaInsets();
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
        `Buyurtma raqami: #${res.orderId || res.code || "yangi"}.\nTez orada mutaxassisimiz siz bilan bog'lanadi.`,
        [{ text: "OK", onPress: () => navigation.navigate("Asosiy") }]
      );
    } else {
      Alert.alert("Xatolik", res.error || "Buyurtma yuborishda xatolik yuz berdi");
    }
  };

  if (items.length === 0) {
    return (
      <View style={[styles.emptyContainer, { paddingTop: insets.top + 20 }]}>
        <Text style={styles.emptyIcon}>🛒</Text>
        <Text style={styles.emptyTitle}>Savatchangiz bo'sh</Text>
        <Text style={styles.emptyDesc}>
          Katalogimizdan tibbiy uskunalar va sarflov materiallarini tanlang
        </Text>
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
    <View style={styles.container}>
      {/* Header with Safe Area */}
      <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
        <Text style={styles.headerTitle}>Savatcha ({totalItems})</Text>
        <TouchableOpacity onPress={clearCart}>
          <Text style={styles.clearAll}>Tozalash</Text>
        </TouchableOpacity>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, paddingBottom: 32 }}
      >
        {/* Cart Items */}
        <View style={styles.itemList}>
          {items.map(({ product, quantity }) => {
            const imgUrl = getImageUrl(product.images?.[0]?.url);
            const price = product.priceFrom ? Number(product.priceFrom) : 0;
            return (
              <View key={product.id} style={styles.card}>
                <Image source={{ uri: imgUrl }} style={styles.cardImg} resizeMode="contain" />
                <View style={styles.cardInfo}>
                  <Text style={styles.cardName} numberOfLines={2}>
                    {product.name}
                  </Text>
                  <Text style={styles.cardPrice}>
                    {price ? `${(price * quantity).toLocaleString()} UZS` : "Kelishuv asosida"}
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
          <Text style={styles.checkoutSub}>Ma'lumotlaringizni to'ldiring, menejerimiz bog'lanadi</Text>

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
            placeholder="Klinika nomi yoki qo'shimcha talablar"
            value={comment}
            onChangeText={setComment}
            multiline
            placeholderTextColor="#94a3b8"
          />

          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Jami summa:</Text>
            <Text style={styles.totalValue}>
              {totalPrice > 0 ? `${totalPrice.toLocaleString()} UZS` : "Kelishuv asosida"}
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
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#f8fafc" },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 12,
    backgroundColor: "#ffffff",
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#f1f5f9",
  },
  headerTitle: { fontSize: 19, fontWeight: "800", color: "#0f172a" },
  clearAll: { fontSize: 13, color: "#ef4444", fontWeight: "600" },
  itemList: { marginBottom: 16 },
  card: {
    flexDirection: "row",
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 12,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  cardImg: { width: 75, height: 75, borderRadius: 10, backgroundColor: "#f8fafc", marginRight: 12 },
  cardInfo: { flex: 1, justifyContent: "space-between" },
  cardName: { fontSize: 13, fontWeight: "700", color: "#0f172a", lineHeight: 17 },
  cardPrice: { fontSize: 14, fontWeight: "800", color: "#0284c7", marginVertical: 4 },
  cardActions: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  qtyBox: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f1f5f9",
    borderRadius: 8,
    padding: 2,
  },
  qtyBtn: { width: 28, height: 28, borderRadius: 6, backgroundColor: "#ffffff", alignItems: "center", justifyContent: "center" },
  qtyBtnText: { fontSize: 16, fontWeight: "700", color: "#0f172a" },
  qtyNumber: { marginHorizontal: 10, fontSize: 13, fontWeight: "700", color: "#0f172a" },
  removeText: { fontSize: 12, color: "#ef4444", fontWeight: "600" },

  checkoutBox: {
    backgroundColor: "#ffffff",
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  checkoutTitle: { fontSize: 16, fontWeight: "800", color: "#0f172a" },
  checkoutSub: { fontSize: 11.5, color: "#64748b", marginTop: 2, marginBottom: 14 },
  label: { fontSize: 12, fontWeight: "700", color: "#334155", marginBottom: 5 },
  input: {
    backgroundColor: "#f8fafc",
    borderWidth: 1,
    borderColor: "#e2e8f0",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 13,
    color: "#0f172a",
    marginBottom: 12,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#f1f5f9",
    marginTop: 4,
    marginBottom: 12,
  },
  totalLabel: { fontSize: 14, fontWeight: "700", color: "#64748b" },
  totalValue: { fontSize: 17, fontWeight: "900", color: "#0284c7" },
  orderBtn: {
    backgroundColor: "#0284c7",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  orderBtnText: { color: "#ffffff", fontSize: 14.5, fontWeight: "800" },

  emptyContainer: { flex: 1, alignItems: "center", justifyContent: "center", padding: 30, backgroundColor: "#ffffff" },
  emptyIcon: { fontSize: 50, marginBottom: 14 },
  emptyTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a", marginBottom: 6 },
  emptyDesc: { fontSize: 13, color: "#64748b", textAlign: "center", marginBottom: 20 },
  shopBtn: { backgroundColor: "#0284c7", paddingHorizontal: 22, paddingVertical: 12, borderRadius: 14 },
  shopBtnText: { color: "#ffffff", fontWeight: "700", fontSize: 13.5 },
});
