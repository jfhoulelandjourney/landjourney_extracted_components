export interface CreditCheckInput {
  organizationUserId: string;
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  ssn: string;
  dateOfBirth: number;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
}

export type CreditCheckDetails = {
  firstName: string;
  lastName: string;
  middleName: string;
  phoneNumber: string;
  ssn: string;
  dateOfBirth: number;
  streetNumber: string;
  streetName: string;
  city: string;
  state: string;
  zipCode: string;
  country: string;
};
