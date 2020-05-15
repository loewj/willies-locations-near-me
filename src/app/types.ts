export interface DeliveryOption {
    city: string;
    state: string;
    subtitle: string;
    title: string;
    zip: string;
}

export interface Location {
    addressHash: number;
    isDeleted: boolean;
    data: Array<any>;
    onOffPremises: string;
    retailAccount: string;
}