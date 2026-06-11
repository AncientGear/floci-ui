import {describe, expect, test} from 'bun:test'
import {DescribeTableCommand, ListTablesCommand, type DynamoDBClient} from '@aws-sdk/client-dynamodb'
import {createDynamoDbService} from './dynamodb'

type SentCommand = {
    name: string
    input: unknown
}

function fakeClient(handler: (command: DescribeTableCommand | ListTablesCommand) => Promise<unknown>): Pick<DynamoDBClient, 'send'> {
    return {
        send: handler as DynamoDBClient['send'],
    }
}

describe('dynamodb service', () => {
    test('listTables paginates list calls and normalizes described tables', async () => {
        const sent: SentCommand[] = []
        const service = createDynamoDbService(fakeClient(async (command) => {
            sent.push({name: command.constructor.name, input: command.input})

            if (command instanceof ListTablesCommand && !command.input.ExclusiveStartTableName) {
                return {
                    TableNames: ['users'],
                    LastEvaluatedTableName: 'users',
                }
            }

            if (command instanceof ListTablesCommand) {
                return {
                    TableNames: ['orders'],
                }
            }

            if (command.input.TableName === 'users') {
                return {
                    Table: {
                        TableName: 'users',
                        TableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/users',
                        TableStatus: 'ACTIVE',
                        BillingModeSummary: {BillingMode: 'PAY_PER_REQUEST'},
                        ItemCount: 12,
                        TableSizeBytes: 256,
                        KeySchema: [{AttributeName: 'pk', KeyType: 'HASH'}],
                        CreationDateTime: new Date('2025-01-01T00:00:00.000Z'),
                    },
                }
            }

            return {
                Table: {
                    TableName: 'orders',
                    TableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/orders',
                    TableStatus: 'CREATING',
                    BillingModeSummary: {BillingMode: 'PROVISIONED'},
                    ItemCount: 3,
                    TableSizeBytes: 128,
                    KeySchema: [{AttributeName: 'orderId', KeyType: 'HASH'}],
                    CreationDateTime: new Date('2025-01-02T00:00:00.000Z'),
                },
            }
        }), 'us-east-1')

        const tables = await service.listTables()

        expect(tables).toHaveLength(2)
        expect(tables[0]).toMatchObject({
            tableName: 'users',
            status: 'ACTIVE',
            billingMode: 'PAY_PER_REQUEST',
            itemCount: 12,
            sizeBytes: 256,
            region: 'us-east-1',
        })
        expect(tables[1]).toMatchObject({
            tableName: 'orders',
            status: 'CREATING',
            billingMode: 'PROVISIONED',
            itemCount: 3,
        })
        expect(sent).toEqual([
            {name: 'ListTablesCommand', input: {}},
            {name: 'ListTablesCommand', input: {ExclusiveStartTableName: 'users'}},
            {name: 'DescribeTableCommand', input: {TableName: 'users'}},
            {name: 'DescribeTableCommand', input: {TableName: 'orders'}},
        ])
    })

    test('returns an empty list when aws reports no tables', async () => {
        const service = createDynamoDbService(fakeClient(async (command) => {
            if (command instanceof ListTablesCommand) return {TableNames: []}
            throw new Error('DescribeTable should not be called when there are no tables')
        }), 'us-east-1')

        await expect(service.listTables()).resolves.toEqual([])
    })

    test('describeTable normalizes a single table result', async () => {
        const service = createDynamoDbService(fakeClient(async (command) => {
            if (command instanceof DescribeTableCommand) {
                return {
                    Table: {
                        TableName: 'users',
                        TableArn: 'arn:aws:dynamodb:us-east-1:123456789012:table/users',
                        TableStatus: 'ACTIVE',
                        BillingModeSummary: {BillingMode: 'PAY_PER_REQUEST'},
                        ItemCount: 12,
                        TableSizeBytes: 256,
                        KeySchema: [{AttributeName: 'pk', KeyType: 'HASH'}],
                        CreationDateTime: new Date('2025-01-01T00:00:00.000Z'),
                    },
                }
            }

            throw new Error('ListTables should not be called during describeTable')
        }), 'us-east-1')

        const table = await service.describeTable('users')

        expect(table).toEqual({
            tableName: 'users',
            arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/users',
            status: 'ACTIVE',
            billingMode: 'PAY_PER_REQUEST',
            itemCount: 12,
            sizeBytes: 256,
            keySchema: [{attributeName: 'pk', keyType: 'HASH'}],
            region: 'us-east-1',
            createdAt: '2025-01-01T00:00:00.000Z',
        })
    })
})
