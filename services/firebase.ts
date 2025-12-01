import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getFirestore, 
  collection, 
  addDoc, 
  onSnapshot, 
  doc, 
  updateDoc, 
  query, 
  orderBy, 
  setDoc,
  deleteDoc,
  getDocs,
  Firestore
} from 'firebase/firestore';
import { Patient, ExamData, User, UserRole } from '../types';

let app: FirebaseApp | null = null;
let db: Firestore | null = null;

export const initFirebase = (config: any) => {
  try {
    if (!app) {
      app = initializeApp(config);
      db = getFirestore(app);
    }
    return true;
  } catch (error) {
    console.error("Firebase init error:", error);
    return false;
  }
};

// --- Users ---
export const subscribeUsers = (onUpdate: (users: User[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'users'));
  return onSnapshot(q, (snapshot) => {
    const users = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as User));
    onUpdate(users);
  });
};

export const addUserToDb = async (user: User) => {
  if (!db) throw new Error("DB not initialized");
  await setDoc(doc(db, 'users', user.id), user);
};

export const deleteUserFromDb = async (userId: string) => {
    if (!db) throw new Error("DB not initialized");
    await deleteDoc(doc(db, 'users', userId));
};

export const seedDefaultUserIfNeeded = async () => {
    if (!db) return;
    const q = query(collection(db, 'users'));
    const snapshot = await getDocs(q);
    if (snapshot.empty) {
        const defaultAdmin: User = {
            id: 'admin',
            username: 'admin',
            password: '123',
            fullName: 'System Admin',
            role: UserRole.RECEPTIONIST
        };
        await addUserToDb(defaultAdmin);
    }
};

// --- Patients ---
export const subscribePatients = (onUpdate: (patients: Patient[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'patients'), orderBy('regDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const patients = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Patient));
    onUpdate(patients);
  });
};

export const addPatientToDb = async (patient: Patient) => {
  if (!db) throw new Error("DB not initialized");
  await setDoc(doc(db, 'patients', patient.id), patient);
};

export const updatePatientStatusInDb = async (patientId: string, status: string) => {
  if (!db) throw new Error("DB not initialized");
  await updateDoc(doc(db, 'patients', patientId), { status });
};

// --- Visits ---
export const subscribeVisits = (onUpdate: (visits: ExamData[]) => void) => {
  if (!db) return () => {};
  const q = query(collection(db, 'visits'), orderBy('visitDate', 'desc'));
  return onSnapshot(q, (snapshot) => {
    const visits = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as ExamData));
    onUpdate(visits);
  });
};

export const addVisitToDb = async (visit: ExamData) => {
  if (!db) throw new Error("DB not initialized");
  await setDoc(doc(db, 'visits', visit.id), visit);
  // Also update patient status to completed
  await updateDoc(doc(db, 'patients', visit.patientId), { status: 'completed' });
};
