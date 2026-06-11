import { describe, expect, it } from "vitest";
import { CLOUD_SERVICE } from "@/types/cloud";
import { CLOUD_RESOURCE_TYPE } from "@/types/resource";

describe("cloud and resource type constants", () => {
  it("includes DynamoDB as a supported cloud service", () => {
    expect(CLOUD_SERVICE.DYNAMODB).toBe("dynamodb");
    expect(Object.values(CLOUD_SERVICE)).toContain("dynamodb");
  });

  it("includes DynamoDB tables as a normalized resource type", () => {
    expect(CLOUD_RESOURCE_TYPE.DYNAMODB_TABLE).toBe("dynamodb-table");
    expect(Object.values(CLOUD_RESOURCE_TYPE)).toContain("dynamodb-table");
  });
});
