"use client";
import React, { createContext, useContext, useState, useEffect } from 'react';
import { 
  collection, 
  onSnapshot, 
  addDoc, 
  updateDoc, 
  deleteDoc, 
  doc, 
  query, 
  orderBy,
  setDoc,
  getDocFromServer
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';

enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId: string | undefined;
    email: string | null | undefined;
    emailVerified: boolean | undefined;
    isAnonymous: boolean | undefined;
  }
}

function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null) {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
    },
    operationType,
    path
  }
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  if (errInfo.error.includes('permissions')) {
    alert("Izin ditolak! Pastikan Anda login dengan Google menggunakan email Admin.");
  }
  throw new Error(JSON.stringify(errInfo));
}

export type Payment = { month: string; isPaid: boolean };
export type Student = { id: number; name: string; nim: string; payments: Payment[] };
export type PaymentRequest = { id: string; studentNim: string; studentName: string; months: string[]; amount: number; status: 'pending' | 'rejected'; date: string };

const monthsList = ["Februari", "Maret", "April", "Mei", "Juni", "Juli", "Agustus", "September", "Oktober", "November"];

interface DataContextType {
  students: Student[];
  requests: PaymentRequest[];
  addStudent: (name: string, nim: string, id: number) => Promise<void>;
  importStudents: (data: any[]) => Promise<void>;
  updateStudentPayments: (nim: string, newPayments: Payment[]) => Promise<void>;
  deleteStudent: (nim: string) => Promise<void>;
  addRequest: (newReq: any) => Promise<void>;
  approveRequest: (reqId: string) => Promise<void>;
  rejectRequest: (reqId: string) => Promise<void>;
  deleteRequest: (reqId: string) => Promise<void>;
  loading: boolean;
}

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [students, setStudents] = useState<Student[]>([]);
  const [requests, setRequests] = useState<PaymentRequest[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Real-time listener for students
    const qStudents = query(collection(db, 'students'), orderBy('name', 'asc'));
    const unsubStudents = onSnapshot(qStudents, (snapshot) => {
      const studentData = snapshot.docs.map(doc => ({
        ...doc.data(),
        nim: doc.id
      })) as Student[];
      setStudents(studentData);
      setLoading(false);
    }, (error) => {
      console.error("Firestore Error (Students):", error);
    });

    // Real-time listener for requests
    const qRequests = query(collection(db, 'requests'), orderBy('date', 'desc'));
    const unsubRequests = onSnapshot(qRequests, (snapshot) => {
      const requestData = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id
      })) as PaymentRequest[];
      setRequests(requestData);
    }, (error) => {
      console.error("Firestore Error (Requests):", error);
    });

    return () => {
      unsubStudents();
      unsubRequests();
    };
  }, []);

  const addStudent = async (name: string, nim: string, id: number) => {
    try {
      await setDoc(doc(db, 'students', nim), {
        id: Number(id),
        name,
        payments: monthsList.map(m => ({ month: m, isPaid: false }))
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, `students/${nim}`);
    }
  };

  const importStudents = async (data: any[]) => {
    try {
      for (const item of data) {
        const nim = item.nim?.trim();
        if (!nim) continue;
        await setDoc(doc(db, 'students', nim), {
          id: parseInt(item.id) || Math.floor(Math.random() * 100),
          name: item.nama,
          payments: monthsList.map(m => ({ month: m, isPaid: false }))
        });
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'students/batch');
    }
  };

  const updateStudentPayments = async (nim: string, newPayments: Payment[]) => {
    try {
      await updateDoc(doc(db, 'students', nim), { payments: newPayments });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `students/${nim}`);
    }
  };

  const deleteStudent = async (nim: string) => {
    if(confirm("Hapus mahasiswa ini?")) {
      try {
        await deleteDoc(doc(db, 'students', nim));
      } catch (error) {
        handleFirestoreError(error, OperationType.DELETE, `students/${nim}`);
      }
    }
  };

  const addRequest = async (newReq: any) => {
    try {
      await addDoc(collection(db, 'requests'), newReq);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'requests');
    }
  };
  
  const approveRequest = async (reqId: string) => {
    const req = requests.find(r => r.id === reqId);
    if (req) {
      try {
        const student = students.find(s => s.nim === req.studentNim);
        if (student) {
          const updatedPayments = student.payments.map(p => 
            req.months.includes(p.month) ? { ...p, isPaid: true } : p
          );
          await updateDoc(doc(db, 'students', req.studentNim), { payments: updatedPayments });
          await deleteDoc(doc(db, 'requests', reqId));
        }
      } catch (error) {
        handleFirestoreError(error, OperationType.WRITE, `approve/${reqId}`);
      }
    }
  };

  const rejectRequest = async (reqId: string) => {
    try {
      await updateDoc(doc(db, 'requests', reqId), { status: 'rejected' });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `requests/${reqId}`);
    }
  };

  const deleteRequest = async (reqId: string) => {
    try {
      await deleteDoc(doc(db, 'requests', reqId));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `requests/${reqId}`);
    }
  };

  return (
    <DataContext.Provider value={{ 
      students, 
      requests, 
      addStudent, 
      importStudents, 
      updateStudentPayments, 
      deleteStudent, 
      addRequest, 
      approveRequest, 
      rejectRequest, 
      deleteRequest,
      loading
    }}>
      {children}
    </DataContext.Provider>
  );
}
export const useData = () => {
  const context = useContext(DataContext);
  if (!context) throw new Error("useData must be used within a DataProvider");
  return context;
};
