import { createHmac } from 'crypto';
import { MateraResponseBalance, Account, MateraResponseAlias, MateraRequestCashout, CashoutResponse, MateraResponseCashout } from "../types";
import 'dotenv/config'
import { HttpDAO, MateraDAO } from '../interfaces';

export class MateraService implements MateraDAO {
    constructor(readonly httpClient: HttpDAO) { }

    async getAlias(accountId: string,
        alias: string,): Promise<MateraResponseAlias> {

        let response: { data: MateraResponseAlias };

        try {
            response = await this.httpClient.get(
                `${process.env.MATERA_BASEURL}/v1/accounts/${accountId}/aliases/BRA/${alias}`,
                {
                    headers: {
                        'Api-Access-Key': process.env.API_ACCESS_KEY,
                    },
                },
            );
        } catch (error: any) {
            if (error?.response?.data?.error) {
                throw new Error(error.response.data.error);
            } else {
                throw error;
            }
        }

        return response.data
    }

    async getBalance(accountId: string): Promise<MateraResponseBalance> {

        const hash = createHmac('sha256', process.env.SECRET_KEY!)
            .update(accountId)
            .digest('hex');

        let response: { data: MateraResponseBalance };

        try {
            response = await this.httpClient.get(
                `${process.env.MATERA_BASEURL}/v2/accounts/${accountId}/balance`,
                {
                    headers: {
                        'Api-Access-Key': process.env.API_ACCESS_KEY,
                        'Transaction-Hash': hash,
                    }
                }
            )
        } catch (error: any) {
            if (error?.response?.data?.error) {
                throw new Error(error.response.data.error);
            } else {
                throw error;
            }
        }
        return response.data;
    }

    async postCashout(account: Account, id: string, value: number, rate: number): Promise<CashoutResponse> {

        const accountMetadata = account.integrationMetadata.find((metadata) => {
            return metadata.service == 'MATERA';
        });

        if (accountMetadata == undefined) {
            throw new Error('Account Metadata is undefined');
        }

        const alias = await this.getAlias(
            accountMetadata.data.accountId,
            account.withdrawKey,
        );

        if (alias.aliasAccountHolder.taxIdentifier.taxId != account.cpfCnpj) {
            throw new Error(
                'CPF/CNPJ da chave PIX não confere com o CPF/CNPJ da conta',
            );
        }

        const dataToMatera: MateraRequestCashout = {
            value: value - rate,
            totalAmount: value - rate,
            mediatorFee: rate,
            currency: 'BRL',
            externalIdentifier: id,
            withdrawInfo: {
                withdrawType: 'InstantPayment',
                instantPayment: {
                    recipient: {
                        endToEndIdQuery: alias.endToEndId,
                        pspId: alias.psp.id,
                        alias: alias.alias,
                        taxIdentifier: {
                            taxId: alias.aliasAccountHolder.taxIdentifier.taxId,
                            country: 'BRA',
                        },
                        accountDestination: {
                            branch: alias.accountDestination.branch,
                            account: alias.accountDestination.account,
                            accountType: alias.accountDestination.accountType,
                        },
                    },
                },
            },
        };

        const hash = createHmac('sha256', process.env.SECRET_KEY!)
            .update(Math.trunc(value - rate).toString() +
                accountMetadata.data.accountId +
                alias.psp.id +
                alias.aliasAccountHolder.taxIdentifier.taxId)
            .digest('hex');

        let materaResponse: { data: MateraResponseCashout };

        try {
            materaResponse = await this.httpClient.post(
                `${process.env.MATERA_BASEURL}/v1/accounts/${accountMetadata.data['accountId']}/withdraw`,
                dataToMatera,
                {
                    headers: {
                        'Api-Access-Key': process.env.API_ACCESS_KEY,
                        'Transaction-Hash': hash,
                    },
                },
            );
        } catch (error: any) {
            if (error?.response?.data?.error) {
                throw new Error(error.response.data.error);
            } else {
                throw error;
            }
        }

        return {
            destinationAccount: {
                cpfCnpj: alias.aliasAccountHolder.taxIdentifier.taxId,
                account: alias.accountDestination.account,
                accountType: alias.accountDestination.accountType,
                agency: alias.accountDestination.branch,
                aliasType: alias.aliasType,
                key: alias.alias,
                name: alias.aliasAccountHolder.name,
                psp: { country: alias.psp.country, id: alias.psp.id, name: alias.psp.name }
            },
            ...materaResponse.data
        }

    }
}
