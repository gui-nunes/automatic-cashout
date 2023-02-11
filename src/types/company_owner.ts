import { Address } from "./";

export type CompanyOwner = {
    name: string;
    socialName: string | null
    cpfCnpj: string;
    mother: string | null;
    email: string;
    phoneNumber: string;
    birthDate: string | null; //NAO DEVERIA SER NULL
    address: Address;
};
