
import React, { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { uploadImage } from '../../utils/upload';
import { User as UserIcon, Shield, Camera, Save, Plus, Users, UserPlus } from 'lucide-react';

export default function AdminSettingsPage() {
    const { user, profile, loading: authLoading } = useAuth();
    const [activeTab, setActiveTab] = useState<'profile' | 'team'>('profile');

    // Profile State
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState('');
    const [bio, setBio] = useState('');
    const [avatarUrl, setAvatarUrl] = useState('');
    const [uploading, setUploading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    // Team State
    const [team, setTeam] = useState<any[]>([]);
    const [loadingTeam, setLoadingTeam] = useState(false);
    const [newUserEmail, setNewUserEmail] = useState('');
    const [newUserPass, setNewUserPass] = useState('');
    const [newUserName, setNewUserName] = useState('');
    const [newUserBio, setNewUserBio] = useState('');
    const [newUserRole, setNewUserRole] = useState('Jornalista');
    const [creatingUser, setCreatingUser] = useState(false);
    const [creationMsg, setCreationMsg] = useState<{ type: 'success' | 'error', text: string } | null>(null);

    useEffect(() => {
        if (profile) {
            setFullName(profile.full_name || '');
            setRole(profile.role || 'Jornalista');
            setBio(profile.bio || '');
            setAvatarUrl(profile.avatar_url || '');
        }
    }, [profile]);

    useEffect(() => {
        if (activeTab === 'team') {
            fetchTeam();
        }
    }, [activeTab]);

    const fetchTeam = async () => {
        setLoadingTeam(true);
        const { data, error } = await supabase.from('horapiaui_profiles').select('*');
        if (error) {
            console.error('Error loading team:', error);
        } else if (data) {
            setTeam(data);
        }
        setLoadingTeam(false);
    };

    const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (!e.target.files?.length) return;
        setUploading(true);
        try {
            const url = await uploadImage(e.target.files[0]);
            if (url) setAvatarUrl(url);
        } catch (error) {
            console.error(error);
            setStatusMsg({ type: 'error', text: 'Erro ao enviar imagem.' });
        } finally {
            setUploading(false);
        }
    };

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        setSaving(true);
        setStatusMsg(null);
        try {
            const { error } = await supabase
                .from('horapiaui_profiles')
                .update({
                    full_name: fullName,
                    role: role,
                    bio: bio,
                    avatar_url: avatarUrl,
                    updated_at: new Date().toISOString()
                })
                .eq('id', user?.id);

            if (error) throw error;
            // Update Auth metadata too to keep sync in sessions
            await supabase.auth.updateUser({ data: { full_name: fullName } });

            setStatusMsg({ type: 'success', text: 'Perfil salvo com sucesso!' });
        } catch (error) {
            console.error(error);
            setStatusMsg({ type: 'error', text: 'Erro ao salvar perfil.' });
        } finally {
            setSaving(false);
        }
    };

    const handleCreateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        setCreatingUser(true);
        setCreationMsg(null);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            const token = session?.access_token;
            if (!token) {
                throw new Error('Sessão inválida. Faça login novamente.');
            }

            const res = await fetch('/api/admin/create-user', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`,
                },
                body: JSON.stringify({
                    email: newUserEmail,
                    password: newUserPass,
                    fullName: newUserName,
                    role: newUserRole,
                    bio: newUserBio
                })
            });

            const raw = await res.text().catch(() => '');
            let data: any = null;
            if (raw) {
                try {
                    data = JSON.parse(raw);
                } catch (_) {
                    data = null;
                }
            }

            if (!res.ok) {
                const serverMsg = data?.error || data?.message || raw;
                throw new Error(serverMsg || `Erro ao criar usuário (HTTP ${res.status})`);
            }

            if (!data || typeof data !== 'object') {
                throw new Error(`Endpoint /api/admin/create-user respondeu ${res.status} sem JSON válido.`);
            }

            setCreationMsg({ type: 'success', text: 'Usuário criado com sucesso!' });
            setNewUserEmail(''); setNewUserPass(''); setNewUserName(''); setNewUserBio('');
            fetchTeam(); // Refresh list
        } catch (error: any) {
            console.error(error);
            let msg = error.message || 'Erro ao criar usuário.';
            if (msg.includes('Unexpected token') || msg.includes('<!DOCTYPE') || msg.includes('<html')) {
                msg = 'Endpoint /api não respondeu JSON. Verifique se o Nginx está fazendo proxy de /api/ para o servidor (og-server) na VPS.';
            }
            setCreationMsg({ type: 'error', text: msg });
        } finally {
            setCreatingUser(false);
        }
    };

    if (authLoading) return <div className="p-10 text-center text-gray-500">Carregando perfil...</div>;

    const roles = ['Estagiário', 'Jornalista', 'Editor', 'Administrador', 'CEO'];

    return (
        <div className="max-w-5xl mx-auto p-6">
            <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-2">
                <UserIcon className="text-primary" /> Configurações
            </h1>
            <p className="text-gray-500 mb-8">Gerencie seu perfil e equipe.</p>

            <div className="flex gap-4 border-b border-gray-200 mb-8">
                <button
                    onClick={() => setActiveTab('profile')}
                    className={`pb-4 px-2 font-bold transition-colors relative ${activeTab === 'profile' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Meu Perfil
                    {activeTab === 'profile' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                </button>
                <button
                    onClick={() => setActiveTab('team')}
                    className={`pb-4 px-2 font-bold transition-colors relative ${activeTab === 'team' ? 'text-primary' : 'text-gray-400 hover:text-gray-600'
                        }`}
                >
                    Gerenciar Equipe
                    {activeTab === 'team' && <div className="absolute bottom-0 left-0 w-full h-1 bg-primary rounded-t-full"></div>}
                </button>
            </div>

            {activeTab === 'profile' && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                    <div className="md:col-span-2 space-y-6">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2"><UserIcon size={20} className="text-gray-400" />Informações Pessoais</h2>

                            {statusMsg && (
                                <div className={`p-4 rounded-lg mb-6 ${statusMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {statusMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleSaveProfile} className="space-y-6">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Nome Completo</label>
                                        <input
                                            type="text"
                                            value={fullName}
                                            onChange={(e) => setFullName(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                            required
                                            title="Nome Completo"
                                            placeholder="Seu nome completo"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-bold text-gray-700 mb-2">Cargo / Função</label>
                                        <select
                                            value={role}
                                            onChange={(e) => setRole(e.target.value)}
                                            className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium"
                                            title="Cargo / Função"
                                        >
                                            {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                        </select>
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-bold text-gray-700 mb-2">Bio (Resumo)</label>
                                    <textarea
                                        value={bio}
                                        onChange={(e) => setBio(e.target.value)}
                                        rows={4}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all font-medium resize-none"
                                        placeholder="Conte um pouco sobre você..."
                                    />
                                </div>
                                <div className="flex justify-end pt-4">
                                    <button
                                        type="submit"
                                        disabled={saving}
                                        className="flex items-center gap-2 bg-primary text-white px-8 py-3 rounded-lg font-bold hover:bg-primary-dark transition-colors disabled:opacity-50 shadow-lg shadow-primary/30"
                                    >
                                        <Save size={20} />
                                        {saving ? 'Salvando...' : 'Salvar Perfil'}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>

                    <div className="md:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm text-center sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6">Foto de Perfil</h2>
                            <div className="relative inline-block group mb-6">
                                <div className="w-48 h-48 rounded-full overflow-hidden border-4 border-white shadow-xl mx-auto bg-gray-100 relative">
                                    {avatarUrl ? (
                                        <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                                    ) : (
                                        <div className="w-full h-full flex items-center justify-center text-gray-300 bg-gray-50">
                                            <UserIcon size={64} />
                                        </div>
                                    )}
                                    {uploading && (
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                                            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
                                        </div>
                                    )}
                                </div>
                                <label className="absolute bottom-2 right-4 bg-primary text-white p-3 rounded-full cursor-pointer hover:bg-primary-dark transition-all transform hover:scale-110 shadow-lg z-10 border-4 border-white">
                                    <Camera size={20} />
                                    <input
                                        type="file"
                                        accept="image/*"
                                        onChange={handleAvatarUpload}
                                        className="hidden"
                                        disabled={uploading}
                                        title="Alterar foto de perfil"
                                    />
                                </label>
                            </div>
                            <p className="text-sm text-gray-500 mx-auto max-w-[200px] leading-relaxed">
                                {uploading ? 'Enviando imagem...' : 'Clique na câmera para atualizar sua foto de perfil.'}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'team' && (
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Create User Form Section */}
                    <div className="lg:col-span-1">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm sticky top-24">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <UserPlus className="text-primary" size={24} />
                                Novo Usuário
                            </h2>

                            {creationMsg && (
                                <div className={`p-4 rounded-lg mb-6 text-sm ${creationMsg.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
                                    {creationMsg.text}
                                </div>
                            )}

                            <form onSubmit={handleCreateUser} className="space-y-4">
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Email</label>
                                    <input
                                        type="email"
                                        value={newUserEmail}
                                        onChange={(e) => setNewUserEmail(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                                        required
                                        placeholder="email@exemplo.com"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Senha</label>
                                    <input
                                        type="password"
                                        value={newUserPass}
                                        onChange={(e) => setNewUserPass(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                                        required
                                        placeholder="Mínimo 6 caracteres"
                                        minLength={6}
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        value={newUserName}
                                        onChange={(e) => setNewUserName(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                                        required
                                        placeholder="Ex: João Silva"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Descrição / Bio</label>
                                    <textarea
                                        value={newUserBio}
                                        onChange={(e) => setNewUserBio(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors resize-none"
                                        rows={3}
                                        placeholder="Resumo do jornalista (aparece no topo da matéria)"
                                    />
                                </div>
                                <div>
                                    <label className="block text-xs font-bold text-gray-500 uppercase mb-1">Cargo</label>
                                    <select
                                        value={newUserRole}
                                        onChange={(e) => setNewUserRole(e.target.value)}
                                        className="w-full p-3 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:border-primary transition-colors"
                                        title="Cargo do novo usuário"
                                    >
                                        {roles.map(r => <option key={r} value={r}>{r}</option>)}
                                    </select>
                                </div>
                                <button
                                    type="submit"
                                    disabled={creatingUser}
                                    className="w-full bg-primary text-white py-3 rounded-lg font-bold hover:bg-primary-dark disabled:opacity-50 transition-colors shadow-lg shadow-primary/20 mt-2"
                                >
                                    {creatingUser ? 'Criando...' : 'Criar Conta'}
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* Team List */}
                    <div className="lg:col-span-2">
                        <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
                                <Users className="text-primary" size={24} />
                                Membros ({team.length})
                            </h2>
                            {loadingTeam ? (
                                <div className="text-center py-8 text-gray-500">Carregando equipe...</div>
                            ) : (
                                <div className="space-y-4">
                                    {team.map((member) => (
                                        <div key={member.id} className="flex items-center gap-4 p-4 border border-gray-100 rounded-xl hover:border-primary/30 transition-all bg-gray-50 group">
                                            <div className="w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0 border-2 border-white shadow-sm">
                                                {member.avatar_url ? (
                                                    <img src={member.avatar_url} alt={member.full_name} className="w-full h-full object-cover" />
                                                ) : (
                                                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                        <UserIcon size={20} />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1">
                                                <h3 className="font-bold text-gray-900">{member.full_name || 'Sem nome'}</h3>
                                                <div className="flex items-center gap-2 mt-0.5">
                                                    <span className="text-[10px] font-black uppercase bg-primary/10 text-primary px-2 py-0.5 rounded tracking-wide">
                                                        {member.role || 'SEM CARGO'}
                                                    </span>
                                                    <span className="text-xs text-gray-500">{member.email}</span>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                    {team.length === 0 && (
                                        <div className="text-center py-12 bg-gray-50 rounded-lg text-gray-500 border-2 border-dashed border-gray-200">
                                            Nenhum membro encontrado.
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
