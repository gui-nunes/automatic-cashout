/* eslint-disable @typescript-eslint/no-explicit-any */
import Cashout from '../src/usecase/cashout'
import { AmqpDAO, DatabaseDAO, MateraDAO } from '../src/interfaces';

describe("Cashout", () => {
    it("Should execute cashout successfully", async () => {
        const mockAMQProtocol: AmqpDAO = {
            send: jest.fn().mockResolvedValue({ data: 0.5 }),
        };

        const mockTCProtocol: DatabaseDAO = {
            getAccount: jest.fn().mockResolvedValue({
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            }),
            createTransaction: jest.fn().mockResolvedValue({
                id: "transaction_id",
                value: 9.5,
            }),
            updateTransaction: jest.fn().mockResolvedValue(null),
            getIds: jest.fn().mockResolvedValue(null)
        };

        const mockHTTProtocol: MateraDAO = {
            getBalance: jest.fn().mockResolvedValue({ availableBalanceForTransactions: 10 }),


            postCashout: jest.fn().mockResolvedValue({
                destinationAccount: {
                    cpfCnpj: 'cpf_cnpj',
                    account: 'account',
                    accountType: 'accountType',
                    agency: 'agency',
                    aliasType: 'aliasType',
                    key: 'key',
                    name: 'name',
                    psp: { country: 'BRA', id: 'id', name: 'name' }
                },
                status: 'CREATED',
                transactionId: 'transactionId'
            })

        };

        const cashout = new Cashout(mockHTTProtocol, mockTCProtocol, mockAMQProtocol);
        await cashout.execute("123abc");

        expect(mockHTTProtocol.getBalance).toHaveBeenCalledWith("abc123");
        expect(mockTCProtocol.getAccount).toHaveBeenCalledWith("123abc");
        expect(mockTCProtocol.createTransaction).toHaveBeenCalledWith(
            {
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            },
            0.5,
            9.5,
        );
        expect(mockHTTProtocol.postCashout).toHaveBeenCalledWith(
            {
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            },
            "transaction_id",
            9.5,
            0.5,
        );
        expect(mockTCProtocol.updateTransaction).toHaveBeenCalledWith(
            "transaction_id",
            {
                destinationAccount: {
                    cpfCnpj: 'cpf_cnpj',
                    account: 'account',
                    accountType: 'accountType',
                    agency: 'agency',
                    aliasType: 'aliasType',
                    key: 'key',
                    name: 'name',
                    psp: { country: 'BRA', id: 'id', name: 'name' }
                },
                integrationMetadata: {
                    transactionId: 'transactionId'
                },
                status: "CREATED",
            }
        );
    });

    it("Should throw a error if metadata its empty", async () => {
        const mockAMQProtocol: AmqpDAO = {
            send: jest.fn().mockResolvedValue({ data: null }),
        };

        const mockTCProtocol: DatabaseDAO = {
            getAccount: jest.fn().mockResolvedValue({
                integrationMetadata: [],
                name: 'account_test'
            }),
            createTransaction: jest.fn().mockResolvedValue(null),
            updateTransaction: jest.fn().mockResolvedValue(null),
            getIds: jest.fn().mockResolvedValue(null)

        };

        const mockHTTProtocol: MateraDAO = {
            getBalance: jest.fn().mockResolvedValue(null),

            postCashout: jest.fn().mockResolvedValue(null),
        };

        const cashout = new Cashout(mockHTTProtocol, mockTCProtocol, mockAMQProtocol);

        try {
            await cashout.execute("123abc");
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
        } catch (error: any) {
            expect(error.message).toBe(`Integration data of account account_test not found`)

        }

    })

    it("Should throw a error if the balance in account its less then 5 + rate", async () => {
        const mockAMQProtocol: AmqpDAO = {
            send: jest.fn().mockResolvedValue({ data: null }),
        };

        const mockTCProtocol: DatabaseDAO = {
            getAccount: jest.fn().mockResolvedValue({
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            }),
            createTransaction: jest.fn().mockResolvedValue(null),
            updateTransaction: jest.fn().mockResolvedValue(null),
            getIds: jest.fn().mockResolvedValue(null)
        };


        const mockHTTProtocol: MateraDAO = {
            getBalance: jest.fn().mockResolvedValue({ availableBalanceForTransactions: 5 }),

            postCashout: jest.fn().mockResolvedValue(null),
        };

        const cashout = new Cashout(mockHTTProtocol, mockTCProtocol, mockAMQProtocol);

        try {
            await cashout.execute('')
        } catch (error: any) {
            expect(error.message).toBe('Balance in account less then 5')
        }

    })

    it("Should throw a error, updating the status of transaction on database", async () => {
        const mockAMQProtocol: AmqpDAO = {
            send: jest.fn().mockResolvedValue({ data: 0.5 }),
        };

        const mockTCProtocol: DatabaseDAO = {
            getAccount: jest.fn().mockResolvedValue({
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            }),
            createTransaction: jest.fn().mockResolvedValue({
                id: "transaction_id",
                value: 9.5,
            }),
            updateTransaction: jest.fn().mockResolvedValue(null),
            getIds: jest.fn().mockResolvedValue(null)
        };

        const mockHTTProtocol: MateraDAO = {
            getBalance: jest.fn().mockResolvedValue({ availableBalanceForTransactions: 10 }),

            postCashout: jest.fn().mockRejectedValue(
                new Error('Any error')
            ),
        };


        const cashout = new Cashout(mockHTTProtocol, mockTCProtocol, mockAMQProtocol);

        try {
            await cashout.execute("123abc");
        } catch (error: any) {
            expect(error.message).toBe('Any error')
        }

        expect(mockHTTProtocol.getBalance).toHaveBeenCalledWith("abc123");
        expect(mockTCProtocol.getAccount).toHaveBeenCalledWith("123abc");
        expect(mockTCProtocol.createTransaction).toHaveBeenCalledWith(
            {
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            },
            0.5,
            9.5,
        );
        expect(mockHTTProtocol.postCashout).toHaveBeenCalledWith(
            {
                integrationMetadata: [{ service: "MATERA", data: { accountId: "abc123" } }],
                name: "Test Account",
                withdrawKey: "withdraw_key",
            },
            "transaction_id",
            9.5,
            0.5,
        );


        expect(mockTCProtocol.updateTransaction).toHaveBeenCalledWith(
            "transaction_id",
            {
                status: "ERROR",
            }
        );
    });
});
