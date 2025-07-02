export interface IPhone {
  countryCode: string;
  number: string;
}

export interface IAddress {
  addressLine1: string;
  addressLine2?: string;
  country: string;
  city: string;
  state: string;
  zipCode: string;
}

export interface IContactPerson {
  firsname: string;
  lastname?: string;
  email: string;
  phone: IPhone;
  address: IAddress;
}

export interface IExperience {
  companyName: string;
  designation: string;
  from: string;
  to: string;
  description?: string;
  city: string;
  country: string;
}

// export interface IAdminCreds {
//   username: string;
//   password: string;
// }
