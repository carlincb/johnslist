import React from "react";
import { BrowserRouter as Router, Route, Switch } from "react-router-dom";
import {
  ApolloClient,
  InMemoryCache,
  ApolloProvider,
  createHttpLink,
} from "@apollo/client";
import { setContext } from "@apollo/client/link/context";
import { StoreProvider } from "./utils/GlobalState";
import Header from "./components/Header/Header";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import AddProduct from "./pages/AddProduct";
import MyProducts from "./pages/MyProducts";
import ProductGallery from "./pages/ProductGallery";
import NoMatch from "./pages/NoMatch";
import CategoryPage from "./pages/CategoryPage";
import Wishlist from "./pages/Wishlist";
import ShoppingCart from "./pages/ShoppingCart";
import AboutUs from "./pages/AboutUs";
import SellerInformation from "./pages/SellerInformation";
import BuyerInformation from "./pages/BuyerInformation";
import ProductDetailsBuyer from "./components/ProductDetails/ProductDetailsBuyer";
import "./App.css";

const httpLink = createHttpLink({
  uri: "/graphql",
});

const authLink = setContext((_, { headers }) => {
  const token = localStorage.getItem("id_token");
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : "",
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <Router>
        <StoreProvider>
          <Header />
          <Switch>
            <Route exact path="/" component={Home} />
            <Route exact path="/login" component={Login} />
            <Route exact path="/signup" component={Signup} />
            <Route exact path="/selling-info" component={SellerInformation} />
            <Route exact path="/add-product" component={AddProduct} />
            <Route exact path="/my-products" component={MyProducts} />
            <Route exact path="/buying-info" component={BuyerInformation} />
            <Route exact path="/marketplace" component={ProductGallery} />
            <Route exact path="/wishlist" component={Wishlist} />
            <Route exact path="/cart" component={ShoppingCart} />
            <Route exact path="/about" component={AboutUs} />
            {/* <Route exact path="/user-products" component={UserProducts} /> */}
            <Route
              exact
              path="/categories/:category"
              component={CategoryPage}
            />
            <Route
              exact
              path="/buy/:productId"
              component={ProductDetailsBuyer}
            />
            <Route component={NoMatch} />
          </Switch>
        </StoreProvider>
      </Router>
    </ApolloProvider>
  );
}

export default App;
