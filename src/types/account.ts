import { Address, CompanyOwner, IntegrationMetadata } from './';

export type Account = {
    id: string;
    name: string;
    socialName: string | null;
    cpfCnpj: string;
    phoneNumber: string;
    email: string;
    status: string;
    activeService: string;
    sourceClient: string;
    companyType: string;
    withdrawKey: string;
    establishmentDate: string;
    lastTransaction: Date;
    cashoutTime: Array<string>;
    cashoutFee: number;
    address: Address;
    billingAddress: Address;
    companyOwners: CompanyOwner[];
    integrationMetadata: IntegrationMetadata[];
    createdAt: string;
    updatedAt: string;
};