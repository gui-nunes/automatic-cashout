export type IntegrationMetadata = {
    service: string;
    paymentKey: string | null;
    status: string;
    data: {
        accountHolderId: string;
        accountId: string;
    };
};