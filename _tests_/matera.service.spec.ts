import { MateraService } from '../src/services/matera.service';
import { HttpDAO } from '../src/interfaces';
import { createHmac } from 'crypto';
import { Account } from '../src/types';
import { MateraResponseAlias } from '../src/types/matera';
describe('MateraService', () => {
    process.env.MATERA_BASEURL = 'http://url/'
    process.env.SECRET_KEY = 'IcantTellYou'
    process.env.API_ACCESS_KEY = 'ThisIsAKey'

    describe('getBalance', () => {
        it('Should bring the balance of account', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn().mockResolvedValue({
                    data: {
                        accountId: 'string',
                        date: new Date(),
                        real: 100,
                        avaliable: 100,
                        overdraft: 0,
                        blocked: 0,
                        autoInvest: 0,
                        emergencyAidBalance: 0,
                        availableBalanceForTransactions: 100,
                    }
                }),

                post: jest.fn()
            }

            const matera = new MateraService(httpClient)

            jest.spyOn(httpClient, 'get')

            const hash = createHmac('sha256', process.env.SECRET_KEY!)
                .update('x')
                .digest('hex');

            const result = await matera.getBalance('x')
            expect(result.availableBalanceForTransactions).toBe(100)
            expect(httpClient.get).toBeCalledWith(
                "http://url//v2/accounts/x/balance",
                {
                    headers: {
                        "Api-Access-Key": "ThisIsAKey",
                        "Transaction-Hash": hash
                    }
                }
            )

        })

        it('Should throw a error from Matera', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn().mockRejectedValue({ response: { data: { error: new Error('SERVER IS OFFLINE') } } }),

                post: jest.fn()
            }

            const matera = new MateraService(httpClient)

            try {
                await matera.getBalance('x')
            } catch (error: any) {
                expect(error.message).toBe('Error: SERVER IS OFFLINE')
            }
        })

        it('Should throw a error from httpClient', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn().mockRejectedValue(new Error('ERROR ON MAKE REQUEST')),

                post: jest.fn()
            }

            const matera = new MateraService(httpClient)

            try {
                await matera.getBalance('x')
            } catch (error: any) {
                expect(error.message).toBe('ERROR ON MAKE REQUEST')
            }
        })

    })
    describe('getAlias', () => {
        it('Should bring the alias data from Matera', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn().mockResolvedValue({
                    data: {
                        aliasType: 'EMAIL'
                    }
                }),

                post: jest.fn()
            }

            const matera = new MateraService(httpClient)
            const result = await matera.getAlias('x', 'y')

            expect(result).toStrictEqual({ aliasType: 'EMAIL' })
        })

        it('Should throw a error from Matera', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn().mockRejectedValue({ response: { data: { error: new Error('SERVER IS OFFLINE') } } }),

                post: jest.fn()
            }

            const matera = new MateraService(httpClient)

            try {
                await matera.getAlias('x', 'y')
            } catch (error: any) {
                expect(error.message).toBe('Error: SERVER IS OFFLINE')
            }
        })

        it('Should throw a error from httpClient', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn().mockRejectedValue(new Error('ERROR ON MAKE REQUEST')),

                post: jest.fn()
            }

            const matera = new MateraService(httpClient)

            try {
                await matera.getAlias('x', 'y')
            } catch (error: any) {
                expect(error.message).toBe('ERROR ON MAKE REQUEST')
            }
        })
    })
    describe('postCashout', () => {
        it('Should request a cashout to Matera, and create it with success', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn(),

                post: jest.fn().mockResolvedValue({
                    data: {
                        transactionId: 'string',
                        externalIdentifier: 'string',
                        status: 'CREATED',
                        receipt: 'string',
                        authenticationCode: 'string'
                    }
                })
            }

            const matera = new MateraService(httpClient)
            const account = {
                integrationMetadata: [
                    {
                        service: 'MATERA',
                        data: {
                            accountHolderId: '123',
                            accountId: 'ABC'
                        },
                    },
                ],
                withdrawKey: 'withdraw_key',
                cpfCnpj: 'cpf_cnpj'

            }
            const mockAlias: MateraResponseAlias = {
                alias: 'alias',
                aliasType: 'aliasType',
                aliasAccountHolder: {
                    taxIdentifier: {
                        taxId: 'cpf_cnpj',
                        country: 'BRA',
                        taxIdMasked: ''
                    },
                    name: 'name'
                },
                accountDestination: {
                    branch: 'branch',
                    account: 'account',
                    accountType: 'accountType'
                },
                psp: {
                    id: 'id',
                    name: 'name',
                    country: 'BRA',
                    currencies: []
                },
                endToEndId: 'endToEndId',
                creationDate: new Date(),
                antiFraudClearingInfo: {
                    lastUpdated: new Date(),
                    counters: [{
                        type: 'string',
                        by: 'string',
                        d3: 1,
                        d30: 2,
                        m6: 3,
                    }]
                }
            }
            jest.spyOn(matera, 'getAlias').mockResolvedValue(mockAlias)
            jest.spyOn(matera, 'postCashout')

            const result = await matera.postCashout(account as Account, '123', 100, 0.5)
            expect(result).toStrictEqual({
                destinationAccount: {
                    cpfCnpj: 'cpf_cnpj',
                    account: 'account',
                    accountType: 'accountType',
                    agency: 'branch',
                    aliasType: 'aliasType',
                    key: 'alias',
                    name: 'name',
                    psp: { country: 'BRA', id: 'id', name: 'name' }
                },
                transactionId: 'string',
                externalIdentifier: 'string',
                status: 'CREATED',
                receipt: 'string',
                authenticationCode: 'string'
            }
            )

            expect(httpClient.post).toBeCalledWith(
                "http://url//v1/accounts/ABC/withdraw",
                {
                    mediatorFee: 0.5,
                    totalAmount: 99.5,
                    value: 99.5,
                    currency: "BRL",
                    externalIdentifier: "123",
                    withdrawInfo: {
                        instantPayment: {
                            recipient: {
                                accountDestination: {
                                    account: "account",
                                    accountType: "accountType",
                                    branch: "branch"
                                },
                                alias: "alias",
                                endToEndIdQuery: "endToEndId",
                                pspId: "id",
                                taxIdentifier: {
                                    country: "BRA",
                                    taxId: "cpf_cnpj"
                                }
                            }
                        },
                        withdrawType: "InstantPayment"
                    }
                },
                {
                    headers: {
                        "Api-Access-Key": "ThisIsAKey",
                        "Transaction-Hash": '93942efb7e07b6eedbcc6054d05a0823f1d0475931c758449309ed75869043d0'
                    }
                }
            )

        })

        it('Should throw a error with message "Account Metadata is undefined"', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn(),

                post: jest.fn().mockResolvedValue({
                    data: {
                        transactionId: 'string',
                        externalIdentifier: 'string',
                        status: 'CREATED',
                        receipt: 'string',
                        authenticationCode: 'string'
                    }
                })
            }

            const matera = new MateraService(httpClient)
            const account = {
                integrationMetadata: [
                    {
                        service: 'OTHER_INTEGRATOR',
                        data: {
                            accountHolderId: '123',
                            accountId: 'ABC'
                        },
                    },
                ],
                withdrawKey: 'withdraw_key',
                cpfCnpj: 'cpf_cnpj'

            }
            try {
                await matera.postCashout(account as Account, '123', 100, 0.5)

            } catch (error: any) {
                expect(error.message).toBe('Account Metadata is undefined')
            }
        })

        it('Should throw a error with message "CPF/CNPJ da chave PIX não confere com o CPF/CNPJ da conta"', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn(),

                post: jest.fn().mockResolvedValue({
                    data: {
                        transactionId: 'string',
                        externalIdentifier: 'string',
                        status: 'CREATED',
                        receipt: 'string',
                        authenticationCode: 'string'
                    }
                })
            }

            const mockAlias: MateraResponseAlias = {
                alias: 'alias',
                aliasType: 'aliasType',
                aliasAccountHolder: {
                    taxIdentifier: {
                        taxId: 'not_equal',
                        country: 'BRA',
                        taxIdMasked: ''
                    },
                    name: 'name'
                },
                accountDestination: {
                    branch: 'branch',
                    account: 'account',
                    accountType: 'accountType'
                },
                psp: {
                    id: 'id',
                    name: 'name',
                    country: 'BRA',
                    currencies: []
                },
                endToEndId: 'endToEndId',
                creationDate: new Date(),
                antiFraudClearingInfo: {
                    lastUpdated: new Date(),
                    counters: [{
                        type: 'string',
                        by: 'string',
                        d3: 1,
                        d30: 2,
                        m6: 3,
                    }]
                }
            }
            const matera = new MateraService(httpClient)
            jest.spyOn(matera, 'getAlias').mockResolvedValue(mockAlias)

            const account = {
                integrationMetadata: [
                    {
                        service: 'MATERA',
                        data: {
                            accountHolderId: '123',
                            accountId: 'ABC'
                        },
                    },
                ],
                withdrawKey: 'withdraw_key',
                cpfCnpj: 'cpf_cnpj'
            }
            try {
                await matera.postCashout(account as Account, '123', 100, 0.5)
            } catch (error: any) {
                expect(error.message).toStrictEqual('CPF/CNPJ da chave PIX não confere com o CPF/CNPJ da conta',
                )
            }

        })

        it('Should throw a error from httpClient', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn(),

                post: jest.fn().mockRejectedValue(new Error('Any Error')),
            }
            const mockAlias: MateraResponseAlias = {
                alias: 'alias',
                aliasType: 'aliasType',
                aliasAccountHolder: {
                    taxIdentifier: {
                        taxId: 'cpf_cnpj',
                        country: 'BRA',
                        taxIdMasked: ''
                    },
                    name: 'name'
                },
                accountDestination: {
                    branch: 'branch',
                    account: 'account',
                    accountType: 'accountType'
                },
                psp: {
                    id: 'id',
                    name: 'name',
                    country: 'BRA',
                    currencies: []
                },
                endToEndId: 'endToEndId',
                creationDate: new Date(),
                antiFraudClearingInfo: {
                    lastUpdated: new Date(),
                    counters: [{
                        type: 'string',
                        by: 'string',
                        d3: 1,
                        d30: 2,
                        m6: 3,
                    }]
                }
            }
            const matera = new MateraService(httpClient)
            jest.spyOn(matera, 'getAlias').mockResolvedValue(mockAlias)

            const account = {
                integrationMetadata: [
                    {
                        service: 'MATERA',
                        data: {
                            accountHolderId: '123',
                            accountId: 'ABC'
                        },
                    },
                ],
                withdrawKey: 'withdraw_key',
                cpfCnpj: 'cpf_cnpj'

            }
            try {
                await matera.postCashout(account as Account, '123', 100, 0.5)
            } catch (error: any) {
                expect(error.message).toBe('Any Error')
            }
        })

        it('Should throw a error from Matera', async () => {
            const httpClient: HttpDAO = {
                get: jest.fn(),

                post: jest.fn().mockRejectedValue({ response: { data: { error: new Error('SERVER IS OFFLINE') } } }),
            }
            const mockAlias: MateraResponseAlias = {
                alias: 'alias',
                aliasType: 'aliasType',
                aliasAccountHolder: {
                    taxIdentifier: {
                        taxId: 'cpf_cnpj',
                        country: 'BRA',
                        taxIdMasked: ''
                    },
                    name: 'name'
                },
                accountDestination: {
                    branch: 'branch',
                    account: 'account',
                    accountType: 'accountType'
                },
                psp: {
                    id: 'id',
                    name: 'name',
                    country: 'BRA',
                    currencies: []
                },
                endToEndId: 'endToEndId',
                creationDate: new Date(),
                antiFraudClearingInfo: {
                    lastUpdated: new Date(),
                    counters: [{
                        type: 'string',
                        by: 'string',
                        d3: 1,
                        d30: 2,
                        m6: 3,
                    }]
                }
            }
            const matera = new MateraService(httpClient)
            jest.spyOn(matera, 'getAlias').mockResolvedValue(mockAlias)

            const account = {
                integrationMetadata: [
                    {
                        service: 'MATERA',
                        data: {
                            accountHolderId: '123',
                            accountId: 'ABC'
                        },
                    },
                ],
                withdrawKey: 'withdraw_key',
                cpfCnpj: 'cpf_cnpj'

            }
            try {
                await matera.postCashout(account as Account, '123', 100, 0.5)
            } catch (error: any) {
                expect(error.message).toBe('Error: SERVER IS OFFLINE')
            }
        })
    })
})