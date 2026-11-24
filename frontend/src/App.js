import './assets/style/common.css';
import { BrowserRouter, Outlet, Route, Routes } from 'react-router-dom';

import Navbar from './components/UserEnd/Navbar/Navbar';
import Home from './components/UserEnd/HomePage/Home';
import Footer from './components/UserEnd/Footer/Footer';
import Shop from './components/UserEnd/Shop/Shop';
import Compare from './components/UserEnd/Compare/Compare';
import BuildPC from './components/UserEnd/BuildPC/BuildPC';
import About from './components/UserEnd/About/About';
import Wishlist from './components/UserEnd/Wishlist/Wishlist';
import Cart from './components/UserEnd/Cart/Cart';
import Account from './components/UserEnd/Account/Account';
import ProductDetails from './components/UserEnd/ProductDetails/ProductDetails';

import AuthProvider from './authentication/AuthProvider';
import AuthLayout from './authentication/AuthLayout';
import ProtectedRoute from './authentication/ProtectedRoute';

import { CheckoutProvider } from './context/CheckoutContext';
import { CompareProvider } from './context/CompareContext';
import CheckoutDelivery from './components/UserEnd/Checkout/CheckoutDelivery/CheckoutDelivery';
import CheckoutReview from './components/UserEnd/Checkout/CheckoutReview/CheckoutReview';
import CheckoutPayment from './components/UserEnd/Checkout/CheckoutPayment/CheckoutPayment';
import OrderConfirmation from './components/UserEnd/Checkout/OrderConfirmation/OrderConfirmation';

// Admin Portal Components
import AdminLogin from './authentication/AdminLogin';
import AdminLayout from './components/AdminEnd/Layout/AdminLayout';
import Dashboard from './components/AdminEnd/Dashboard/Dashboard';
import Products from './components/AdminEnd/Products/Products';
import ProductForm from './components/AdminEnd/Products/ProductForm';
import Categories from './components/AdminEnd/Categories/Categories';
import Inventory from './components/AdminEnd/Inventory/Inventory';
import Orders from './components/AdminEnd/Orders/Orders';
import OrderDetails from './components/AdminEnd/Orders/OrderDetails';
import Customers from './components/AdminEnd/Customers/Customers';
import Coupons from './components/AdminEnd/Coupons/Coupons';
import Reviews from './components/AdminEnd/Reviews/Reviews';
import Support from './components/AdminEnd/Support/Support';
import ContentManagement from './components/AdminEnd/ContentManagement/ContentManagement';
import Settings from './components/AdminEnd/Settings/Settings';

function App() {
    const UserLayOut = () => {
        return (
            <>
                <Navbar />
                <Outlet />
                <Footer />
            </>
        );
    };

    return (
        <div>
            <AuthProvider>
                <CheckoutProvider>
                    <CompareProvider>
                        <BrowserRouter>
                            <Routes>
                                {/* Authentication Routes */}
                                <Route path="/authentication/*" element={<AuthLayout />} />

                                {/* Dedicated Admin Login Console */}
                                <Route path="/admin/login" element={<AdminLogin />} />

                                {/* Dedicated Admin Portal (Isolated Layout & RBAC Protection) */}
                                <Route element={<ProtectedRoute requiredRole="admin" />}>
                                    <Route path="/admin" element={<AdminLayout />}>
                                        <Route index element={<Dashboard />} />
                                        <Route path="products" element={<Products />} />
                                        <Route path="products/new" element={<ProductForm mode="create" />} />
                                        <Route path="products/:id/edit" element={<ProductForm mode="edit" />} />
                                        <Route path="categories" element={<Categories />} />
                                        <Route path="inventory" element={<Inventory />} />
                                        <Route path="orders" element={<Orders />} />
                                        <Route path="orders/:orderId" element={<OrderDetails />} />
                                        <Route path="customers" element={<Customers />} />
                                        <Route path="coupons" element={<Coupons />} />
                                        <Route path="reviews" element={<Reviews />} />
                                        <Route path="support" element={<Support />} />
                                        <Route path="content" element={<ContentManagement />} />
                                        <Route path="settings" element={<Settings />} />
                                    </Route>
                                </Route>

                                {/* Customer-Facing Storefront */}
                                <Route element={<UserLayOut />}>
                                    <Route path="/" element={<Home />} />
                                    <Route path="/home" element={<Home />} />
                                    <Route path="/shop" element={<Shop />} />
                                    <Route path="/compare" element={<Compare />} />
                                    <Route path="/buildpc" element={<BuildPC />} />
                                    <Route path="/about" element={<About />} />
                                    <Route path="/product-details/:productId" element={<ProductDetails />} />
                                    <Route path="/product-details/:productId/:productName" element={<ProductDetails />} />
                                    <Route element={<ProtectedRoute />}>
                                        <Route path="/wishlist" element={<Wishlist />} />
                                        <Route path="/cart" element={<Cart />} />
                                        <Route path="/account/*" element={<Account />} />
                                        <Route path="/product-delivery" element={<CheckoutDelivery />} />
                                        <Route path="/product-review" element={<CheckoutReview />} />
                                        <Route path="/product-payment" element={<CheckoutPayment />} />
                                        <Route path="/order-confirmation" element={<OrderConfirmation />} />
                                    </Route>
                                </Route>
                            </Routes>
                        </BrowserRouter>
                    </CompareProvider>
                </CheckoutProvider>
            </AuthProvider>
        </div>
    );
}

export default App;
