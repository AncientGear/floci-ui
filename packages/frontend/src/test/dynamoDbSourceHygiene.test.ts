import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const repoRoot = path.resolve(import.meta.dirname, "../../../..");
const dynamoDbServicePath = path.join(repoRoot, "packages/api/src/services/dynamodb.ts");
const dynamoDbAdapterPath = path.join(repoRoot, "packages/api/src/adapter-aws/AwsDynamoDbAdapter.ts");

const FORBIDDEN_MARKERS = ["console.log", "console.debug", "debugger", "TODO", "FIXME"] as const;

describe("DynamoDB source hygiene", () => {
  it("keeps the DynamoDB service free of debug markers and explains why table details are fetched", () => {
    const source = readSource(dynamoDbServicePath);

    expect(findForbiddenMarkers(source)).toEqual([]);
    expect(source).toContain("ListTables only returns table names, so describe each table to populate the CloudResource metadata used by the explorer.");
  });

  it("keeps the DynamoDB adapter free of debug markers and temporary comments", () => {
    const source = readSource(dynamoDbAdapterPath);

    expect(findForbiddenMarkers(source)).toEqual([]);
    expect(source).not.toContain("temporary");
  });
});

function readSource(filePath: string): string {
  return readFileSync(filePath, "utf8");
}

function findForbiddenMarkers(source: string): string[] {
  return FORBIDDEN_MARKERS.filter((marker) => source.includes(marker));
}
