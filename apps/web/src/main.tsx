import React from "react";
import ReactDOM from "react-dom/client";
import "@fontsource/inter/400.css";
import "@fontsource/inter/600.css";
import "@fontsource/inter/700.css";
import "./globals.css";
import { AppRouter } from "@/App";
import { ReactQueryProvider } from "@/providers/react-query";
import { OpenFeatureProvider } from "@/providers/open-feature";
import { CartProvider } from "@/providers/cart";
import { TARGETING_KEY } from "@/libs/targeting-key";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <ReactQueryProvider>
      <OpenFeatureProvider context={{ targetingKey: TARGETING_KEY }}>
        <CartProvider>
          <AppRouter />
        </CartProvider>
      </OpenFeatureProvider>
    </ReactQueryProvider>
  </React.StrictMode>
);
