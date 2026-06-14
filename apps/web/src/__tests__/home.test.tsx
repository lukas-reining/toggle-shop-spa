import { render, screen, waitFor } from "@testing-library/react";
import { describe, it, expect } from "vitest";
import { MemoryRouter } from "react-router-dom";
import Home from "@/pages/Home";
import { OpenFeatureTestProvider } from "@openfeature/react-sdk";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false, // Disable retries for testing
    },
  },
});

describe("Home", () => {
  it("renders the hero section", async () => {
    render(
      <MemoryRouter>
        <QueryClientProvider client={queryClient}>
          <OpenFeatureTestProvider>
            <Home />
          </OpenFeatureTestProvider>
        </QueryClientProvider>
      </MemoryRouter>
    );

    const heading = await waitFor(() =>
      screen.getByRole("heading", { name: /ToggleShop/i })
    );

    expect(heading).toBeInTheDocument();
  });
});
