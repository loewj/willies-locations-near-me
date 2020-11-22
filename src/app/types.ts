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

declare global {
  interface Window {
    superbrew_starting_coords?: {
      lat: number
      lng: number
    }
  }
}
