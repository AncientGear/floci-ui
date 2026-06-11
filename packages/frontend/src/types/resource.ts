import type {CloudProvider, CloudServiceType} from './cloud'

export const CLOUD_RESOURCE_TYPE = {
    BUCKET: 'bucket',
    CONTAINER: 'container',
    CLUSTER: 'cluster',
    DB_INSTANCE: 'db-instance',
    COSMOS_DATABASE: 'cosmos-database',
    DYNAMODB_TABLE: 'dynamodb-table',
    INSTANCE: 'instance',
    IMAGE: 'image',
    VPC: 'vpc',
    LAMBDA: 'lambda',
    AZURE_FUNCTION: 'azure-function',
} as const

export type CloudResourceType = (typeof CLOUD_RESOURCE_TYPE)[keyof typeof CLOUD_RESOURCE_TYPE]

export interface CloudResource {
    id: string
    name: string
    cloud: CloudProvider
    service: CloudServiceType
    type: CloudResourceType
    region: string | null
    createdAt: string | null
    status?: string | null
    version?: string | null
    engine?: string | null
    instanceClass?: string | null
    metadata: Record<string, unknown>
}

export interface StorageObject {
    key: string
    name: string
    type: 'folder' | 'object'
    size: number | null
    lastModified: string | null
    metadata: Record<string, unknown>
}

export interface StorageObjectList {
    prefix: string
    objects: StorageObject[]
}

export interface CosmosContainer {
    id: string
    name: string
    databaseId: string
    partitionKeyPath: string
    createdAt: string | null
    metadata: Record<string, unknown>
}

export interface CosmosItem {
    id: string
    databaseId: string
    containerId: string
    partitionKey: string | null
    etag: string | null
    timestamp: string | null
    document: Record<string, unknown>
}

export interface CosmosQueryResult {
    items: Array<Record<string, unknown> | string | number | boolean | null>
    count: number
}
