import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CloudExplorerPage } from "@/pages/CloudExplorerPage";

const listClouds = vi.fn();
const listCloudServices = vi.fn();
const getCloudStatus = vi.fn();
const getServiceSchema = vi.fn();

vi.mock("@/api/cloudProxyClient", () => ({
  listClouds: (...args: unknown[]) => listClouds(...args),
  listCloudServices: (...args: unknown[]) => listCloudServices(...args),
  getCloudStatus: (...args: unknown[]) => getCloudStatus(...args),
  getServiceSchema: (...args: unknown[]) => getServiceSchema(...args),
}));

vi.mock("@/components/DynamicResourceView", () => ({
  DynamicResourceView: ({ cloud, service }: { cloud: string; service: string }) => (
    <div data-testid="dynamic-resource-view">{`${cloud}:${service}`}</div>
  ),
}));

describe("CloudExplorerPage", () => {
  beforeEach(() => {
    listClouds.mockResolvedValue([
      { id: "aws", displayName: "AWS", availability: "available" },
    ]);
    listCloudServices.mockResolvedValue([
      { cloud: "aws", service: "storage", displayName: "Storage", availability: "available" },
      { cloud: "aws", service: "database", displayName: "Database", availability: "available" },
      { cloud: "aws", service: "dynamodb", displayName: "DynamoDB", availability: "available" },
    ]);
    getCloudStatus.mockResolvedValue({
      cloud: "aws",
      adapterRegistered: true,
      runtime: "reachable",
      endpoint: "http://localhost:4566",
      checkedAt: "2026-06-10T00:00:00.000Z",
      error: null,
    });
    getServiceSchema.mockResolvedValue({
      cloud: "aws",
      service: "dynamodb",
      displayName: "DynamoDB",
      fields: [],
      actions: ["list", "inspect"],
      filters: [],
      columns: [],
    });
  });

  it("routes the dedicated DynamoDB explorer path to the shared resource view", async () => {
    renderPage("/cloud-explorer/aws/dynamodb");

    await waitFor(() => {
      expect(screen.getByTestId("dynamic-resource-view")).toHaveTextContent("aws:dynamodb");
    });

    expect(screen.getByText("/api/clouds/aws/services/dynamodb")).toBeInTheDocument();
  });

  it("keeps the existing database route mapped to the database service", async () => {
    renderPage("/cloud-explorer/aws/database");

    await waitFor(() => {
      expect(screen.getByTestId("dynamic-resource-view")).toHaveTextContent("aws:database");
    });
  });
});

function renderPage(initialEntry: string) {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });

  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/cloud-explorer/:cloud/:service" element={<CloudExplorerPage />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}
