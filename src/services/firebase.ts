import { initializeApp, FirebaseApp } from 'firebase/app';
import { 
  getAuth, 
  signInAnonymously, 
  signInWithCustomToken, 
  onAuthStateChanged,
  User,
  Auth
} from 'firebase/auth';
import { 
  getFirestore, 
  doc, 
  setDoc, 
  onSnapshot,
  Firestore,
  Unsubscribe
} from 'firebase/firestore';
import { Task, ScheduleData, SyncStatus } from '../types';

// Khởi tạo Firebase
const rawFirebaseConfig = typeof __firebase_config !== 'undefined' ? __firebase_config : null;
const firebaseConfig = rawFirebaseConfig ? JSON.parse(rawFirebaseConfig) : null;

export const app: FirebaseApp | null = firebaseConfig ? initializeApp(firebaseConfig) : null;
export const auth: Auth | null = app ? getAuth(app) : null;
export const db: Firestore | null = app ? getFirestore(app) : null;
export const appId: string = typeof __app_id !== 'undefined' ? __app_id : 'default-app-id';

export const initFirebaseAuth = (onUserChange: (user: User | null) => void, onError: () => void): (() => void) => {
  if (!auth) {
    onError();
    return () => {};
  }

  const runAuth = async () => {
    try {
      if (typeof __initial_auth_token !== 'undefined' && __initial_auth_token) {
        await signInWithCustomToken(auth, __initial_auth_token);
      } else {
        await signInAnonymously(auth);
      }
    } catch (err) {
      console.error('Lỗi đăng nhập Firebase:', err);
      onError();
    }
  };

  runAuth();
  return onAuthStateChanged(auth, (currentUser) => {
    onUserChange(currentUser);
  });
};

export const subscribeToDashboard = (
  user: User | null,
  onData: (data: { tasks?: Task[]; schedule?: ScheduleData; lastAiMessage?: string; customApiKey?: string }) => void,
  initialData: { tasks: Task[]; schedule: ScheduleData; lastAiMessage: string },
  setStatus: (status: SyncStatus) => void
): Unsubscribe | undefined => {
  if (!user || !db) return;

  const dashboardDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'master_dashboard', 'main_state_v3_tuesday');

  return onSnapshot(
    dashboardDocRef,
    (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        onData(data);
        setStatus('synced');
      } else {
        setDoc(dashboardDocRef, {
          tasks: initialData.tasks,
          schedule: initialData.schedule,
          lastAiMessage: initialData.lastAiMessage,
          updatedAt: Date.now()
        })
          .then(() => setStatus('synced'))
          .catch(() => setStatus('error'));
      }
    },
    (error) => {
      console.error('Lỗi đồng bộ Firestore:', error);
      setStatus('error');
    }
  );
};

export const saveDashboardToCloud = async (
  user: User | null,
  tasks: Task[],
  schedule: ScheduleData,
  lastAiMessage: string,
  customApiKey: string,
  setStatus: (status: SyncStatus) => void
): Promise<void> => {
  if (!user || !db) return;

  try {
    setStatus('connecting');
    const dashboardDocRef = doc(db, 'artifacts', appId, 'public', 'data', 'master_dashboard', 'main_state_v3_tuesday');
    await setDoc(dashboardDocRef, {
      tasks,
      schedule,
      lastAiMessage,
      customApiKey,
      updatedAt: Date.now()
    });
    setStatus('synced');
  } catch (err) {
    console.error('Lỗi lưu Firestore:', err);
    setStatus('error');
  }
};
