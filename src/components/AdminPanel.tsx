import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  Users,
  PlusCircle,
  Copy,
  Check,
  Trash2,
  Settings,
  Edit,
  MessageSquare,
  Search,
  Share2,
  FileText,
  LogOut,
  RefreshCw,
  Eye,
  CheckCircle,
  XCircle,
  Calendar,
  Smartphone
} from 'lucide-react';
import { Guest, Comment, Content, Settings as AppSettings, AuditLog, AdminStats } from '../types';

interface AdminPanelProps {
  onLogout: () => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ onLogout }) => {
  // Stats
  const [stats, setStats] = useState<AdminStats | null>(null);
  
  // Data arrays
  const [guests, setGuests] = useState<Guest[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  
  // Forms & configuration states
  const [appContent, setAppContent] = useState<Content | null>(null);
  const [appSettings, setAppSettings] = useState<AppSettings | null>(null);
  
  // App states
  const [activeTab, setActiveTab] = useState<'guests' | 'content' | 'comments' | 'audit'>('guests');
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('Semua');
  const [filterStatus, setFilterStatus] = useState('Semua');
  const [isLoading, setIsLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  
  // Copy helper feedback tracker
  const [copiedId, setCopiedId] = useState<number | null>(null);
  const [copiedWaId, setCopiedWaId] = useState<number | null>(null);

  // New Guest state
  const [newGuest, setNewGuest] = useState({ name: '', category: 'VVIP', whatsapp: '' });
  const [isCreatingGuest, setIsCreatingGuest] = useState(false);
  
  // Bulk Guest Input state
  const [bulkInput, setBulkInput] = useState('');
  const [bulkCategory, setBulkCategory] = useState('Umum');
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [isImportingBulk, setIsImportingBulk] = useState(false);

  // Editing modes
  const [editingGuestId, setEditingGuestId] = useState<number | null>(null);
  const [editGuestForm, setEditGuestForm] = useState<Partial<Guest>>({});

  // Content edit state representation
  const [editContentText, setEditContentText] = useState<string>('');
  const [saveStatus, setSaveStatus] = useState<string | null>(null);

  // Fetch all dashboard requirements
  const loadDashboardData = async () => {
    setIsLoading(true);
    setErrorMsg(null);
    try {
      // Fetch stats
      const statsResp = await fetch('/api/admin/stats');
      if (!statsResp.ok) throw new Error('Sesi tidak sah atau kedaluwarsa');
      const statsData = await statsResp.json();
      setStats(statsData);
      setAuditLogs(statsData.auditLogs || []);

      // Fetch guests
      const guestsResp = await fetch('/api/admin/guests');
      const guestsData = await guestsResp.json();
      if (guestsData.success) {
        setGuests(guestsData.guests);
      }

      // Fetch comments (all of them for moderation)
      const commentsResp = await fetch('/api/admin/comments');
      const commentsData = await commentsResp.json();
      if (commentsData.success) {
        setComments(commentsData.comments);
      }

      // Fetch public configs
      const configResp = await fetch('/api/public/content');
      const configData = await configResp.json();
      setAppContent(configData.content);
      setAppSettings(configData.settings);
      setEditContentText(JSON.stringify(configData.content, null, 2));

    } catch (err: any) {
      setErrorMsg(err.message || 'Gagal memuat dashboard');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, []);

  // WhatsApp bulk builder link helper
  const getWhatsAppLink = (guest: Guest) => {
    if (!appSettings) return '';
    const origin = window.location.origin;
    const inviteLink = `${origin}?code=${guest.code}`;
    
    let text = appSettings.generalOptions.whatsappGreetingTemplate;
    text = text.replace('{nama_tamu}', guest.name);
    text = text.replace('{link_undangan}', inviteLink);

    const encodedText = encodeURIComponent(text);
    return `https://api.whatsapp.com/send?phone=${guest.whatsapp}&text=${encodedText}`;
  };

  // WhatsApp text template viewer/copier for individual guest
  const handleCopyWaMessage = (guest: Guest) => {
    if (!appSettings) return;
    const origin = window.location.origin;
    const inviteLink = `${origin}?code=${guest.code}`;
    
    let text = appSettings.generalOptions.whatsappGreetingTemplate;
    text = text.replace('{nama_tamu}', guest.name);
    text = text.replace('{link_undangan}', inviteLink);

    navigator.clipboard.writeText(text);
    setCopiedWaId(guest.id);
    setTimeout(() => setCopiedWaId(null), 2000);
  };

  // Create Guest
  const handleCreateGuest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newGuest.name.trim()) return;
    setIsCreatingGuest(true);
    try {
      const response = await fetch('/api/admin/guests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newGuest)
      });
      const data = await response.json();
      if (data.success) {
        setNewGuest({ name: '', category: 'VVIP', whatsapp: '' });
        loadDashboardData(); // Reload statistics
      } else {
        alert(data.error || 'Gagal mendaftarkan tamu');
      }
    } catch {
      alert('Kegagalan jaringan');
    } finally {
      setIsCreatingGuest(false);
    }
  };

  // Bulk Import Guest list
  const handleBulkImport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!bulkInput.trim()) return;
    setIsImportingBulk(true);

    try {
      // Parse multi-line comma/semicolon strings
      const lines = bulkInput.split('\n');
      const parsedGuests = lines.map(line => {
        const parts = line.split(/[;,]/);
        const name = parts[0] ? parts[0].trim() : '';
        const category = parts[1] ? parts[1].trim() : bulkCategory;
        const whatsapp = parts[2] ? parts[2].trim().replace(/[^0-9]/g, '') : '';
        return { name, category, whatsapp };
      }).filter(g => g.name.length > 0);

      if (parsedGuests.length === 0) {
        alert('Format teks tidak valid');
        setIsImportingBulk(false);
        return;
      }

      const response = await fetch('/api/admin/guests/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ guests: parsedGuests })
      });
      const data = await response.json();
      
      if (data.success) {
        setBulkInput('');
        setShowBulkModal(false);
        loadDashboardData();
        alert(`Berhasil mengimpor ${data.count} tamu sekaligus!`);
      } else {
        alert(data.error || 'Gagal mengimpor daftar tamu');
      }
    } catch {
      alert('Kegagalan jaringan');
    } finally {
      setIsImportingBulk(false);
    }
  };

  // Toggle Guest status
  const toggleGuestActive = async (guest: Guest) => {
    try {
      const updatedStatus = guest.status_active === 1 ? 0 : 1;
      const resp = await fetch(`/api/admin/guests/${guest.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...guest,
          status_active: updatedStatus
        })
      });
      if (resp.ok) {
        loadDashboardData();
      }
    } catch {
      alert('Gagal memperbarui status');
    }
  };

  // Edit guest inline helper
  const saveGuestInline = async (id: number) => {
    try {
      const resp = await fetch(`/api/admin/guests/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(editGuestForm)
      });
      if (resp.ok) {
        setEditingGuestId(null);
        setEditGuestForm({});
        loadDashboardData();
      } else {
        const err = await resp.json();
        alert(err.error || 'Gagal memperbarui');
      }
    } catch {
      alert('Gagal memperbarui');
    }
  };

  // Delete Guest
  const handleDeleteGuest = async (id: number, name: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus undangan untuk: "${name}"?`)) return;
    try {
      const resp = await fetch(`/api/admin/guests/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        loadDashboardData();
      }
    } catch {
      alert('Gagal mendepak tamu');
    }
  };

  // Delete Comment (Buku Tamu msg)
  const handleDeleteComment = async (id: number) => {
    if (!confirm('Apakah ucapan luhur ini ingin dihapus selamanya?')) return;
    try {
      const resp = await fetch(`/api/admin/comments/${id}`, { method: 'DELETE' });
      if (resp.ok) {
        loadDashboardData();
      }
    } catch {
      alert('Gagal menghapus komentar');
    }
  };

  // Moderate approved state on comments
  const toggleCommentApproval = async (id: number, currentApproved: number) => {
    try {
      const updateVal = currentApproved === 1 ? false : true;
      const resp = await fetch(`/api/admin/comments/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ is_approved: updateVal })
      });
      if (resp.ok) {
        loadDashboardData();
      }
    } catch {
      alert('Gagal memperbarui persetujuan');
    }
  };

  // Modify entire web schema content live
  const handleSaveContent = async () => {
    setSaveStatus('Menyimpan...');
    try {
      const parsed = JSON.parse(editContentText);
      const resp = await fetch('/api/admin/content', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });
      if (resp.ok) {
        setSaveStatus('Berhasil disimpan!');
        loadDashboardData();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        const er = await resp.json();
        setSaveStatus('Gagal: ' + er.error);
      }
    } catch (err: any) {
      setSaveStatus('Format JSON keliru: ' + err.message);
    }
  };

  // Live save individual settings like template Greeting WA
  const handleUpdateSettings = async (updatedSettings: AppSettings) => {
    try {
      const resp = await fetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedSettings)
      });
      if (resp.ok) {
        setAppSettings(updatedSettings);
        alert('Skema template WhatsApp berhasil disimpan!');
        loadDashboardData();
      }
    } catch {
      alert('Gagal menyimpan settings');
    }
  };

  // Simple CSV Client-Side Downloader
  const downloadGuestsCSV = () => {
    let csvContent = 'data:text/csv;charset=utf-8,';
    csvContent += 'Nama Tamu,Kode Unik,Kategori,Nomor WhatsApp,Status RSVP,Tamu Hadir,Jumlah Buka,Tautan Undangan\n';
    
    guests.forEach(g => {
      const origin = window.location.origin;
      const inviteUrl = `${origin}?code=${g.code}`;
      const line = `"${g.name}","${g.code}","${g.category}","${g.whatsapp}","${g.status}",${g.guest_count},${g.opened_count},"${inviteUrl}"`;
      csvContent += line + '\n';
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', 'daftar_tamu_ria_iqram.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtering list items
  const filteredGuests = guests.filter(g => {
    const matchesSearch = g.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          g.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          g.whatsapp.includes(searchQuery);
    const matchesCategory = filterCategory === 'Semua' || g.category === filterCategory;
    const matchesStatus = filterStatus === 'Semua' || g.status === filterStatus;
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 font-sans pb-12">
      {/* 1. TOP NAVBAR BRANDING */}
      <header className="bg-stone-900 border-b border-stone-800 p-4 px-6 sticky top-0 z-50 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-batik-brown text-gold-shine border border-gold-gentle rounded-lg flex items-center justify-center font-bold text-md">
            R&I
          </div>
          <div>
            <h1 className="font-serif text-md md:text-lg text-white font-bold leading-none tracking-wide">
              Ria & Iqram Wedding Dashboard
            </h1>
            <span className="text-[10px] text-gold-gentle/80 uppercase font-mono tracking-wider">SECURE ADM PANEL</span>
          </div>
        </div>

        <button
          onClick={onLogout}
          className="flex items-center gap-1 px-3 py-1.5 rounded-lg border border-stone-800 text-xs text-black hover:text-white hover:bg-stone-800 cursor-pointer transition-colors"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Keluar</span>
        </button>
      </header>

      <div className="max-w-7xl mx-auto p-4 md:p-6 lg:p-8">
        
        {/* Error notifications */}
        {errorMsg && (
          <div className="bg-red-950/40 border border-red-800 text-red-300 p-4 rounded-xl text-xs mb-8 flex items-center justify-between">
            <span>Kesalahan: {errorMsg}</span>
            <button onClick={loadDashboardData} className="p-1 text-white hover:text-gold-shine"><RefreshCw size={14} /></button>
          </div>
        )}

        {/* 2. CORE STATISTICAL NUMERATOR PANELS */}
        {stats && (
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-black text-xs uppercase tracking-widest font-mono">
                <Users size={12} className="text-blue-400" />
                <span>Total Tamu</span>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2 mb-1">{stats.totalInvited}</p>
              <span className="text-[9px] text-stone-500">Undangan terdaftar</span>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-black text-xs uppercase tracking-widest font-mono">
                <Eye size={12} className="text-emerald-400" />
                <span>Total Baca</span>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2 mb-1">{stats.openedCount}</p>
              <span className="text-[9px] text-stone-500">Klik buka undangan</span>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-black text-xs uppercase tracking-widest font-mono">
                <CheckCircle size={12} className="text-green-400" />
                <span>Sanggup Hadir</span>
              </div>
              <div className="flex items-baseline gap-2 mt-2 mb-1">
                <p className="text-2xl font-bold font-mono text-white">{stats.countHadir}</p>
                <span className="text-[10px] text-black">({stats.totalHadirTamu} Pax)</span>
              </div>
              <span className="text-[9px] text-stone-500">Telah konfirmasi datang</span>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl">
              <div className="flex items-center gap-2 text-black text-xs uppercase tracking-widest font-mono">
                <XCircle size={12} className="text-red-400" />
                <span>Absen</span>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2 mb-1">{stats.countTidakHadir}</p>
              <span className="text-[9px] text-stone-500">Tamu berhalangan hadir</span>
            </div>

            <div className="bg-stone-900 border border-stone-800 p-4 rounded-2xl col-span-2 lg:col-span-1">
              <div className="flex items-center gap-2 text-black text-xs uppercase tracking-widest font-mono">
                <MessageSquare size={12} className="text-yellow-400" />
                <span>Ucapan</span>
              </div>
              <p className="text-2xl font-bold font-mono text-white mt-2 mb-1">{stats.totalComments}</p>
              <span className="text-[9px] text-stone-500">Pesan di buku tamu</span>
            </div>
          </div>
        )}

        {/* 3. TABS HEADER NAVIGATION CONTROL */}
        <div className="flex items-center gap-2 overflow-x-auto border-b border-stone-800 mb-8 pb-px">
          {[
            { id: 'guests', label: 'Daftar Tamu & WA', icon: Users },
            { id: 'content', label: 'Isi Detail Undangan', icon: Settings },
            { id: 'comments', label: 'Moderasi Ucapan', icon: MessageSquare },
            { id: 'audit', label: 'Log Security', icon: FileText }
          ].map(tab => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center gap-2 px-5 py-3 text-xs uppercase tracking-widest font-semibold cursor-pointer border-b-2 whitespace-nowrap transition-colors ${
                  activeTab === tab.id
                    ? 'border-gold-gentle text-gold-shine bg-stone-900'
                    : 'border-transparent text-black hover:text-white hover:bg-stone-900'
                }`}
              >
                <Icon size={13} />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>

        {/* 4. ACTIVE TAB LAYOUT CONTENT */}

        {/* TAB 4.1: GUESTS AND WHATSAPP MESSAGE AREA */}
        {activeTab === 'guests' && (
          <div className="space-y-8">
            
            {/* Action Bar (Search and Single Input Entry) */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
              
              {/* Add New Guest Form Block */}
              <div className="lg:col-span-4 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow">
                <h3 className="text-xs uppercase font-mono tracking-widest text-gold-gentle font-bold mb-4 flex items-center gap-2">
                  <PlusCircle size={14} />
                  <span>Daftarkan Tamu Baru</span>
                </h3>

                <form onSubmit={handleCreateGuest} className="space-y-4 text-xs">
                  <div>
                    <label className="block text-black mb-1">Nama Tamu</label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Bapak Ir. Joko Widodo"
                      value={newGuest.name}
                      onChange={(e) => setNewGuest({ ...newGuest, name: e.target.value })}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 focus:border-gold-gentle focus:outline-none"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-black mb-1">Kategori</label>
                      <select
                        value={newGuest.category}
                        onChange={(e) => setNewGuest({ ...newGuest, category: e.target.value })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 focus:border-gold-gentle focus:outline-none"
                      >
                        <option value="VVIP">VVIP / Keluarga</option>
                        <option value="VIP">VIP</option>
                        <option value="Umum">Umum / Rekan Kerja</option>
                        <option value="Teman Dekat">Teman Dekat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-black mb-1">WhatsApp (62...)</label>
                      <input
                        type="tel"
                        placeholder="6281234..."
                        value={newGuest.whatsapp}
                        onChange={(e) => setNewGuest({ ...newGuest, whatsapp: e.target.value.replace(/[^0-9]/g, '') })}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 focus:border-gold-gentle focus:outline-none"
                      />
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isCreatingGuest}
                    className="w-full py-3 bg-batik-brown hover:bg-amber-800 text-white border border-gold-gentle font-bold uppercase rounded-xl tracking-widest cursor-pointer transition-colors"
                  >
                    {isCreatingGuest ? 'Menyimpan...' : 'Generate Undangan'}
                  </button>
                </form>

                {/* Bulk entry trigger link */}
                <div className="mt-4 pt-4 border-t border-stone-850 text-center">
                  <button
                    onClick={() => setShowBulkModal(true)}
                    className="text-gold-gentle hover:text-white text-xs font-mono font-bold"
                  >
                    ⚡ MASUKKAN BANYAK TAMU SEKALIGUS (BULK)
                  </button>
                </div>
              </div>

              {/* Guests Table list block */}
              <div className="lg:col-span-8 bg-stone-900 border border-stone-800 rounded-2xl p-5 shadow flex flex-col justify-between">
                
                {/* Search / Filters Headers */}
                <div className="flex flex-col sm:flex-row gap-3 items-center justify-between border-b border-stone-850 pb-4 mb-4">
                  <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-3.5 text-stone-500" size={14} />
                    <input
                      type="text"
                      placeholder="Cari nama, kode, nomor..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="w-full bg-stone-950 border border-stone-800 rounded-xl py-2.5 pl-9 pr-4 text-xs focus:border-gold-gentle focus:outline-none"
                    />
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto text-xs">
                    <select
                      value={filterCategory}
                      onChange={(e) => setFilterCategory(e.target.value)}
                      className="bg-stone-950 border border-stone-800 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Semua">Semua Kategori</option>
                      <option value="VVIP">VVIP/Keluarga</option>
                      <option value="VIP">VIP</option>
                      <option value="Umum">Umum</option>
                      <option value="Teman Dekat">Teman Dekat</option>
                    </select>

                    <select
                      value={filterStatus}
                      onChange={(e) => setFilterStatus(e.target.value)}
                      className="bg-stone-950 border border-stone-800 rounded-lg p-2 focus:outline-none"
                    >
                      <option value="Semua">Semua Status</option>
                      <option value="hadir">Sanggup Hadir (Y)</option>
                      <option value="tidak_hadir">Absen (N)</option>
                      <option value="belum_respon">Menunggu (?)</option>
                    </select>

                    <button
                      onClick={downloadGuestsCSV}
                      className="px-3 py-2 bg-stone-950 border border-stone-850 rounded-lg text-black hover:text-gold-shine text-[11px] flex items-center gap-1 font-mono cursor-pointer"
                      title="Unduh file Excel/CSV"
                    >
                      <FileText size={12} />
                      <span>Export</span>
                    </button>
                  </div>
                </div>

                {/* Table View */}
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs text-black">
                    <thead>
                      <tr className="border-b border-stone-800 text-black uppercase tracking-wider font-mono text-[10px]">
                        <th className="py-3 px-2">Tamu & Kategori</th>
                        <th className="py-3 px-2">Kode / Link Undangan</th>
                        <th className="py-3 px-2">Rawuh? (Pax)</th>
                        <th className="py-3 px-2">Buka</th>
                        <th className="py-3 px-2 text-center">Aksi Pengiriman WA / Admin</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-stone-850">
                      {filteredGuests.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="py-8 text-center text-stone-500 font-mono">
                            Tidak ditemukan tamu undangan yang sesuai
                          </td>
                        </tr>
                      ) : (
                        filteredGuests.map((g) => {
                          const isEditing = editingGuestId === g.id;
                          const guestInviteUrl = `${window.location.origin}?code=${g.code}`;
                          
                          return (
                            <tr key={g.id} className="hover:bg-stone-850/30 transition-colors">
                              <td className="py-3 px-2 max-w-xs">
                                {isEditing ? (
                                  <div className="space-y-1">
                                    <input
                                      type="text"
                                      value={editGuestForm.name || ''}
                                      onChange={(e) => setEditGuestForm({ ...editGuestForm, name: e.target.value })}
                                      className="bg-stone-950 border border-stone-800 p-1.5 rounded text-xs w-full"
                                    />
                                    <input
                                      type="text"
                                      value={editGuestForm.category || ''}
                                      onChange={(e) => setEditGuestForm({ ...editGuestForm, category: e.target.value })}
                                      className="bg-stone-950 border border-stone-800 p-1.5 rounded text-xs w-full"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <p className="font-bold text-white text-sm leading-tight">{g.name}</p>
                                    <span className="inline-block mt-1 px-2 py-px bg-stone-950 rounded text-[9px] font-mono text-gold-gentle">
                                      {g.category}
                                    </span>
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-2 font-mono">
                                <div className="space-y-1">
                                  <div className="flex items-center gap-1.5 text-[10px]">
                                    <span className="text-white font-bold bg-amber-900/30 px-1.5 py-0.5 rounded border border-amber-800/30">
                                      {g.code}
                                    </span>
                                    <button
                                      onClick={() => {
                                        navigator.clipboard.writeText(guestInviteUrl);
                                        setCopiedId(g.id);
                                        setTimeout(() => setCopiedId(null), 1500);
                                      }}
                                      className="text-[#000000] hover:text-white"
                                      title="Copy Link Undangan"
                                    >
                                      {copiedId === g.id ? <Check size={11} className="text-green-500" /> : <Copy size={11} />}
                                    </button>
                                  </div>
                                  {isEditing ? (
                                    <input
                                      type="tel"
                                      value={editGuestForm.whatsapp || ''}
                                      onChange={(e) => setEditGuestForm({ ...editGuestForm, whatsapp: e.target.value })}
                                      className="bg-stone-950 border border-stone-800 p-1 rounded text-[10px] w-full"
                                    />
                                  ) : (
                                    <p className="text-[10px] text-stone-500">WA: {g.whatsapp || '-'}</p>
                                  )}
                                </div>
                              </td>

                              <td className="py-3 px-2">
                                {isEditing ? (
                                  <div className="space-y-1 text-[10px]">
                                    <select
                                      value={editGuestForm.status || 'belum_respon'}
                                      onChange={(e) => setEditGuestForm({ ...editGuestForm, status: e.target.value as any })}
                                      className="bg-stone-950 border border-stone-800 rounded p-1"
                                    >
                                      <option value="belum_respon">Menunggu</option>
                                      <option value="hadir">Hadir</option>
                                      <option value="tidak_hadir">Absen</option>
                                    </select>
                                    <input
                                      type="number"
                                      value={editGuestForm.guest_count || 1}
                                      onChange={(e) => setEditGuestForm({ ...editGuestForm, guest_count: parseInt(e.target.value) })}
                                      className="bg-stone-950 border border-stone-800 rounded p-1 w-12"
                                    />
                                  </div>
                                ) : (
                                  <div>
                                    <span className={`inline-block px-2 py-0.5 rounded text-[9px] font-semibold ${
                                      g.status === 'hadir' ? 'bg-green-950 text-green-300' :
                                      g.status === 'tidak_hadir' ? 'bg-red-950 text-red-300' :
                                      'bg-stone-800 text-black'
                                    }`}>
                                      {g.status === 'hadir' ? 'Hadir' : g.status === 'tidak_hadir' ? 'Absen' : 'Menunggu'}
                                    </span>
                                    {g.status === 'hadir' && <p className="text-[10px] mt-0.5 font-bold font-mono text-white">{g.guest_count} Pax</p>}
                                  </div>
                                )}
                              </td>

                              <td className="py-3 px-2 font-mono">
                                <p className="text-white text-xs">{g.opened_count}x</p>
                                <span className="text-[9px] text-stone-500 block leading-none">
                                  {g.last_opened_at ? new Date(g.last_opened_at).toLocaleDateString('id-ID', {day:'2-digit', month: 'short'}) : 'belum'}
                                </span>
                              </td>

                              <td className="py-3 px-2">
                                <div className="flex items-center justify-center gap-2">
                                  {isEditing ? (
                                    <>
                                      <button
                                        onClick={() => saveGuestInline(g.id)}
                                        className="text-green-400 hover:text-green-300 px-2 py-1 bg-green-950/20 rounded border border-green-900"
                                      >
                                        Simpan
                                      </button>
                                      <button
                                        onClick={() => { setEditingGuestId(null); setEditGuestForm({}); }}
                                        className="text-black hover:text-black px-2 py-1 bg-stone-800 rounded border border-stone-750"
                                      >
                                        Batal
                                      </button>
                                    </>
                                  ) : (
                                    <>
                                      {/* WhatsApp Launcher templates */}
                                      {g.whatsapp ? (
                                        <a
                                          href={getWhatsAppLink(g)}
                                          target="_blank"
                                          rel="noreferrer"
                                          className="p-1 px-2.5 rounded bg-green-950 text-green-400 border border-green-800 flex items-center justify-center gap-1 hover:bg-green-900 transition-colors"
                                          title="Buka WhatsApp Chat"
                                        >
                                          <Smartphone size={11} />
                                          <span className="text-[10px]">Kirim</span>
                                        </a>
                                      ) : (
                                        <span className="text-[10px] text-stone-600 block">-</span>
                                      )}

                                      {/* WA Message layout text only copier */}
                                      <button
                                        onClick={() => handleCopyWaMessage(g)}
                                        className="p-1 px-2 bg-stone-950 text-black hover:bg-stone-800 border border-stone-850 rounded"
                                        title="Copy Template Pesan"
                                      >
                                        {copiedWaId === g.id ? <Check size={11} className="text-emerald-500" /> : <Copy size={11} />}
                                      </button>

                                      {/* Enable / Disable Active check togglers */}
                                      <button
                                        onClick={() => toggleGuestActive(g)}
                                        className={`p-1 border rounded text-[10px] ${g.status_active === 1 ? 'border-amber-800 text-gold-gentle' : 'border-stone-800 text-stone-600'}`}
                                        title={g.status_active === 1 ? 'Matikan Akses Undangan' : 'Aktifkan Akses'}
                                      >
                                        {g.status_active === 1 ? 'Aktif' : 'Off'}
                                      </button>

                                      {/* Inline edit */}
                                      <button
                                        onClick={() => { setEditingGuestId(g.id); setEditGuestForm(g); }}
                                        className="p-1 text-stone-450 hover:text-white"
                                        title="Edit Tamu"
                                      >
                                        <Edit size={12} />
                                      </button>

                                      {/* Delete */}
                                      <button
                                        onClick={() => handleDeleteGuest(g.id, g.name)}
                                        className="p-1 text-red-500 hover:text-red-300 cursor-pointer"
                                        title="Hapus"
                                      >
                                        <Trash2 size={12} />
                                      </button>
                                    </>
                                  )}
                                </div>
                              </td>

                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="text-[10px] text-stone-500 font-mono mt-4 text-center">
                  Menampilkan {filteredGuests.length} dari {guests.length} tamu terintegrasi
                </div>
              </div>

            </div>

            {/* WA General Template configuration section */}
            {appSettings && (
              <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow max-w-2xl">
                <h3 className="text-xs uppercase font-mono tracking-widest text-gold-gentle font-bold mb-3">
                  Edit Template Pesan WhatsApp Undangan
                </h3>
                <p className="text-xs text-black mb-4 font-sans leading-normal">
                  Pesan di bawah ini adalah acuan isi undangan otomatis yang dikirim ke gawai tamu. 
                  Anda dapat menyertakan penanda <span className="text-gold-gentle font-bold font-mono">{`{nama_tamu}`}</span> dan <span className="text-gold-gentle font-bold font-mono">{`{link_undangan}`}</span> yang akan digantikan secara otomatis oleh mesin.
                </p>

                <textarea
                  rows={6}
                  value={appSettings.generalOptions.whatsappGreetingTemplate}
                  onChange={(e) => {
                    const next = { ...appSettings };
                    next.generalOptions.whatsappGreetingTemplate = e.target.value;
                    setAppSettings(next);
                  }}
                  className="w-full bg-stone-950 border border-stone-800 focus:border-gold-gentle focus:outline-none rounded-xl p-3.5 text-xs text-stone-100 font-mono"
                />

                <div className="flex items-center justify-between mt-4">
                  <span className="text-[10px] text-stone-500 font-mono">Format: Raw text + Autoreplace indicators ready</span>
                  <button
                    onClick={() => handleUpdateSettings(appSettings)}
                    className="px-4 py-2 bg-gradient-to-r from-batik-brown to-stone-900 border border-gold-gentle hover:to-batik-brown text-white font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer transition"
                  >
                    Simpan Template
                  </button>
                </div>
              </div>
            )}

            {/* BULK GUESTS MODAL */}
            {showBulkModal && (
              <div className="fixed inset-0 bg-black/80 flex items-center justify-center p-4 z-[1001]">
                <div className="bg-stone-900 border border-stone-800 rounded-3xl p-6 md:p-8 max-w-xl w-full text-left relative shadow-2xl">
                  <button
                    onClick={() => setShowBulkModal(false)}
                    className="absolute top-4 right-4 text-black hover:text-white font-bold text-2xl cursor-pointer"
                  >
                    ×
                  </button>

                  <h3 className="font-serif text-lg font-bold text-gold-gentle tracking-wide mb-2">Impor Banyak Tamu Sekaligus</h3>
                  <p className="text-xs text-black font-sans leading-normal mb-6">
                    Tuliskan atau tempel nama tamu secara terstruktur, maksimal satu baris per orang. Anda bisa memisahkan nama, kategori, dan nomor HP memakai koma (,) atau titik-koma (;).
                    <br />
                    <span className="text-black font-semibold font-mono block mt-1.5 p-2 bg-stone-950 rounded text-[11px]">
                      Format baris: Nama Tamu, Kategori (Opsional), WhatsApp (Opsional)
                    </span>
                    <br />
                    Contoh baris input:
                    <br />
                    <span className="font-mono text-[10px] leading-tight text-gold-gentle block max-w-xs mt-1">
                      Budi Raharjo, Keluarga Inti, 6281223344<br />
                      Siska Melinda; Rekan Kerja; 628994433
                    </span>
                  </p>

                  <form onSubmit={handleBulkImport} className="space-y-4">
                    <div>
                      <label className="block text-xs uppercase tracking-widest text-black mb-1">Kategori Default (Jika baris tidak menyebutkan)</label>
                      <select
                        value={bulkCategory}
                        onChange={(e) => setFilterCategory(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 focus:border-gold-gentle focus:outline-none text-xs"
                      >
                        <option value="Umum">Umum</option>
                        <option value="VVIP">VVIP / Keluarga</option>
                        <option value="VIP">VIP</option>
                        <option value="Teman Dekat">Teman Dekat</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-xs uppercase tracking-widest text-black mb-1">Daftar Baris Tamu</label>
                      <textarea
                        required
                        rows={8}
                        placeholder="Contoh:&#10;Bapak Hartanto; VIP; 628135261&#10;Ibu Lestari; Keluarga; 628994119"
                        value={bulkInput}
                        onChange={(e) => setBulkInput(e.target.value)}
                        className="w-full bg-stone-950 border border-stone-800 rounded-xl p-3 text-xs focus:border-gold-gentle focus:outline-none font-mono"
                      />
                    </div>

                    <div className="flex justify-end gap-3 pt-4 border-t border-stone-850">
                      <button
                        type="button"
                        onClick={() => setShowBulkModal(false)}
                        className="px-4 py-2 border border-stone-800 rounded-lg text-xs text-black hover:text-white"
                      >
                        Kembali
                      </button>
                      <button
                        type="submit"
                        disabled={isImportingBulk}
                        className="px-5 py-2 bg-batik-brown text-white border border-gold-gentle font-bold text-xs uppercase tracking-widest rounded-lg"
                      >
                        {isImportingBulk ? 'Memproses...' : 'Impor Daftar Tamu'}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        )}

        {/* TAB 4.2 CONTENT & METADATA CONFIG EDITOR */}
        {activeTab === 'content' && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow">
            <h3 className="font-serif text-lg font-bold text-gold-gentle tracking-wide mb-2">Edit Konten Halaman Web Pernikahan</h3>
            <p className="text-xs text-black mb-6 font-sans leading-normal">
              Acuan di bawah ini adalah manifest utama (JSON) yang berisikan rincian nama pengantin, quotes adat, data kado rekening bank, rundown acara, hingga gambar prewedding di galeri. Modifikasi data di dalam blok valid JSON di bawah ini, lalu klik Simpan.
            </p>

            <textarea
              rows={22}
              value={editContentText}
              onChange={(e) => setEditContentText(e.target.value)}
              className="w-full bg-stone-950 border border-stone-800 focus:border-gold-gentle focus:outline-none rounded-2xl p-4 text-xs font-mono text-emerald-400"
            />

            {saveStatus && (
              <div className="mt-4 p-3 rounded-lg text-xs bg-stone-950 border border-stone-800 text-gold-gentle font-mono">
                {saveStatus}
              </div>
            )}

            <div className="flex justify-end gap-3 mt-6">
              <button
                onClick={() => {
                  if (appContent) {
                    setEditContentText(JSON.stringify(appContent, null, 2));
                    setSaveStatus('Format dibatalkan ke asal');
                    setTimeout(() => setSaveStatus(null), 1500);
                  }
                }}
                className="px-4 py-2 border border-stone-800 rounded-lg text-xs text-black hover:text-white cursor-pointer"
              >
                Reset Perubahan
              </button>
              <button
                onClick={handleSaveContent}
                className="px-6 py-2.5 bg-batik-brown text-white border border-gold-gentle font-bold text-xs uppercase tracking-widest rounded-lg cursor-pointer"
              >
                Simpan Perubahan
              </button>
            </div>
          </div>
        )}

        {/* TAB 4.3: COMMENTS MODERATION (BUKU TAMU APPROVE LIST) */}
        {activeTab === 'comments' && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow">
            <h3 className="font-serif text-lg font-bold text-gold-gentle tracking-wide mb-2">Moderasi Buku Tamu (Ucapan Pengunjung)</h3>
            <p className="text-xs text-black mb-6 font-sans leading-normal">
              Gunakan panel ini untuk mengawasi ucapan doa dan restu yang ditulis oleh para tamu. Anda bebas menyembunyikan tulisan spans/spam atau menghapus komentar secara permanen.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left text-black">
                <thead>
                  <tr className="border-b border-stone-800 text-black font-mono uppercase text-[10px]">
                    <th className="py-3 px-2">Nama Tamu & Code</th>
                    <th className="py-3 px-2">Pesan Ucapan Restu</th>
                    <th className="py-3 px-2 text-center">Status Persetujuan</th>
                    <th className="py-3 px-2 text-center">Batal / Hapus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-stone-850">
                  {comments.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-stone-500 font-mono">No comments found to moderate</td>
                    </tr>
                  ) : (
                    comments.map((com) => (
                      <tr key={com.id} className="hover:bg-stone-850/20">
                        <td className="py-4 px-2">
                          <p className="font-bold text-white text-sm">{com.name}</p>
                          <span className="text-[10px] font-mono text-stone-500">{com.code ? `Code: ${com.code}` : ''}</span>
                        </td>
                        <td className="py-4 px-2 font-sans italic max-w-md">
                          “{com.comment}”
                          <span className="block text-[9px] font-mono text-stone-500 mt-1 leading-none">
                            {new Date(com.created_at).toLocaleString('id-ID')}
                          </span>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => toggleCommentApproval(com.id, com.is_approved || 0)}
                            className={`px-3 py-1 rounded-full text-[10px] font-semibold border ${
                              com.is_approved === 1
                                ? 'bg-green-950/40 text-green-300 border-green-800'
                                : 'bg-red-950/40 text-red-300 border-red-800'
                            }`}
                          >
                            {com.is_approved === 1 ? 'Approved' : 'Hidden'}
                          </button>
                        </td>
                        <td className="py-4 px-2 text-center">
                          <button
                            onClick={() => handleDeleteComment(com.id)}
                            className="p-2 text-red-500 hover:text-red-300 rounded hover:bg-red-950/30"
                            title="Hapus Kado Doa luhur"
                          >
                            <Trash2 size={13} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* TAB 4.4: REQ SECURITY AUDIT LOG LIST */}
        {activeTab === 'audit' && (
          <div className="bg-stone-900 border border-stone-800 rounded-2xl p-6 shadow">
            <h3 className="font-serif text-lg font-bold text-gold-gentle tracking-wide mb-2">Audit Log Logins & Admin Actions</h3>
            <p className="text-xs text-black mb-6 font-sans leading-normal">
              Daftar di bawah memantau operasi keamanan sensitif yang teridentifikasi di server, seperti pembuatan/penghapusan tautan tamu, perubahan konten JSON, atau masuk admin.
            </p>

            <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 font-mono text-xs">
              {auditLogs.length === 0 ? (
                <div className="py-8 text-center text-stone-500">Belum ada aktivitas yang terekam</div>
              ) : (
                auditLogs.map((log, i) => (
                  <div key={i} className="bg-stone-950 p-3 rounded-xl border border-stone-850 flex flex-col md:flex-row md:items-center justify-between gap-2">
                    <div className="flex items-start md:items-center gap-2">
                      <span className="text-[10px] text-stone-500 flex-shrink-0">
                        {new Date(log.timestamp).toLocaleTimeString('id-ID')}
                      </span>
                      <span className={`px-1.5 py-0.5 rounded text-[8px] font-bold ${
                        log.action.includes('FAILED') ? 'bg-red-950 text-red-400 border border-red-900' :
                        log.action.includes('SUCCESS') || log.action.includes('CREATED') ? 'bg-emerald-950 text-emerald-400 border border-emerald-900' :
                        'bg-stone-900 text-black'
                      }`}>
                        {log.action}
                      </span>
                      <p className="text-black font-sans leading-tight text-xs">{log.details}</p>
                    </div>
                    <span className="text-[10px] text-stone-600 block self-end">
                      {new Date(log.timestamp).toLocaleDateString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

      </div>
    </div>
  );
};
