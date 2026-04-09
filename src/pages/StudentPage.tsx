"use client";
import { useState, useMemo } from 'react';
import { useData } from '@/src/context/DataContext';
import { generateQRIS } from '@/src/utils/qris';
import { QRCodeSVG } from 'qrcode.react';
import { useNavigate } from 'react-router-dom';
import { Search, QrCode, Send, X, Info, Users, CheckCircle2, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

export default function StudentPage() {
  const { students, requests, addRequest, loading } = useData();
  const navigate = useNavigate();
  const [search, setSearch] = useState("");
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [selectedMonths, setSelectedMonths] = useState<string[]>([]);
  const [showModal, setShowModal] = useState(false);

  // LOGIKA NOMINAL: (Bulan * 5000) + ID Mahasiswa
  const nominalKas = selectedMonths.length * 5000;
  const memberId = selectedStudent?.id || 0;
  const totalBayar = nominalKas + memberId;

  const qrisString = useMemo(() => generateQRIS(totalBayar), [totalBayar]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="text-blue-600 font-black text-2xl animate-pulse">MEMUAT DATA...</div>
      </div>
    );
  }

  const handleSearch = () => {
    if (!search) return;
    const found = students.find((s: any) => 
      s.nim === search || s.name.toLowerCase().includes(search.toLowerCase())
    );
    if (found) { 
      setSelectedStudent(found); 
      setSelectedMonths([]); 
    }
    else alert("Mahasiswa tidak ditemukan!");
  };

  const isMonthPending = (month: string) => 
    requests?.some((r: any) => r.studentNim === selectedStudent?.nim && r.months.includes(month) && r.status === 'pending');
  
  const toggleMonth = (month: string) => 
    setSelectedMonths(prev => prev.includes(month) ? prev.filter(m => m !== month) : [...prev, month]);
  
  const handleConfirm = () => {
    addRequest({ 
      id: Date.now().toString(), 
      studentNim: selectedStudent.nim, 
      studentName: selectedStudent.name, 
      months: selectedMonths, 
      amount: totalBayar, 
      status: 'pending', 
      date: new Date().toLocaleString('id-ID') 
    });
    
    setShowModal(false);
    setSelectedMonths([]); 
    alert("Berhasil! Status pembayaran Anda kini 'PROSES'. Silakan tunggu verifikasi admin.");
  };

  return (
    <main className="min-h-screen bg-slate-100 p-4 md:p-10 text-slate-900 font-sans">
      <div className="max-w-xl mx-auto">
        
        {/* HEADER */}
        <header className="text-center mb-8 relative">
          <button 
            onClick={() => navigate('/admin/login')}
            className="absolute right-0 top-0 p-2 text-slate-200 hover:text-blue-600 transition-all"
            title="Admin Access"
          >
            <ShieldCheck size={20} />
          </button>
          <h1 className="text-2xl md:text-4xl font-black text-blue-900 tracking-tighter uppercase leading-tight">
            KAS HMPS SAINS DATA
          </h1>
          <p className="text-slate-500 font-bold text-sm tracking-widest mt-1">DIGITAL PAYMENT</p>
        </header>

        {/* SEARCH BOX */}
        <div className="bg-white p-2 rounded-2xl shadow-xl flex gap-2 mb-8 border-2 border-white focus-within:ring-2 focus-within:ring-blue-500/20">
          <input 
            className="flex-1 px-4 py-2 outline-none font-bold text-lg text-slate-800 placeholder:text-slate-300 w-full" 
            placeholder="Cari Nama / NIM..." 
            value={search} 
            onChange={e => setSearch(e.target.value)} 
            onKeyDown={e => e.key === 'Enter' && handleSearch()}
          />
          <button 
            onClick={handleSearch} 
            className="bg-blue-600 hover:bg-blue-700 text-white w-12 h-12 rounded-xl font-black flex items-center justify-center shadow-lg transition-all active:scale-90"
          >
            <Search size={22}/>
          </button>
        </div>

        <AnimatePresence mode="wait">
          {selectedStudent && (
            <motion.div 
              key={selectedStudent.nim}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-[32px] shadow-2xl overflow-hidden border border-slate-200"
            >
              
              {/* PROFILE CARD */}
              <div className="bg-blue-600 p-6 md:p-8 text-white relative overflow-hidden">
                <div className="relative z-10 flex justify-between items-center gap-4">
                  <div className="flex-1">
                     <h2 className="text-xl md:text-2xl font-black tracking-tight leading-tight mb-1">{selectedStudent.name}</h2>
                     <p className="font-bold text-sm opacity-80 tracking-widest">NIM {selectedStudent.nim}</p>
                  </div>
                  <div className="bg-slate-900/40 backdrop-blur-md px-4 py-2 rounded-2xl border border-white/20 text-center min-w-[70px]">
                     <p className="text-[9px] font-black uppercase opacity-60 mb-0.5">ID</p>
                     <p className="text-2xl font-black italic text-white leading-none">#{selectedStudent.id}</p>
                  </div>
                </div>
                <div className="absolute -right-10 -bottom-10 opacity-10 rotate-12">
                  <Users size={150} />
                </div>
              </div>

              <div className="p-6 md:p-8">
                <div className="flex items-center gap-2 mb-6">
                  <Info size={18} className="text-blue-600" />
                  <h3 className="font-black text-sm uppercase tracking-tighter text-slate-800">Pilih Bulan Pembayaran</h3>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {selectedStudent.payments.map((p: any) => {
                    const pending = isMonthPending(p.month);
                    return (
                      <button 
                        key={p.month} 
                        disabled={p.isPaid || pending} 
                        onClick={() => toggleMonth(p.month)} 
                        className={`aspect-square md:h-24 rounded-2xl border-2 font-black transition-all flex flex-col items-center justify-center gap-1 ${
                          p.isPaid 
                          ? 'bg-green-50 border-green-500 text-green-600' 
                          : pending 
                          ? 'bg-orange-50 border-orange-400 text-orange-500 cursor-not-allowed' 
                          : selectedMonths.includes(p.month) 
                          ? 'bg-blue-600 border-blue-600 text-white shadow-lg scale-95' 
                          : 'bg-white border-slate-100 text-slate-300 hover:text-blue-600'
                        }`}
                      >
                        <span className="text-sm md:text-lg tracking-tighter uppercase">{p.month.substring(0,3)}</span>
                        <div className="text-[8px] font-black">
                          {p.isPaid ? (
                            <CheckCircle2 size={12}/>
                          ) : pending ? (
                            <span className="animate-pulse">PROSES</span>
                          ) : (
                            <span className="opacity-40">PILIH</span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* PAYMENT BAR */}
                {selectedMonths.length > 0 && (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-8 p-6 bg-slate-900 rounded-3xl text-white flex flex-col md:flex-row justify-between items-center gap-4 border-b-4 border-slate-800 shadow-xl"
                  >
                    <div className="text-center md:text-left">
                      <p className="text-slate-500 text-[9px] font-black uppercase tracking-[0.2em] mb-1">Total Pembayaran</p>
                      <div className="flex flex-col md:flex-row items-center gap-2">
                        <h2 className="text-3xl font-black tracking-tighter leading-none">Rp {totalBayar.toLocaleString()}</h2>
                        <span className="bg-blue-600/30 text-blue-400 px-2 py-0.5 rounded-lg text-[9px] font-bold">
                          KAS + ID #{selectedStudent.id}
                        </span>
                      </div>
                    </div>
                    <button 
                      onClick={() => setShowModal(true)} 
                      className="w-full md:w-auto bg-blue-600 hover:bg-blue-500 text-white px-8 py-3 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                    >
                      <QrCode size={20}/> BAYAR
                    </button>
                  </motion.div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* MODAL QRIS */}
        <AnimatePresence>
          {showModal && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-4 z-50"
            >
              <motion.div 
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                className="bg-white rounded-[40px] p-8 max-w-sm w-full text-center relative"
              >
                <button 
                  onClick={() => setShowModal(false)} 
                  className="absolute right-6 top-6 text-slate-300 hover:text-slate-900"
                >
                  <X size={28}/>
                </button>

                <h3 className="text-2xl font-black text-slate-900 mb-1 uppercase tracking-tight">QRIS PEMBAYARAN</h3>
                <p className="text-slate-400 mb-6 font-bold text-xs tracking-tight">Scan melalui m-Banking atau e-Wallet</p>
                
                <div className="bg-white p-4 border-4 border-slate-50 rounded-[30px] inline-block mb-6">
                  <QRCodeSVG value={qrisString} size={200} />
                </div>

                <div className="text-left bg-slate-50 p-6 rounded-3xl mb-6 border border-slate-200">
                  <div className="flex justify-between text-[10px] mb-2 font-black text-slate-400 uppercase tracking-widest">
                    <span>Kas {selectedMonths.length} Bulan</span>
                    <span className="text-slate-800">Rp {nominalKas.toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between text-[10px] pb-3 border-b border-slate-200 font-black text-slate-400 uppercase tracking-widest">
                    <span>Kode ID Anggota</span>
                    <span className="text-blue-600">Rp {memberId}</span>
                  </div>
                  <div className="flex justify-between pt-3 items-center">
                    <span className="font-black text-slate-900 uppercase text-[10px]">Total Bayar</span>
                    <span className="font-black text-blue-600 text-2xl tracking-tighter">Rp {totalBayar.toLocaleString()}</span>
                  </div>
                </div>

                <button 
                  onClick={handleConfirm} 
                  className="w-full bg-blue-600 text-white py-4 rounded-2xl font-black text-lg flex items-center justify-center gap-2 shadow-lg active:scale-95 transition-all"
                >
                  <Send size={20}/> KONFIRMASI PEMBAYARAN
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
}
