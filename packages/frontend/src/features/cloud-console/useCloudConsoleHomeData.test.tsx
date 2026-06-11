import { renderHook } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useCloudConsoleHomeData } from "@/features/cloud-console/useCloudConsoleHomeData";

const useCloudsQuery = vi.fn();
const useCloudServicesQuery = vi.fn();
const useCloudStatusQuery = vi.fn();
const useCloudConsoleResourcesQuery = vi.fn();
const useSecretsQuery = vi.fn();

vi.mock("@/features/cloud-console/cloudConsoleHome.queries", () => ({
  useCloudsQuery: () => useCloudsQuery(),
  useCloudServicesQuery: (...args: unknown[]) => useCloudServicesQuery(...args),
  useCloudStatusQuery: (...args: unknown[]) => useCloudStatusQuery(...args),
  useCloudConsoleResourcesQuery: (...args: unknown[]) => useCloudConsoleResourcesQuery(...args),
}));

vi.mock("@/api/aws/secretsmanager.queries", () => ({
  useSecretsQuery: (...args: unknown[]) => useSecretsQuery(...args),
}));

describe("useCloudConsoleHomeData", () => {
  beforeEach(() => {
    useCloudsQuery.mockReturnValue({ data: [] });
    useCloudServicesQuery.mockReturnValue({
      data: [
        { cloud: "aws", service: "storage", displayName: "Storage", availability: "available" },
        { cloud: "aws", service: "k8s", displayName: "k8s Engine", availability: "available" },
        { cloud: "aws", service: "database", displayName: "Database", availability: "available" },
        { cloud: "aws", service: "dynamodb", displayName: "DynamoDB", availability: "available" },
      ],
    });
    useCloudStatusQuery.mockReturnValue({
      data: {
        cloud: "aws",
        adapterRegistered: true,
        runtime: "reachable",
        endpoint: "http://localhost:4566",
        checkedAt: "2026-06-10T00:00:00.000Z",
        error: null,
      },
      isLoading: false,
    });
    useSecretsQuery.mockReturnValue({ data: [{ name: "secret-1" }], isLoading: false, isError: false });
    useCloudConsoleResourcesQuery.mockImplementation(({ service }: { service: string }) => {
      if (service === "storage") return { data: [{ id: "bucket-1" }], isLoading: false, isError: false };
      if (service === "k8s") return { data: [{ id: "cluster-1" }], isLoading: false, isError: false };
      if (service === "database") return { data: [{ id: "db-1" }], isLoading: false, isError: false };
      return { data: [{ id: "table-1" }, { id: "table-2" }], isLoading: false, isError: false };
    });
  });

  it("adds DynamoDB and Secrets Manager cards and counts both resource families", () => {
    const { result } = renderHook(() => useCloudConsoleHomeData("aws"));

    expect(result.current.serviceCards.map((service) => service.id)).toContain("dynamodb");
    expect(result.current.serviceCards.map((service) => service.id)).toContain("secretsmanager");
    expect(result.current.serviceCards.find((service) => service.id === "dynamodb")).toMatchObject({
      label: "DynamoDB",
      count: 2,
      route: "/cloud-explorer/aws/dynamodb",
    });
    expect(result.current.resourceCount).toBe(6);
    expect(result.current.activeServicesDetail).toContain("DynamoDB");
    expect(result.current.activeServicesDetail).toContain("Secrets Manager");
  });

  it("keeps the DynamoDB card discoverable when the runtime reports zero tables", () => {
    useCloudConsoleResourcesQuery.mockImplementation(({ service }: { service: string }) => {
      if (service === "storage") return { data: [{ id: "bucket-1" }], isLoading: false, isError: false };
      if (service === "k8s") return { data: [{ id: "cluster-1" }], isLoading: false, isError: false };
      if (service === "database") return { data: [{ id: "db-1" }], isLoading: false, isError: false };
      return { data: [], isLoading: false, isError: false };
    });

    const { result } = renderHook(() => useCloudConsoleHomeData("aws"));

    expect(result.current.serviceCards.map((service) => service.id)).toContain("dynamodb");
    expect(result.current.serviceCards.find((service) => service.id === "dynamodb")).toMatchObject({ count: 0 });
    expect(result.current.resourceCount).toBe(4);
  });
});
