import { useEffect, useState } from 'react';
import { HiOutlineUserCircle, HiOutlineLockClosed, HiOutlineShieldCheck } from 'react-icons/hi';
import { Loading, formatDateTime } from '../components/ui/Shared';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

export default function ProfilPage() {
  const { user, refreshProfile, roleLabel } = useAuth();
  const [profile, setProfile] = useState(user);
  const [profileForm, setProfileForm] = useState({ name: user?.name || '', username: user?.username || '', email: user?.email || '' });
  const [loading, setLoading] = useState(true);
  const [profileSaving, setProfileSaving] = useState(false);
  const [saving, setSaving] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [passwordConfirmation, setPasswordConfirmation] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    let cancelled = false;
    api.get('/me')
      .then(({ data }) => {
        if (!cancelled) {
          const currentProfile = data?.user || data || user;
          setProfile(currentProfile);
          setProfileForm({ name: currentProfile?.name || '', username: currentProfile?.username || '', email: currentProfile?.email || '' });
        }
      })
      .catch((requestError) => {
        if (!cancelled) setError(requestError.response?.data?.message || 'Detail profil gagal dimuat.');
      })
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [user]);

  const updateProfile = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    setProfileSaving(true);
    try {
      await api.put('/me', profileForm);
      const updatedProfile = await refreshProfile();
      setProfile(updatedProfile);
      setProfileForm({ name: updatedProfile?.name || '', username: updatedProfile?.username || '', email: updatedProfile?.email || '' });
      setSuccess('Profil berhasil diperbarui.');
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (requestError.response?.data?.message || 'Profil gagal diperbarui.'));
    } finally {
      setProfileSaving(false);
    }
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setError('');
    setSuccess('');
    if (newPassword !== passwordConfirmation) {
      setError('Konfirmasi password baru belum sama.');
      return;
    }
    if (newPassword.length < 8) {
      setError('Password baru minimal 8 karakter.');
      return;
    }

    setSaving(true);
    try {
      const { data } = await api.put('/me/password', {
        current_password: currentPassword,
        password: newPassword,
        password_confirmation: passwordConfirmation,
      });
      setCurrentPassword('');
      setNewPassword('');
      setPasswordConfirmation('');
      setSuccess(data?.message || 'Password berhasil diubah.');
      await refreshProfile();
    } catch (requestError) {
      const errors = requestError.response?.data?.errors;
      setError(errors ? Object.values(errors).flat().join(' ') : (requestError.response?.data?.message || 'Password gagal diubah.'));
    } finally {
      setSaving(false);
    }
  };

  const details = [
    ['Nama', profile?.name || '-'],
    ['Username', profile?.username || '-'],
    ['Email', profile?.email || '-'],
    ['Peran', profile?.id === user?.id ? roleLabel : (profile?.role || '-')],
    ['Status akun', profile?.is_active === false ? 'Nonaktif' : 'Aktif'],
    ['Login terakhir', formatDateTime(profile?.last_login_at)],
    ['Akun dibuat', formatDateTime(profile?.created_at)],
  ];

  return (
    <main className="main-content page-enter" style={{ padding: '24px 28px', maxWidth: '1100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
        <HiOutlineUserCircle style={{ color: 'var(--primary-600)', fontSize: '28px' }} />
        <div>
          <h1 style={{ color: 'var(--gray-900)', fontSize: '20px', fontWeight: 700, margin: 0 }}>Profil Saya</h1>
          <p style={{ color: 'var(--gray-500)', fontSize: '0.85rem', margin: '4px 0 0' }}>Informasi akun dan pengaturan keamanan.</p>
        </div>
      </div>

      {error && <div className="alert alert-danger" role="alert">{error}</div>}
      {success && <div className="alert alert-success" role="status">{success}</div>}
      {loading && !profile ? <Loading /> : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '18px' }}>
          <section className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiOutlineUserCircle style={{ color: 'var(--primary-600)', fontSize: '20px' }} />
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Detail Akun</h2>
            </div>
            <div className="card-body">
              {details.map(([label, value]) => (
                <div key={label} style={{ display: 'grid', gridTemplateColumns: '125px 1fr', gap: '10px', padding: '10px 0', borderBottom: '1px solid var(--gray-100)' }}>
                  <span style={{ color: 'var(--gray-500)', fontSize: '0.85rem' }}>{label}</span>
                  <strong style={{ color: 'var(--gray-800)', fontSize: '0.85rem', overflowWrap: 'anywhere', textTransform: label === 'Peran' ? 'capitalize' : 'none' }}>{value}</strong>
                </div>
              ))}
            </div>
          </section>

          <section className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiOutlineUserCircle style={{ color: 'var(--primary-600)', fontSize: '20px' }} />
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Edit Profil</h2>
            </div>
            <form className="card-body" onSubmit={updateProfile}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="profile-name">Nama</label>
                <input id="profile-name" className="form-control" type="text" maxLength={255} value={profileForm.name} onChange={(event) => setProfileForm((form) => ({ ...form, name: event.target.value }))} required />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="profile-username">Username</label>
                <input id="profile-username" className="form-control" type="text" maxLength={100} pattern="[A-Za-z0-9._-]+" value={profileForm.username} onChange={(event) => setProfileForm((form) => ({ ...form, username: event.target.value }))} required />
                <small style={{ color: 'var(--gray-500)' }}>Gunakan huruf, angka, titik, garis bawah, atau tanda hubung.</small>
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label htmlFor="profile-email">Email</label>
                <input id="profile-email" className="form-control" type="email" maxLength={255} autoComplete="email" value={profileForm.email} onChange={(event) => setProfileForm((form) => ({ ...form, email: event.target.value }))} required />
              </div>
              <button type="submit" className="btn btn-primary" disabled={profileSaving}>
                {profileSaving ? 'Menyimpan...' : 'Simpan Profil'}
              </button>
            </form>
          </section>

          <section className="card">
            <div className="card-header" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <HiOutlineLockClosed style={{ color: 'var(--primary-600)', fontSize: '20px' }} />
              <h2 style={{ margin: 0, fontSize: '1rem' }}>Ubah Password</h2>
            </div>
            <form className="card-body" onSubmit={changePassword}>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="current-password">Password Saat Ini</label>
                <input id="current-password" className="form-control" type="password" autoComplete="current-password" value={currentPassword} onChange={(event) => setCurrentPassword(event.target.value)} required />
              </div>
              <div className="form-group" style={{ marginBottom: '14px' }}>
                <label htmlFor="new-password">Password Baru</label>
                <input id="new-password" className="form-control" type="password" autoComplete="new-password" minLength={8} value={newPassword} onChange={(event) => setNewPassword(event.target.value)} required />
                <small style={{ color: 'var(--gray-500)' }}>Minimal 8 karakter.</small>
              </div>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label htmlFor="confirm-password">Konfirmasi Password Baru</label>
                <input id="confirm-password" className="form-control" type="password" autoComplete="new-password" minLength={8} value={passwordConfirmation} onChange={(event) => setPasswordConfirmation(event.target.value)} required />
              </div>
              <div style={{ padding: '10px 12px', borderRadius: '8px', background: 'var(--primary-50)', color: 'var(--primary-800)', fontSize: '0.78rem', marginBottom: '16px' }}>
                <HiOutlineShieldCheck style={{ marginRight: '6px', verticalAlign: 'middle' }} />Password saat ini diperlukan untuk mengonfirmasi perubahan.
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? 'Menyimpan...' : 'Simpan Password Baru'}
              </button>
            </form>
          </section>
        </div>
      )}
    </main>
  );
}
