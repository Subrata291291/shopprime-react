import { BrowserRouter, Routes, Route } from "react-router-dom";

import MainLayout from "../layouts/MainLayout";

import Home from "../pages/Home/Home";
import Shop from "../pages/Shop/Shop";
import ProductDetails from "../pages/Product/ProductDetails";
import Cart from "../pages/Cart/Cart";
import Checkout from "../pages/Checkout/Checkout";
import MyAccount from "../pages/Account/Account";
import ThankYou from "../pages/ThankYou/ThankYou";
import TrackOrder from "../pages/TrackOrder/TrackOrder";
import Auth from "../pages/Auth/Auth";
import Wishlist from "../pages/Wishlist/Wishlist";

const AppRoutes = () => {
  return (
    <BrowserRouter>
      <Routes>

        <Route element={<MainLayout />}>

          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop />} />

          <Route
            path="/product/:id"
            element={<ProductDetails />}
          />

          <Route path="/cart" element={<Cart />} />

          <Route path="/checkout" element={<Checkout />} />

          <Route path="/my-account" element={<MyAccount />} />

          <Route path="/thank-you" element={<ThankYou />} />

          <Route
            path="/track-order"
            element={<TrackOrder />}
          />

          <Route path="/auth" element={<Auth />} />

          <Route path="/wishlist" element={<Wishlist />} />

        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default AppRoutes;
