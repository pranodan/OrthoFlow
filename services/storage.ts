import { AppState, User, Patient, ExamData, UserRole } from '../types';

const STORAGE_KEY = 'mediflow_db_v1';

const DEFAULT_USERS: User[] = [
  { id: 'u1', username: 'recep', password: '123', fullName: 'Alice Receptionist', role: UserRole.RECEPTIONIST },
  { id: 'u2', username: 'doc1', password: '123', fullName: 'Dr. Smith (Cardio)', role: UserRole.CONSULTANT },
  { id: 'u3', username: 'doc2', password: '123', fullName: 'Dr. Jones (Ortho)', role: UserRole.CONSULTANT },
];

const INITIAL_STATE: AppState = {
  currentUser: null,
  users: DEFAULT_USERS,
  patients: [],
  visits: [],
};

export const loadState = (): AppState => {
  const stored = localStorage.getItem(STORAGE_KEY);
  if (stored) {
    const parsed = JSON.parse(stored);
    // Ensure users exist if storage was cleared or fresh
    if (!parsed.users || parsed.users.length === 0) {
      parsed.users = DEFAULT_USERS;
    }
    return { ...INITIAL_STATE, ...parsed, currentUser: null }; // Always start logged out
  }
  return INITIAL_STATE;
};

export const saveState = (state: AppState) => {
  const stateToSave = {
    users: state.users,
    patients: state.patients,
    visits: state.visits
  };
  localStorage.setItem(STORAGE_KEY, JSON.stringify(stateToSave));
};