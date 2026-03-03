export type UserRole = 'business' | 'admin';
export type UserStatus = 'pending' | 'approved' | 'rejected';
export type TransportationMode = 'private_car' | 'bus' | 'van' | 'motorcycle' | 'plane' | 'other';
export type PurposeOfVisit = 'leisure' | 'business' | 'event' | 'others';
export type AgeGroup = '1-9' | '10-17' | '18-25' | '26-35' | '36-45' | '46-55' | '56+' | 'prefer_not_to_say';
export type Gender = 'male' | 'female' | 'lgbt' | 'prefer_not_to_say';

export interface User {
  id: string;
  email: string;
  role: UserRole;
  status: UserStatus;
  business?: Business;
}

export interface Business {
  id: string;
  userId: string;
  businessName: string;
  permitNumber: string;
  address: string;
  contactNumber: string;
  ownerName: string;
  totalRooms?: number;
  permitFileUrl?: string;
  validIdUrl?: string;
}

export interface GuestRecord {
  id: string;
  businessId: string;
  checkIn: string;
  checkOut: string;
  nationality: string;
  gender: Gender;
  age: AgeGroup;
  transportationMode: TransportationMode;
  purpose: PurposeOfVisit;
  numberOfGuests: number;
  roomsRented: number;
  createdAt: string;
}

export interface GuestSubgroup {
  nationality: string;
  gender: Gender;
  age: AgeGroup;
  count: number;
}

export interface GuestEntryForm {
  checkIn: string;
  checkOut: string;
  subgroups: GuestSubgroup[];
  transportationMode: TransportationMode;
  purpose: PurposeOfVisit;
  totalGuests: number;
}

export interface MonthlySubmission {
  id: string;
  businessId: string;
  month: number;
  year: number;
  status: 'submitted' | 'not_submitted';
  submittedAt?: string;
}

export interface Message {
  id: string;
  senderId: string;
  receiverId: string;
  subject: string;
  message: string;
  readStatus: boolean;
  createdAt: string;
}

export interface RegistrationRequest {
  id: string;
  userId?: string;
  businessName: string;
  permitNumber: string;
  address: string;
  contactNumber: string;
  ownerName: string;
  permitFileUrl?: string;
  validIdUrl?: string;
  email: string;
  remarks?: string;
  status: UserStatus;
}
