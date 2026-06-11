import {
    DescribeTableCommand,
    ListTablesCommand,
    type DynamoDBClient,
    type KeySchemaElement,
    type TableDescription,
} from '@aws-sdk/client-dynamodb'
import {awsClients, awsRegion} from '../aws'

export type DynamoDbKeySchema = {
    attributeName?: string
    keyType?: string
}

export type DynamoDbTable = {
    tableName: string
    arn?: string
    status?: string
    billingMode?: string
    itemCount?: number
    sizeBytes?: number
    keySchema: DynamoDbKeySchema[]
    region: string
    createdAt?: string
}

type DynamoDbClientShape = Pick<DynamoDBClient, 'send'>

export function createDynamoDbService(client: DynamoDbClientShape = awsClients.dynamodb, region: string = awsRegion) {
    return {
        async listTables(): Promise<DynamoDbTable[]> {
            const tableNames: string[] = []
            let lastEvaluatedTableName: string | undefined

            do {
                const response = await client.send(new ListTablesCommand({
                    ...(lastEvaluatedTableName ? {ExclusiveStartTableName: lastEvaluatedTableName} : {}),
                }))
                tableNames.push(...(response.TableNames ?? []))
                lastEvaluatedTableName = response.LastEvaluatedTableName
            } while (lastEvaluatedTableName)

            // ListTables only returns table names, so describe each table to populate the CloudResource metadata used by the explorer.
            return Promise.all(tableNames.map((tableName) => this.describeTable(tableName)))
        },

        async describeTable(tableName: string): Promise<DynamoDbTable> {
            const response = await client.send(new DescribeTableCommand({TableName: tableName}))
            return toDynamoDbTable(response.Table ?? {}, region)
        },
    }
}

function toDynamoDbTable(table: TableDescription, region: string): DynamoDbTable {
    return {
        tableName: table.TableName ?? '',
        arn: table.TableArn,
        status: table.TableStatus,
        billingMode: table.BillingModeSummary?.BillingMode,
        itemCount: table.ItemCount,
        sizeBytes: table.TableSizeBytes,
        keySchema: (table.KeySchema ?? []).map(toKeySchema),
        region,
        createdAt: table.CreationDateTime?.toISOString(),
    }
}

function toKeySchema(key: KeySchemaElement): DynamoDbKeySchema {
    return {
        attributeName: key.AttributeName,
        keyType: key.KeyType,
    }
}

export const dynamoDbService = createDynamoDbService()
