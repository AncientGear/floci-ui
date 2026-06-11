import {describe, expect, mock, test} from 'bun:test'

const requestedAccountIds: Array<string | null | undefined> = []

mock.module('../cloudProxy', () => ({
    serviceForAccount(accountId?: string | null) {
        requestedAccountIds.push(accountId)

        const resolvedAccountId = accountId ?? '000000000000'

        return {
            clouds: () => [],
            services: () => [],
            status: async () => ({cloud: 'aws', adapterRegistered: true, runtime: 'reachable', endpoint: 'http://localhost:4566', checkedAt: new Date().toISOString(), error: null}),
            schema: () => null,
            listResources: async () => [{
                id: `table-${resolvedAccountId}`,
                name: `table-${resolvedAccountId}`,
                cloud: 'aws',
                service: 'dynamodb',
                type: 'dynamodb-table',
                region: 'us-east-1',
                createdAt: null,
                status: 'ACTIVE',
                metadata: {accountId: resolvedAccountId},
            }],
        }
    },
}))

const {createCloudRoutes, ACCOUNT_HEADER} = await import('./clouds')

describe('cloud account routing', () => {
    test('scopes dynamodb resources by x-floci-account-id', async () => {
        const app = createCloudRoutes()

        const firstResponse = await app.request('/aws/services/dynamodb/resources', {
            headers: {[ACCOUNT_HEADER]: '111111111111'},
        })
        const secondResponse = await app.request('/aws/services/dynamodb/resources', {
            headers: {[ACCOUNT_HEADER]: '222222222222'},
        })

        expect(firstResponse.status).toBe(200)
        expect(secondResponse.status).toBe(200)
        expect(await firstResponse.json()).toEqual([expect.objectContaining({
            id: 'table-111111111111',
            metadata: {accountId: '111111111111'},
        })])
        expect(await secondResponse.json()).toEqual([expect.objectContaining({
            id: 'table-222222222222',
            metadata: {accountId: '222222222222'},
        })])
        expect(requestedAccountIds).toEqual(['111111111111', '222222222222'])
    })
})
