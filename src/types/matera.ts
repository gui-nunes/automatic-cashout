export type MateraResponseBalance = {
    accountId: string;
    date: Date;
    real: number;
    avaliable: number;
    overdraft: number;
    blocked: number;
    autoInvest: number;
    emergencyAidBalance: number;
    availableBalanceForTransactions: number;
};

export type MateraRequestCashout = {
    value: number;
    totalAmount: number;
    mediatorFee: number;
    currency: 'BRL';
    externalIdentifier: string;
    withdrawInfo: {
        withdrawType: 'InstantPayment';
        instantPayment: {
            recipient: {
                endToEndIdQuery: string;
                pspId: string;
                alias: string;
                taxIdentifier: {
                    taxId: string;
                    country: 'BRA';
                };
                accountDestination: {
                    branch: string;
                    account: string;
                    accountType: string;
                };
            };
        };
    };
};


export type MateraResponseCashout = {
    transactionId: string,
    externalIdentifier: string,
    status: string,
    receipt: string,
    authenticationCode: string
};

export type MateraResponseAlias = {
    alias: string
    aliasType: string,
    aliasAccountHolder: {
        taxIdentifier: {
            taxId: string,
            country: 'BRA',
            taxIdMasked: string
        },
        name: string
    },
    accountDestination: {
        branch: string,
        account: string,
        accountType: string
    },
    psp: {
        id: string,
        name: string,
        country: string,
        currencies: Array<string>
    },
    endToEndId: string,
    creationDate: Date,
    antiFraudClearingInfo: {
        lastUpdated: Date,
        counters: [
            {
                type: string,
                by: string,
                d3: number,
                d30: number,
                m6: number
            }
        ]
    }

}
// data: {
//     accountDestination: {
//         cpfCnpj: string;
//         name: string;
//         key: string;
//         aliasType: string;
//         agency: string;
//         account: string;
//         accountType: string;
//         psp: {
//             id: string;
//             name: string;
//             country: string;
//         };
//     };
//     service: ServiceType;
//     integrationMetadata: {
//         transactionId: string;
//     };
//     status: TransactionStatus;
//     value: number;
//     cashoutFee: number;
// }