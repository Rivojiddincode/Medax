import { Link, Route, Routes } from "react-router-dom";
import { Layout } from "./components/Shell";
import Home from "./pages/Home";
import Catalog from "./pages/Catalog";
import ProductPage from "./pages/ProductPage";
import Cart from "./pages/Cart";
import Contact from "./pages/Contact";
import CustomerAccount from "./pages/CustomerAccount";
import { CustomerAuthProvider } from "./customerAuth";
import { AuthModal } from "./components/AuthModal";
import { AdminLayout, Dashboard, Login } from "./admin/AdminLayout";
import { ProductForm, ProductList } from "./admin/Products";
import Taxonomy from "./admin/Taxonomy";
import Orders from "./admin/Orders";
import { Blocklist, ContactMessagesPage, ImportPage, Users } from "./admin/Misc";
import AdminCustomersPage from "./admin/Customers";
import { ThemeProvider } from "./context/ThemeContext";
import { I18nProvider } from "./context/I18nContext";

function NotFound() {
  return (
    <main className="wrap">
      <div className="done">
        <h1 style={{ fontSize: 34 }}>Sahifa topilmadi</h1>
        <p className="muted">Manzil noto'g'ri yoki sahifa o'chirilgan.</p>
        <Link className="btn" to="/">Bosh sahifaga</Link>
      </div>
    </main>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <I18nProvider>
        <CustomerAuthProvider>
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<Home />} />
              <Route path="catalog" element={<Catalog />} />
              <Route path="product/:slug" element={<ProductPage />} />
              <Route path="cart" element={<Cart />} />
              <Route path="contact" element={<Contact />} />
              <Route path="account" element={<CustomerAccount />} />
              <Route path="*" element={<NotFound />} />
            </Route>
            <Route path="admin/login" element={<Login />} />
            <Route path="admin" element={<AdminLayout />}>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="customers" element={<AdminCustomersPage />} />
              <Route path="products" element={<ProductList />} />
              <Route path="products/:id" element={<ProductForm />} />
              <Route path="taxonomy" element={<Taxonomy />} />
              <Route path="messages" element={<ContactMessagesPage />} />
              <Route path="import" element={<ImportPage />} />
              <Route path="blocklist" element={<Blocklist />} />
              <Route path="users" element={<Users />} />
            </Route>
          </Routes>
          <AuthModal />
        </CustomerAuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
