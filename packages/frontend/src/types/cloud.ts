export const CLOUD_PROVIDER = {
    AWS: 'aws',
    AZURE: 'azure',
    GCP: 'gcp',
} as const

export type CloudProvider = (typeof CLOUD_PROVIDER)[keyof typeof CLOUD_PROVIDER]

export const CLOUD_AVAILABILITY = {
    AVAILABLE: 'available',
    COMING_SOON: 'coming_soon',
} as const

export type CloudAvailability = (typeof CLOUD_AVAILABILITY)[keyof typeof CLOUD_AVAILABILITY]

export const CLOUD_SERVICE = {
    STORAGE: 'storage',
    K8S: 'k8s',
    DATABASE: 'database',
    DYNAMODB: 'dynamodb',
    COMPUTE: 'compute',
    NETWORKING: 'networking',
    SERVERLESS: 'serverless',
} as const

export type CloudServiceType = (typeof CLOUD_SERVICE)[keyof typeof CLOUD_SERVICE]

export interface CloudDescriptor {
    id: CloudProvider
    displayName: string
    availability: CloudAvailability
}

export interface CloudServiceDescriptor {
    cloud: CloudProvider
    service: CloudServiceType
    displayName: string
    availability: CloudAvailability
}

export interface CloudStatus {
    cloud: CloudProvider
    adapterRegistered: boolean
    runtime: 'reachable' | 'unavailable' | 'coming_soon'
    endpoint: string | null
    checkedAt: string
    error: string | null
}
