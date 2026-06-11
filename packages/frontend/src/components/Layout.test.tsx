import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import userEvent from "@testing-library/user-event";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { Layout } from "@/components/Layout";

const getCloudStatus = vi.fn();

vi.mock("@/api/cloudProxyClient", () => ({
  getCloudStatus: (...args: unknown[]) => getCloudStatus(...args),
}));

describe("Layout cloud navigation", () => {
  beforeEach(() => {
    getCloudStatus.mockResolvedValue({
      cloud: "aws",
      adapterRegistered: true,
      runtime: "reachable",
      endpoint: "http://localhost:4566",
      checkedAt: "2026-06-10T00:00:00.000Z",
      error: null,
    });
  });

  it("shows the grouped database navigation with DynamoDB active on the dedicated route", async () => {
    renderLayout("/cloud-explorer/aws/dynamodb");

    const trigger = await screen.findByRole("button", { name: "Database" });
    expect(trigger).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("link", { name: "DynamoDB" })).toHaveAttribute("aria-current", "page");
    expect(screen.getByRole("link", { name: "Database" })).toHaveAttribute("href", "/cloud-explorer/aws/database");
  });

  it("opens the database group with keyboard input and moves focus to the first child route", async () => {
    const user = userEvent.setup();
    renderLayout("/cloud-explorer/aws/storage");

    const trigger = await screen.findByRole("button", { name: "Database" });
    trigger.focus();
    await user.keyboard("{ArrowDown}");

    await waitFor(() => {
      expect(trigger).toHaveAttribute("aria-expanded", "true");
    });
    expect(screen.getByRole("link", { name: "Database" })).toHaveFocus();
    expect(screen.getByRole("link", { name: "DynamoDB" })).toBeInTheDocument();
  });
});

function renderLayout(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route element={<Layout />}>
            <Route path="/cloud-explorer/:cloud/:service" element={<div>Child page</div>} />
          </Route>
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
