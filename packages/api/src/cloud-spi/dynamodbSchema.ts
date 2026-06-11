import type {CloudProvider, FieldSchema, ServiceSchema, TableColumnSchema} from './types'

const dynamodbColumns: TableColumnSchema[] = [
    {name: 'name', label: 'Name'},
    {name: 'status', label: 'Status'},
    {name: 'billingMode', label: 'Billing Mode'},
    {name: 'itemCount', label: 'Item Count'},
    {name: 'sizeBytes', label: 'Size (Bytes)'},
]

const dynamodbFilters: FieldSchema[] = [
    {name: 'search', label: 'Search', type: 'text', required: false},
]

export function awsDynamoDbSchema(): ServiceSchema {
    return {
        cloud: 'aws',
        service: 'dynamodb',
        displayName: 'DynamoDB',
        fields: [],
        actions: ['list', 'inspect'],
        filters: dynamodbFilters,
        columns: dynamodbColumns,
    }
}

export function dynamodbSchemaFor(cloud: CloudProvider): ServiceSchema | null {
    if (cloud === 'aws') return awsDynamoDbSchema()
    return null
}
