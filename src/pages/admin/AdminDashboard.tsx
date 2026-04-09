"use client";
import React, { useEffect, useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useData } from '@/src/context/DataContext';
import { Users, CheckCircle, Trash2, Edit, FileUp, Save, Check, X, LogOut, Plus, Clock } from 'lucide-react';

import { signOut } from 'firebase/auth';
import { auth } from '../../lib/firebase';

export default function AdminDashboard() {
  const { students, requests, addStudent, importStudents, updateStudentPayments, deleteStudent, approveRequest, rejectRequest, deleteRequest } = useData();
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [search, setSearch] = useState("");
  const [editNim, setEditNim] = useState<string | null>(null);
  const [tempPay, setTempPay] = useState<any[]>([]);
  
  const [showManualForm, setShowManualForm] = useState(false);
  const [manualData, setManualData] = useState({ name: '', nim: '', id: '' });

  useEffect(() => {
    if (localStorage.getItem('isAdmin') !== 'true') {
      navigate('/admin/login');
    }
  }, [navigate]);

  const [isFirebaseAuthed, setIsFirebaseAuthed] = useState(false);
  useEffect(() => {
    const unsub = auth.onAuthStateChanged((user) => {
      setIsFirebaseAuthed(!!user);
    });
    return () => unsub();
  }, []);

  const handleLogout = async () => {
    await signOut(auth);
    localStorage.removeItem('isAdmin');
    navigate('/admin/login');
  };

  const currentMonth = new Intl.DateTimeFormat('id-ID', { month: 'long' }).format(new Date());
  const paidThisMonth = students.filter((s: any) => s.payments.find((p: any) => p.month === currentMonth && p.isPaid));
  
  const totalBulanIni = paidThisMonth.length * 5000;
  const totalKeseluruhan = students.reduce((acc: number, s: any) => 
    acc + (s.payments.filter((p: any) => p.isPaid).length * 5000), 0
  );

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!manualData.name || !manualData.nim || !manualData.id) return alert("Isi semua data!");
    addStudent(manualData.name, manualData.nim, parseInt(manualData.id));
    setManualData({ name: '', nim: '', id: '' });
    setShowManualForm(false);
    alert("Mahasiswa berhasil ditambahkan!");
  };

  const downloadTemplate = () => {
    const csvContent = "data:text/csv;charset=utf-8,nama,nim,id\nAhmad Zaki,247411001,1\nSiti Rahma,247411002,2";
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", "template_kas_hmps.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      const text = event.target?.result as string;
      const lines = text.split(/\r?\n/);
      const data = lines.slice(1)
        .filter(line => line.trim() && line.includes(','))
        .map(line => {
          const [nama, nim, id] = line.split(',');
          return { nama: nama?.trim(), nim: nim?.trim(), id: id?.trim() };
        });
      
      if (data.length === 0) return alert("File CSV kosong atau format salah!");
      
      await importStudents(data);
      alert(`Berhasil mengimpor ${data.length} mahasiswa!`);
      if (fileInputRef.current) fileInputRef.current.value = "";
    };
    reader.readAsText(file);
  };

  const startEdit = (s: any) => { setEditNim(s.nim); setTempPay([...s.payments]); };
  const save = () => { updateStudentPayments(editNim!, tempPay); setEditNim(null); };

  const filteredStudents = [...students]
    .filter((s: any) => 
      s.name.toLowerCase().includes(search.toLowerCase()) || s.nim.includes(search)
    )
    .sort((a, b) => a.id - b.id);

  return (
    <div className="min-h-screen bg-[#f1f5f9] pb-20 text-slate-900">
      <nav className="bg-white border-b border-slate-200 px-8 py-4 flex justify-between items-center sticky top-0 z-30 shadow-sm">
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">ADMIN DASHBOARD</h1>
        <div className="flex items-center gap-4">
          {!isFirebaseAuthed && (
            <div className="bg-orange-100 text-orange-700 px-4 py-2 rounded-xl text-xs font-black animate-pulse border border-orange-200">
              ⚠️ BELUM LOGIN GOOGLE (AKSES TERBATAS)
            </div>
          )}
          <button 
            onClick={handleLogout} 
            className="text-red-600 font-bold flex items-center gap-2 hover:bg-red-50 px-4 py-2 rounded-xl transition-all"
          >
            <LogOut size={20}/> Keluar
          </button>
        </div>
      </nav>

      <main className="p-4 md:p-10 max-w-7xl mx-auto space-y-10">
        <input 
          type="file" 
          ref={fileInputRef} 
          className="hidden" 
          accept=".csv" 
          onChange={handleFileUpload} 
        />
        
        {/* STATS SECTION */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-blue-600 p-8 rounded-[32px] text-white shadow-xl shadow-blue-200">
             <p className="text-sm font-bold uppercase opacity-80 mb-2">Pemasukan {currentMonth}</p>
             <h2 className="text-4xl font-black italic text-white">Rp {totalBulanIni.toLocaleString()}</h2>
          </div>
          <div className="bg-slate-900 p-8 rounded-[32px] text-white shadow-xl shadow-slate-300">
             <p className="text-sm font-bold uppercase opacity-60 mb-2">Total Kas Keseluruhan</p>
             <h2 className="text-4xl font-black text-green-400 italic">Rp {totalKeseluruhan.toLocaleString()}</h2>
          </div>
          <div className="bg-white p-8 rounded-[32px] border border-slate-200 shadow-sm overflow-hidden">
             <h3 className="font-bold text-slate-900 mb-3 flex items-center gap-2 text-sm uppercase"><CheckCircle className="text-green-500" size={18}/> Sudah Bayar ({currentMonth})</h3>
             <div className="flex flex-wrap gap-2 max-h-20 overflow-y-auto pr-2">
                {paidThisMonth.map((s:any)=>(<span key={s.nim} className="bg-green-100 text-green-800 px-3 py-1 rounded-lg text-[11px] font-black border border-green-200">{s.name}</span>))}
             </div>
          </div>
        </section>

        {/* ANTREAN KONFIRMASI */}
        <section>
          <h2 className="text-2xl font-black mb-6 flex items-center gap-3 tracking-tight">
            <div className="w-2 h-8 bg-orange-500 rounded-full"/> Antrean Konfirmasi 
            <span className="bg-orange-100 text-orange-600 text-sm px-3 py-1 rounded-full">{requests.length}</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {requests.length === 0 && <p className="text-slate-400 italic text-sm">Tidak ada antrean pembayaran.</p>}
            {requests.map((req: any) => (
              <div key={req.id} className={`bg-white p-6 rounded-[24px] border-2 transition-all ${req.status === 'rejected' ? 'border-red-100' : 'border-blue-100'}`}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h4 className="font-black text-slate-800 leading-tight">{req.studentName}</h4>
                    <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase tracking-wider italic flex items-center gap-1"><Clock size={10}/> {req.date}</p>
                  </div>
                  {req.status === 'rejected' && <span className="bg-red-500 text-white text-[10px] px-2 py-1 rounded-md font-black">REJECTED</span>}
                </div>
                <div className="bg-slate-50 p-4 rounded-2xl mb-4 space-y-1">
                   <p className="text-xs font-bold text-slate-400 uppercase">Bulan: <span className="text-slate-800">{req.months.join(", ")}</span></p>
                   <p className="text-lg font-black text-blue-600">Rp {req.amount.toLocaleString()}</p>
                </div>
                <div className="flex gap-2">
                  {req.status === 'pending' ? (
                    <>
                      <button onClick={() => approveRequest(req.id)} className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-100"><Check size={18}/> Approve</button>
                      <button onClick={() => rejectRequest(req.id)} className="bg-white border-2 border-red-100 text-red-500 hover:bg-red-50 p-3 rounded-xl transition-all"><X size={20}/></button>
                    </>
                  ) : (
                    <button onClick={() => deleteRequest(req.id)} className="w-full bg-slate-100 text-slate-400 py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-red-50 hover:text-red-500 transition-all"><Trash2 size={18}/> Hapus Log</button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* TOOLS & MANAJEMEN ANGGOTA */}
        <div className="flex flex-col md:flex-row justify-between items-center gap-4 pt-10">
           <h2 className="text-2xl font-black flex items-center gap-3 tracking-tight"><div className="w-2 h-8 bg-blue-600 rounded-full"/> Manajemen Anggota</h2>
           <div className="flex gap-3 w-full md:w-auto">
              <button onClick={downloadTemplate} className="bg-green-100 text-green-700 px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all hover:bg-green-200">
                <FileUp size={20}/> Template
              </button>
              <button onClick={() => fileInputRef.current?.click()} className="bg-blue-600 text-white px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all hover:bg-blue-700 shadow-lg shadow-blue-100">
                <FileUp size={20}/> Import CSV
              </button>
              <input 
                className="bg-white border border-slate-200 px-4 py-2 rounded-xl outline-none font-bold text-sm"
                placeholder="Cari Anggota..."
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
              <button onClick={() => setShowManualForm(!showManualForm)} className="bg-white border-2 border-blue-600 text-blue-600 px-6 py-3 rounded-2xl font-black flex items-center gap-2 transition-all hover:bg-blue-50">
                <Plus size={20}/> Tambah Manual
              </button>
           </div>
        </div>

        {/* FORM INPUT MANUAL */}
        {showManualForm && (
          <form onSubmit={handleManualSubmit} className="bg-white p-8 rounded-[32px] border-2 border-blue-600 shadow-2xl animate-in slide-in-from-top-4 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="flex flex-col"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 tracking-widest">Nama Lengkap</label>
            <input required className="bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-200 focus:ring-2 focus:ring-blue-500" placeholder="Contoh: Ahmad" value={manualData.name} onChange={e => setManualData({...manualData, name: e.target.value})} /></div>
            <div className="flex flex-col"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 tracking-widest">NIM</label>
            <input required className="bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-200 focus:ring-2 focus:ring-blue-500" placeholder="247..." value={manualData.nim} onChange={e => setManualData({...manualData, nim: e.target.value})} /></div>
            <div className="flex flex-col"><label className="text-[10px] font-black text-slate-400 uppercase ml-1 mb-1 tracking-widest">ID (Kode Unik)</label>
            <input required type="number" className="bg-slate-50 p-4 rounded-xl font-bold outline-none border border-slate-200 focus:ring-2 focus:ring-blue-500" placeholder="Contoh: 14" value={manualData.id} onChange={e => setManualData({...manualData, id: e.target.value})} /></div>
            <button className="bg-blue-600 text-white mt-5 py-4 rounded-xl font-black hover:bg-blue-700 shadow-lg shadow-blue-200">SIMPAN ANGGOTA</button>
          </form>
        )}

        {/* TABEL ANGGOTA */}
        <div className="bg-white rounded-[40px] border border-slate-200 shadow-2xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead className="bg-slate-900 text-[11px] font-black text-slate-400 uppercase tracking-[0.2em]">
                <tr>
                  <th className="p-8">ID</th>
                  <th className="p-8">Nama Mahasiswa</th>
                  <th className="p-8">NIM</th>
                  <th className="p-8 text-center">Status Pembayaran</th>
                  <th className="p-8 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredStudents.map((s: any) => (
                  <tr key={s.nim} className={`transition-all ${editNim === s.nim ? 'bg-blue-50/50' : 'hover:bg-slate-50/50'}`}>
                    <td className="p-8 text-xl font-black text-blue-600 italic">#{s.id}</td>
                    <td className="p-8 font-black text-slate-800 uppercase text-sm tracking-tight">{s.name}</td>
                    <td className="p-8 font-bold text-slate-500 text-sm">{s.nim}</td>
                    <td className="p-8">
                      <div className="flex flex-wrap gap-2 justify-center max-w-sm mx-auto">
                        {(editNim === s.nim ? tempPay : s.payments).map((p: any) => (
                          <button 
                            key={p.month} 
                            disabled={editNim !== s.nim} 
                            onClick={() => setTempPay(tempPay.map(x => x.month === p.month ? {...x, isPaid: !x.isPaid} : x))} 
                            className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all border-2 ${
                              p.isPaid 
                              ? 'bg-green-600 border-green-600 text-white shadow-md shadow-green-200' 
                              : 'bg-white border-slate-200 text-slate-300 hover:border-slate-400 hover:text-slate-500'
                            }`}
                          >
                            {p.month.substring(0,3).toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="p-8 text-right">
                       {editNim === s.nim ? (
                         <div className="flex justify-end gap-3">
                            <button onClick={save} className="bg-green-600 text-white px-5 py-3 rounded-xl font-black flex items-center gap-2 shadow-lg shadow-green-200 active:scale-95 transition-all"><Check size={18}/> Simpan</button>
                            <button onClick={() => setEditNim(null)} className="bg-slate-200 text-slate-600 px-5 py-3 rounded-xl font-bold flex items-center gap-2 active:scale-95 transition-all"><X size={18}/> Batal</button>
                         </div>
                       ) : (
                         <div className="flex justify-end gap-3">
                            <button onClick={() => startEdit(s)} className="text-blue-600 bg-blue-50 border-2 border-blue-100 px-5 py-3 rounded-xl font-black flex items-center gap-2 hover:bg-blue-600 hover:text-white transition-all active:scale-95"><Edit size={18}/> Edit Status</button>
                            <button onClick={() => deleteStudent(s.nim)} className="p-3 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-all active:scale-95"><Trash2 size={20}/></button>
                         </div>
                       )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
