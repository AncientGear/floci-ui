import {describe, expect, test} from 'bun:test'
import {AwsDynamoDbAdapter} from './AwsDynamoDbAdapter'
import type {DynamoDbTable} from '../services/dynamodb'

const baseTable: DynamoDbTable = {
    tableName: 'users',
    arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/users',
    status: 'ACTIVE',
    billingMode: 'PAY_PER_REQUEST',
    itemCount: 12,
    sizeBytes: 256,
    keySchema: [{attributeName: 'pk', keyType: 'HASH'}],
    region: 'us-east-1',
    createdAt: '2025-01-01T00:00:00.000Z',
}

function fakeService(overrides: Partial<{
    listTables: () => Promise<DynamoDbTable[]>
    describeTable: (tableName: string) => Promise<DynamoDbTable>
}> = {}) {
    return {
        listTables: async () => [baseTable],
        describeTable: async (_tableName: string) => baseTable,
        ...overrides,
    }
}

describe('AwsDynamoDbAdapter', () => {
    test('list returns mapped CloudResource array', async () => {
        const adapter = new AwsDynamoDbAdapter(fakeService())
        const result = await adapter.list()

        expect(result).toHaveLength(1)
        expect(result[0]).toMatchObject({
            id: 'users',
            name: 'users',
            cloud: 'aws',
            service: 'dynamodb',
            type: 'dynamodb-table',
            status: 'ACTIVE',
            region: 'us-east-1',
        })
        expect(result[0].metadata).toEqual({
            arn: 'arn:aws:dynamodb:us-east-1:123456789012:table/users',
            billingMode: 'PAY_PER_REQUEST',
            itemCount: 12,
            sizeBytes: 256,
            keySchema: [{attributeName: 'pk', keyType: 'HASH'}],
        })
    })

    test('list filters results by search term', async () => {
        const adapter = new AwsDynamoDbAdapter(fakeService({
            listTables: async () => [
                baseTable,
                {...baseTable, tableName: 'orders'},
            ],
        }))

        const result = await adapter.list({search: 'user'})

        expect(result).toHaveLength(1)
        expect(result[0].name).toBe('users')
    })

    test('list returns an empty array when no tables exist', async () => {
        const adapter = new AwsDynamoDbAdapter(fakeService({
            listTables: async () => [],
        }))

        await expect(adapter.list()).resolves.toEqual([])
    })

    test('get returns null when the table is not found', async () => {
        const notFound = Object.assign(new Error('Requested resource not found'), {
            name: 'ResourceNotFoundException',
            $metadata: {httpStatusCode: 404},
        })
        const adapter = new AwsDynamoDbAdapter(fakeService({
            describeTable: async () => {
                throw notFound
            },
        }))

        await expect(adapter.get('missing')).resolves.toBeNull()
    })

    test('get rethrows non-404 errors', async () => {
        const adapter = new AwsDynamoDbAdapter(fakeService({
            describeTable: async () => {
                throw new Error('boom')
            },
        }))

        await expect(adapter.get('users')).rejects.toThrow('boom')
    })

    test('schema returns the aws dynamodb schema', () => {
        const adapter = new AwsDynamoDbAdapter(fakeService())
        const schema = adapter.schema()

        expect(schema.cloud).toBe('aws')
        expect(schema.service).toBe('dynamodb')
        expect(schema.displayName).toBe('DynamoDB')
        expect(schema.actions).toContain('list')
        expect(schema.actions).toContain('inspect')
    })
})
