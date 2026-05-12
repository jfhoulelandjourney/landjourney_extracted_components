export enum EntityTypes {
  BUSINESS = 'BUSINESS',
  INDIVIDUAL = 'INDIVIDUAL',
  RETAILER = 'RETAILER',
}

export enum NumberTypes {
  STREET = 'STREET',
  BOULEVARD = 'BOULEVARD',
  PARK = 'PARK',
  CRESCENT = 'CRESCENT',
}

export enum Countries {
  CANADA = 'CANADA',
  UNITED_STATES = 'UNITED_STATES',
}

export enum States {
  ALABAMA = 'ALABAMA',
  ALASKA = 'ALASKA',
  ARIZONA = 'ARIZONA',
  ARKANSAS = 'ARKANSAS',
  CALIFORNIA = 'CALIFORNIA',
  COLORADO = 'COLORADO',
  CONNECTICUT = 'CONNECTICUT',
  DELAWARE = 'DELAWARE',
  FLORIDA = 'FLORIDA',
  GEORGIA = 'GEORGIA',
  HAWAII = 'HAWAII',
  IDAHO = 'IDAHO',
  ILLINOIS = 'ILLINOIS',
  INDIANA = 'INDIANA',
  IOWA = 'IOWA',
  KANSAS = 'KANSAS',
  KENTUCKY = 'KENTUCKY',
  LOUISIANA = 'LOUISIANA',
  MAINE = 'MAINE',
  MARYLAND = 'MARYLAND',
  MASSACHUSETTS = 'MASSACHUSETTS',
  MICHIGAN = 'MICHIGAN',
  MINNESOTA = 'MINNESOTA',
  MISSISSIPPI = 'MISSISSIPPI',
  MISSOURI = 'MISSOURI',
  MONTANA = 'MONTANA',
  NEBRASKA = 'NEBRASKA',
  NEVADA = 'NEVADA',
  NEW_HAMPSHIRE = 'NEW_HAMPSHIRE',
  NEW_JERSEY = 'NEW_JERSEY',
  NEW_MEXICO = 'NEW_MEXICO',
  NEW_YORK = 'NEW_YORK',
  NORTH_CAROLINA = 'NORTH_CAROLINA',
  NORTH_DAKOTA = 'NORTH_DAKOTA',
  OHIO = 'OHIO',
  OKLAHOMA = 'OKLAHOMA',
  OREGON = 'OREGON',
  PENNSYLVANIA = 'PENNSYLVANIA',
  RHODE_ISLAND = 'RHODE_ISLAND',
  SOUTH_CAROLINA = 'SOUTH_CAROLINA',
  SOUTH_DAKOTA = 'SOUTH_DAKOTA',
  TENNESSEE = 'TENNESSEE',
  TEXAS = 'TEXAS',
  UTAH = 'UTAH',
  VERMONT = 'VERMONT',
  VIRGINIA = 'VIRGINIA',
  WASHINGTON = 'WASHINGTON',
  WEST_VIRGINIA = 'WEST_VIRGINIA',
  WISCONSIN = 'WISCONSIN',
  WYOMING = 'WYOMING',
}

export enum Provinces {
  ALBERTA = 'ALBERTA',
  BRITISH_COLUMBIA = 'BRITISH_COLUMBIA',
  MANITOBA = 'MANITOBA',
  NEW_BRUNSWICK = 'NEW_BRUNSWICK',
  NEWFOUNDLAND_AND_LABRADOR = 'NEWFOUNDLAND_AND_LABRADOR',
  NOVA_SCOTIA = 'NOVA_SCOTIA',
  ONTARIO = 'ONTARIO',
  PRINCE_EDWARD_ISLAND = 'PRINCE_EDWARD_ISLAND',
  QUEBEC = 'QUEBEC',
  SASKATCHEWAN = 'SASKATCHEWAN',
}

export interface Address {
  id?: string;
  organizationId: string;
  entityId: string;
  entityType: EntityTypes;
  street: string;
  city: string;
  state: States | Provinces | string;
  county?: string;
  country: Countries;
  zipCode: string;
  extra: string;
}

export const getDefaultAddress = (): Address => {
  return {
    organizationId: '',
    entityId: '',
    entityType: EntityTypes.BUSINESS,
    street: '',
    city: '',
    state: '',
    county: '',
    country: Countries.UNITED_STATES,
    zipCode: '',
    extra: '',
  };
};
