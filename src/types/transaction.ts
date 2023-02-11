import { ServiceType, TransactionType, TransactionStatus } from './';

export type Transaction = {
    id: string;
    cashoutFee: number;
    cpfCnpj: string;
    service: ServiceType;
    type: TransactionType;
    withdrawKey: string;
    value: number;
    createdAt: Date;
    updatedAt: Date;
    integrationMetadata: {
        transactionId: string;
    };
    status: TransactionStatus;
    destinationAccount: {
        cpfCnpj: string;
        name: string;
        key: string;
        aliasType: string;
        agency: string;
        account: string;
        accountType: string;
        psp: {
            id: string;
            name: string;
            country: string;
        };
    };
};