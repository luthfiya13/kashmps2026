"use client";
import { useNavigate } from 'react-router-dom';
import { signInWithPopup } from 'firebase/auth';
import { auth, googleProvider } from '../../lib/firebase';

const ADMIN_EMAILS = ["zuhurasf1311@gmail.com", "admin2@gmail.com", "admin3@gmail.com"];

export default function AdminLogin() {
  const navigate = useNavigate();

  const handleGoogleLogin = async () => {
    try {
      const result = await signInWithPopup(auth, googleProvider);
      if (result.user.email && ADMIN_EMAILS.includes(result.user.email)) {
        localStorage.setItem('isAdmin', 'true');
        navigate('/admin/dashboard');
      } else {
        alert("Email ini tidak terdaftar sebagai Admin!");
      }
    } catch (error: any) {
      console.error("Login Error:", error);
      let msg = "Gagal login dengan Google.";
      if (error.code === 'auth/popup-blocked') msg = "Popup diblokir oleh browser! Izinkan popup untuk situs ini.";
      if (error.code === 'auth/operation-not-allowed') msg = "Metode Google Login belum diaktifkan di Firebase Console.";
      if (error.code === 'auth/unauthorized-domain') msg = "Domain ini (localhost) belum terdaftar di Authorized Domains Firebase.";
      alert(`${msg}\n\nDetail Error: ${error.code}`);
    }
  };

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-4">
      <div className="bg-white p-10 rounded-[40px] shadow-2xl max-w-md w-full text-center">
        <h1 className="text-3xl font-black mb-8 text-slate-800 tracking-tight">ADMIN PORTAL</h1>
        
        <p className="text-slate-500 font-bold mb-8 text-sm">
          Akses khusus pengurus HMPS Sains Data. Silakan masuk menggunakan akun Google terdaftar.
        </p>

        <button 
          onClick={handleGoogleLogin}
          className="w-full bg-blue-600 text-white py-5 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-700 transition-all shadow-xl shadow-blue-100 active:scale-95"
        >
          <img src="https://www.gstatic.com/firebase/anonymous-app.png" className="w-6 h-6 invert" alt="Google" />
          MASUK DENGAN GOOGLE
        </button>
        
        <button 
          onClick={() => navigate('/')}
          className="mt-6 text-slate-400 font-bold text-xs uppercase tracking-widest hover:text-slate-600 transition-all"
        >
          Kembali ke Halaman Utama
        </button>
      </div>
    </div>
  );
}
