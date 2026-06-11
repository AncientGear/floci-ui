import {describe, expect, test} from 'bun:test'
import {awsDynamoDbSchema, dynamodbSchemaFor} from './dynamodbSchema'

describe('dynamodb schema', () => {
    test('returns the aws dynamodb schema', () => {
        const schema = awsDynamoDbSchema()

        expect(schema.cloud).toBe('aws')
        expect(schema.service).toBe('dynamodb')
        expect(schema.displayName).toBe('DynamoDB')
        expect(schema.actions).toEqual(['list', 'inspect'])
        expect(schema.columns.map((column) => column.name)).toEqual([
            'name',
            'status',
            'billingMode',
            'itemCount',
            'sizeBytes',
        ])
    })

    test('returns a provider fallback only for aws', () => {
        expect(dynamodbSchemaFor('aws')?.displayName).toBe('DynamoDB')
        expect(dynamodbSchemaFor('azure')).toBeNull()
        expect(dynamodbSchemaFor('gcp')).toBeNull()
    })
})
