import {awsDynamoDbSchema} from '../cloud-spi/dynamodbSchema'
import type {
    CloudResource,
    CloudServiceAdapter,
    CreateResourceInput,
    ResourceQuery,
    ServiceSchema,
} from '../cloud-spi/types'
import {dynamoDbService, type DynamoDbTable} from '../services/dynamodb'

type DynamoDbServiceShape = {
    listTables(): Promise<DynamoDbTable[]>
    describeTable(tableName: string): Promise<DynamoDbTable>
}

export class AwsDynamoDbAdapter implements CloudServiceAdapter {
    readonly cloud = 'aws' as const
    readonly service = 'dynamodb' as const

    constructor(private readonly service_: DynamoDbServiceShape = dynamoDbService) {}

    schema(): ServiceSchema {
        return awsDynamoDbSchema()
    }

    async list(query: ResourceQuery = {}): Promise<CloudResource[]> {
        const resources = (await this.service_.listTables()).map(tableToResource)
        return filterBySearch(resources, query.search)
    }

    async get(id: string): Promise<CloudResource | null> {
        try {
            return tableToResource(await this.service_.describeTable(id))
        } catch (error) {
            if (hasNotFoundStatus(error)) return null
            throw error
        }
    }

    async create(_input: CreateResourceInput): Promise<CloudResource> {
        throw new Error('DynamoDB table creation is not supported from the dynamic Cloud Explorer.')
    }

    async delete(_id: string): Promise<void> {
        throw new Error('DynamoDB table deletion is not supported from the dynamic Cloud Explorer.')
    }
}

function tableToResource(table: DynamoDbTable): CloudResource {
    return {
        id: table.tableName,
        name: table.tableName,
        cloud: 'aws',
        service: 'dynamodb',
        type: 'dynamodb-table',
        region: table.region,
        createdAt: table.createdAt ?? null,
        status: table.status ?? null,
        metadata: {
            arn: table.arn,
            billingMode: table.billingMode,
            itemCount: table.itemCount,
            sizeBytes: table.sizeBytes,
            keySchema: table.keySchema,
        },
    }
}

function filterBySearch(resources: CloudResource[], search?: string): CloudResource[] {
    const normalized = search?.trim().toLowerCase()
    if (!normalized) return resources
    return resources.filter((resource) => resource.name.toLowerCase().includes(normalized))
}

function hasNotFoundStatus(error: unknown): boolean {
    if (typeof error !== 'object' || error === null) return false
    const metadata = (error as {$metadata?: {httpStatusCode?: number}}).$metadata
    const name = 'name' in error ? error.name : undefined
    return metadata?.httpStatusCode === 404 || name === 'ResourceNotFoundException'
}
