"use client";

import { Provider } from "react-redux";
import { store } from "@/store";
import { Toaster } from "@/components/ui/sonner";
import TopProgressBar from "@/components/common/TopProgressBar";
import ScrollToTopButton from "@/components/common/ScrollToTopButton";
import LenisProvider from "@/components/LenisProvider/LenisProvider";

export default function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <LenisProvider>
        <TopProgressBar />
        {children}
        <ScrollToTopButton />
        <Toaster />
      </LenisProvider>
    </Provider>
  );
}
