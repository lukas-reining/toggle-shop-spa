import { Suspense } from "react";
import { Outlet } from "react-router-dom";
import Header from "@/components/Header";

function Loading() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h1 className="text-2xl font-medium text-gray-900 animate-pulse">
        Finding you the deals...
      </h1>
    </div>
  );
}

export default function RootLayout() {
  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <main>
        <Suspense fallback={<Loading />}>
          <Outlet />
        </Suspense>
      </main>
    </div>
  );
}
