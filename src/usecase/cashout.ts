import { DatabaseDAO, AmqpDAO, MateraDAO } from '../interfaces';
import { CashoutResponse } from "../types";
import { TransactionStatus } from '../types/enums';
export default class Cashout {
    constructor(
        readonly materaService: MateraDAO,
        readonly prismaService: DatabaseDAO,
        readonly amqpService: AmqpDAO,
    ) { }
    async execute(accountId: string) {

        const rate: { data: number } = await this.amqpService.send<string, { data: number }>('', 'payment.cashoutfee');
        // const rate: { data: number } = { data: 0.5 }
        if (!rate?.data) {
            rate.data = 0.5
        }

        const account = await this.prismaService.getAccount(accountId);

        const metadata = account.integrationMetadata.find((metadata) => {
            return metadata.service == 'MATERA';
        });

        if (!metadata) {
            throw new Error(`Integration data of account ${account.name} not found`)
        }

        const accountBalance = await this.materaService.getBalance(metadata.data.accountId);
        if (accountBalance.availableBalanceForTransactions < 5 + rate.data) {
            throw new Error('Balance in account less then 5');
        }
        const transaction = await this.prismaService.createTransaction(
            account,
            rate.data,
            accountBalance.availableBalanceForTransactions - rate.data,
        );
        let responseData: CashoutResponse;

        try {
            responseData = await this.materaService.postCashout(
                account,
                transaction.id,
                transaction.value,
                rate.data,
            );
        } catch (error) {
            await this.prismaService.updateTransaction(transaction.id, { status: 'ERROR' });
            throw error;
        }
        let status: TransactionStatus
        if (responseData.status != "CREATED") {
            status = 'ERROR'
        } else {
            status = 'CREATED'
        }
        await this.prismaService.updateTransaction(
            transaction.id,
            {
                destinationAccount: responseData.destinationAccount,
                integrationMetadata: {
                    transactionId: responseData.transactionId
                },
                status: status
            }

        )
    }
}


