import { initializeApp, getApps, getApp } from 'firebase/app';
import { getFirestore, doc, getDocFromServer, collection, setDoc, getDocs, query, where, orderBy, onSnapshot, disableNetwork } from 'firebase/firestore';
import { getAuth, signInAnonymously, onAuthStateChanged, User } from 'firebase/auth';
import firebaseConfigJson from '../../firebase-applet-config.json';
import { PatientAppointment } from '../types';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  }
}

const firebaseConfig = {
  apiKey: firebaseConfigJson.apiKey,
  authDomain: firebaseConfigJson.authDomain,
  projectId: firebaseConfigJson.projectId,
  storageBucket: firebaseConfigJson.storageBucket,
  messagingSenderId: firebaseConfigJson.messagingSenderId,
  appId: firebaseConfigJson.appId,
};

export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();

// Use the specific firestoreDatabaseId if provisioned
export const db = firebaseConfigJson.firestoreDatabaseId
  ? getFirestore(app, firebaseConfigJson.firestoreDatabaseId)
  : getFirestore(app);

export const auth = getAuth(app);

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid || null,
      email: auth.currentUser?.email || null,
      emailVerified: auth.currentUser?.emailVerified || null,
      isAnonymous: auth.currentUser?.isAnonymous || null,
      tenantId: auth.currentUser?.tenantId || null,
      providerInfo: auth.currentUser?.providerData?.map(provider => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || []
    },
    operationType,
    path
  };
  console.warn('[Firestore Error]:', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

// Sign in anonymously for seamless security
export async function ensureAuth(): Promise<User | null> {
  if (auth.currentUser) return auth.currentUser;
  try {
    const cred = await signInAnonymously(auth);
    return cred.user;
  } catch (err) {
    console.warn('[Firebase Auth] Anonymous sign-in note:', err);
    return null;
  }
}

// Safe connection indicator without invasive probe
export async function testFirestoreConnection(): Promise<boolean> {
  return typeof window !== 'undefined' && !!db;
}

// Save appointment directly to Firestore
export async function saveAppointmentToFirestore(appointment: PatientAppointment): Promise<boolean> {
  const pathStr = `appointments/${appointment.id}`;
  try {
    const aptRef = doc(db, 'appointments', appointment.id);
    await setDoc(aptRef, {
      ...appointment,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    console.log('[Firestore] Appointment successfully saved:', appointment.tokenNumber);
    return true;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('insufficient permissions') || msg.includes('Permission denied')) {
      handleFirestoreError(err, OperationType.WRITE, pathStr);
    }
    console.error('[Firestore] Error saving appointment to Firestore:', err);
    return false;
  }
}

// Fetch appointments from Firestore
export async function fetchAppointmentsFromFirestore(): Promise<PatientAppointment[]> {
  const pathStr = 'appointments';
  try {
    const colRef = collection(db, 'appointments');
    const snap = await getDocs(colRef);
    const results: PatientAppointment[] = [];
    snap.forEach((docSnap) => {
      results.push(docSnap.data() as PatientAppointment);
    });
    return results;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('insufficient permissions') || msg.includes('Permission denied')) {
      handleFirestoreError(err, OperationType.LIST, pathStr);
    }
    console.warn('[Firestore] Error fetching appointments from Firestore:', err);
    return [];
  }
}

// Real-time listener for appointments
export function subscribeToAppointments(
  onUpdate: (appointments: PatientAppointment[]) => void,
  onError?: (err: Error) => void
) {
  const colRef = collection(db, 'appointments');
  return onSnapshot(
    colRef,
    (snapshot) => {
      const appointments: PatientAppointment[] = [];
      snapshot.forEach((docSnap) => {
        appointments.push(docSnap.data() as PatientAppointment);
      });
      onUpdate(appointments);
    },
    (error) => {
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('insufficient permissions') || msg.includes('Permission denied')) {
        handleFirestoreError(error, OperationType.GET, 'appointments');
      }
      console.warn('[Firestore] Snapshot listener error:', error);
      if (onError) onError(error);
    }
  );
}
