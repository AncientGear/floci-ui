import {describe, expect, test} from 'bun:test'
import {awsClients, awsRegion} from './aws'

describe('aws client registry', () => {
    test('exposes a dynamodb client', () => {
        expect(typeof awsClients.dynamodb.send).toBe('function')
    })

    test('exports the resolved aws region', () => {
        expect(awsRegion).toBe(process.env.AWS_REGION ?? 'us-east-1')
    })
})
