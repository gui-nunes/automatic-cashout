import { DatabaseDAO } from '../interfaces';
import { Account, Transaction } from '../types';
import { PrismaClient } from '@prisma/client';
export class PrismaService implements DatabaseDAO {
    private prisma = new PrismaClient();
    constructor() {
        this.init();
    }
    async init(): Promise<void> {
        try {
            await this.prisma.$connect();
        } catch (error) {
            throw new Error('Error on init connection: ' + error);
        }
    }

    async disconnect(): Promise<void> {
        try {
            await this.prisma.$disconnect();
        } catch (error) {
            throw new Error('Error on gracefully disconnect: ' + error);
        }
    }
    async getAccount(id: string): Promise<Account> {
        const account = await this.prisma.account.findUniqueOrThrow({
            where: { id: id },
        }) as unknown as Account
        return account
    }

    async getIds(): Promise<{ id: string }[]> {
        return await this.prisma.account.findMany({
            where: {
                status: 'ENABLED',
                AND: {
                    NOT: {
                        cashoutTime: undefined,
                    },
                },
            },
            select: {
                id: true
            }
        });
    }

    async createTransaction(account: { cpfCnpj: string; withdrawKey: string; }, cashoutFee: number, value: number): Promise<Transaction> {
        const transaction = (await this.prisma.transaction.create({
            data: {
                cpfCnpj: account.cpfCnpj,
                withdrawKey: account.withdrawKey,
                status: 'DATA_CREATED',
                value: value,
                type: 'AUTOMATIC_CASHOUT',
                service: 'MATERA',
                cashoutFee: cashoutFee,
            }
        })) as unknown as Transaction;
        return transaction;
    }
    async updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction> {
        const transaction = await this.prisma.transaction.update({
            where: { id: id },
            data: {
                status: data.status,
                destinationAccount: data.destinationAccount,
                integrationMetadata: data.integrationMetadata,
                cashoutFee: data.cashoutFee,
            },
        });
        return transaction as unknown as Transaction;

    }

}