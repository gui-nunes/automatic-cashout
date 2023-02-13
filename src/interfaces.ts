import { Account, Transaction, MateraResponseBalance, CashoutResponse, } from "./types"

export interface AmqpDAO {
    send<T, R>(message: T, routingKey: string): Promise<R>
}

export interface MateraDAO {
    getBalance(accountId: string): Promise<MateraResponseBalance>
    postCashout(account: Account, id: string, value: number, rate: number): Promise<
        CashoutResponse
    >
}

export interface DatabaseDAO {
    getAccount(id: string): Promise<Account>
    getIds(): Promise<Array<{ id: string }>>
    createTransaction(account: { cpfCnpj: string, withdrawKey: string }, cashoutFee: number, value: number): Promise<Transaction>
    updateTransaction(id: string, data: Partial<Transaction>): Promise<Transaction>
}

export interface HttpDAO {
    get(url: string, options?: object): Promise<any>;
    post(url: string, data?: any, options?: object): Promise<any>;
}