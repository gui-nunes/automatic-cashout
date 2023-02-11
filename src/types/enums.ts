
const serviceType = {
    MATERA: 'MATERA'
} as const;

const transactionType = {
    AUTOMATIC_CASHOUT: 'AUTOMATIC_CASHOUT',
} as const;

const transactionStatus = {
    DATA_CREATED: 'DATA_CREATED',
    CREATED: 'CREATED',
    ERROR: 'ERROR',
} as const;

type ObjectValues<T> = T[keyof T]

export type ServiceType = ObjectValues<typeof serviceType>;

export type TransactionType = ObjectValues<typeof transactionType>;

export type TransactionStatus = ObjectValues<typeof transactionStatus>;