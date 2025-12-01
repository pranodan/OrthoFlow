export enum UserRole {
  RECEPTIONIST = 'RECEPTIONIST',
  CONSULTANT = 'CONSULTANT'
}

export interface User {
  id: string;
  username: string;
  password?: string; // In a real app, this would be hashed
  fullName: string;
  role: UserRole;
}

export interface Patient {
  id: string; // Patient ID
  name: string;
  age: number;
  gender: 'Male' | 'Female' | 'Other';
  mobile: string;
  address: string;
  regDate: string; // ISO date
  consultantId: string;
  status: 'waiting' | 'received' | 'deferred' | 'completed';
}

export interface Medicine {
  id: string;
  name: string;
  dose: string;
  interval: string;
  duration: string;
}

export interface ExamData {
  id: string;
  patientId: string;
  consultantId: string;
  visitDate: string;
  visitTime: string;
  type: 'NEW' | 'FOLLOW_UP';
  
  // Clinical Fields (Rich Text)
  chiefComplaints: string;
  historyOfIllness: string;
  examination: string;
  specificTests: string;
  xray: string;
  ct: string;
  mri: string;
  otherInvestigations: string;
  diagnosis: string;
  plan: string;
  physiotherapy: string;
  remarks: string;
  nextReview: string;

  medicines: Medicine[];
}

export interface AppState {
  currentUser: User | null;
  users: User[];
  patients: Patient[];
  visits: ExamData[];
}