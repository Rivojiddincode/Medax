import AsyncStorage from "@react-native-async-storage/async-storage";

export const API_BASE = "https://medax-backend-c803.onrender.com/api";
export const TOKEN_KEY = "@medax_customer_token";

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Product {
  id: number;
  name: string;
  slug: string;
  priceFrom?: number | string | null;
  oldPrice?: number | string | null;
  discountPercent?: number | null;
  unit?: string | null;
  images?: { url: string; thumbUrl: string }[];
  category?: Category;
  description?: string;
  specs?: any;
  country?: string | null;
  isHit?: boolean;
  isNew?: boolean;
}

export interface Customer {
  id: number;
  name: string;
  phone?: string | null;
  organization?: string | null;
  avatar?: string | null;
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const res = await fetch(`${API_BASE}/categories`);
    const data = await res.json();
    return Array.isArray(data) ? data : data.categories || [];
  } catch (err) {
    console.error("fetchCategories error:", err);
    return [];
  }
}

export async function fetchProducts(params: { categoryId?: number; search?: string } = {}): Promise<Product[]> {
  try {
    const query = new URLSearchParams();
    if (params.categoryId) query.append("categoryId", String(params.categoryId));
    if (params.search) query.append("search", params.search);

    const res = await fetch(`${API_BASE}/products?${query.toString()}`);
    const data = await res.json();
    return Array.isArray(data) ? data : (data.items || data.products || []);
  } catch (err) {
    console.error("fetchProducts error:", err);
    return [];
  }
}

export function getImageUrl(path?: string | null): string {
  if (!path) return "https://medax.uz/logo.png";
  if (path.startsWith("http://") || path.startsWith("https://")) return path;
  if (path.startsWith("/")) return `https://medax.uz${path}`;
  return `https://medax.uz/${path}`;
}

export function formatPrice(price?: number | string | null): string {
  if (price === undefined || price === null || price === "") return "Kelishilgan narxda";
  const num = typeof price === "number" ? price : parseFloat(String(price));
  if (isNaN(num) || num <= 0) return "Kelishilgan narxda";
  return num.toLocaleString("uz-UZ") + " UZS";
}

export async function fetchProductDetail(slug: string): Promise<Product | null> {
  try {
    const res = await fetch(`${API_BASE}/products/${slug}`);
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.error("fetchProductDetail error:", err);
    return null;
  }
}

export async function startTelegramAuth(): Promise<{ sessionId: string; startUrl: string; botUsername: string }> {
  const res = await fetch(`${API_BASE}/customer/auth/telegram-session`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
  });
  return await res.json();
}

export async function pollTelegramAuth(sessionId: string): Promise<{ ok: boolean; status: string; token?: string; customer?: Customer }> {
  const res = await fetch(`${API_BASE}/customer/auth/telegram-poll?sessionId=${encodeURIComponent(sessionId)}`);
  return await res.json();
}

export async function fetchCustomerProfile(): Promise<Customer | null> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    if (!token) return null;
    const res = await fetch(`${API_BASE}/customer/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) {
      await AsyncStorage.removeItem(TOKEN_KEY);
      return null;
    }
    const data = await res.json();
    return data.customer || null;
  } catch {
    return null;
  }
}

export async function submitOrder(orderData: {
  customerName: string;
  phone: string;
  deliveryAddress: string;
  comment?: string;
  items: { productId: number; quantity: number }[];
}): Promise<{ ok: boolean; orderId?: number; code?: string; error?: string }> {
  try {
    const token = await AsyncStorage.getItem(TOKEN_KEY);
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (token) headers.Authorization = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/orders`, {
      method: "POST",
      headers,
      body: JSON.stringify(orderData),
    });
    return await res.json();
  } catch (err: any) {
    return { ok: false, error: err.message || "Buyurtma berishda xatolik" };
  }
}
