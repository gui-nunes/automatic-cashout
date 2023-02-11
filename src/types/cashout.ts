import { MateraResponseCashout } from './';

export type CashoutResponse = MateraResponseCashout & {
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
}