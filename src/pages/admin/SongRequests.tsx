import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle, XCircle, Clock, Music, ExternalLink, Loader2, Trash2, Image } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';

interface SongRequest {
  id: string;
  user_id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  status: string;
  created_at: string;
}

const SongRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('song_requests' as any).select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data, error } = await query;
    if (error) { toast.error('Failed to load requests'); console.error(error); }
    setRequests((data as any[]) || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  const handleAccept = useCallback(async (req: SongRequest) => {
    if (!user) return;
    setProcessing(req.id);
    try {
      // Insert into songs table
      const { error: songErr } = await supabase.from('songs').insert({
        title: req.title,
        artist: req.artist,
        audio_url: req.audio_url,
        cover_url: req.cover_url,
        genre: req.genre,
        mood: req.mood,
        is_visible: true,
        show_in_new_releases: true,
      });
      if (songErr) throw songErr;

      // Update request status
      const { error: updateErr } = await supabase.from('song_requests' as any)
        .update({ status: 'accepted', reviewed_by: user.id, reviewed_at: new Date().toISOString() } as any)
        .eq('id', req.id);
      if (updateErr) throw updateErr;

      toast.success(`"${req.title}" added to the app!`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept request');
    } finally {
      setProcessing(null);
    }
  }, [user, fetchRequests]);

  const handleReject = useCallback(async (req: SongRequest) => {
    if (!user) return;
    setProcessing(req.id);
    try {
      const { error } = await supabase.from('song_requests' as any)
        .update({ status: 'rejected', reviewed_by: user.id, reviewed_at: new Date().toISOString() } as any)
        .eq('id', req.id);
      if (error) throw error;
      toast.success(`"${req.title}" rejected`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  }, [user, fetchRequests]);

  const handleDelete = useCallback(async (id: string) => {
    const { error } = await supabase.from('song_requests' as any).delete().eq('id', id);
    if (error) toast.error('Failed to delete');
    else { toast.success('Request deleted'); fetchRequests(); }
  }, [fetchRequests]);

  const filtered = requests.filter(r =>
    r.title.toLowerCase().includes(search.toLowerCase()) ||
    r.artist.toLowerCase().includes(search.toLowerCase())
  );

  const stats = {
    pending: requests.filter(r => r.status === 'pending').length,
    accepted: requests.filter(r => r.status === 'accepted').length,
    rejected: requests.filter(r => r.status === 'rejected').length,
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Song Requests</h1>
        <p className="text-muted-foreground text-sm">Review and manage user song submissions</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <div className="text-2xl font-bold text-yellow-400">{stats.pending}</div>
          <div className="text-xs text-muted-foreground">Pending</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <div className="text-2xl font-bold text-emerald-400">{stats.accepted}</div>
          <div className="text-xs text-muted-foreground">Accepted</div>
        </div>
        <div className="p-4 rounded-xl bg-card border border-border text-center">
          <div className="text-2xl font-bold text-red-400">{stats.rejected}</div>
          <div className="text-xs text-muted-foreground">Rejected</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
          <button key={f} onClick={() => setFilter(f)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium transition-all ${filter === f ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search requests..." className="bg-background" />

      {/* List */}
      {loading ? (
        <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-muted-foreground" /></div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">No requests found</div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(req => (
              <motion.div key={req.id} layout initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                className="p-4 rounded-xl bg-card border border-border space-y-3">
                <div className="flex items-start gap-3">
                  {req.cover_url ? (
                    <img src={req.cover_url} alt="" className="w-14 h-14 rounded-lg object-cover flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                      <Image className="w-6 h-6 text-muted-foreground" />
                    </div>
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-sm truncate">{req.title}</h3>
                    <p className="text-xs text-muted-foreground truncate">{req.artist}</p>
                    <div className="flex gap-2 mt-1 flex-wrap">
                      {req.genre && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{req.genre}</span>}
                      {req.mood && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">{req.mood}</span>}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {req.status === 'pending' && <Clock className="w-4 h-4 text-yellow-400" />}
                    {req.status === 'accepted' && <CheckCircle className="w-4 h-4 text-emerald-400" />}
                    {req.status === 'rejected' && <XCircle className="w-4 h-4 text-red-400" />}
                  </div>
                </div>

                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <a href={req.audio_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 hover:text-primary truncate max-w-[200px]">
                    <ExternalLink className="w-3 h-3 flex-shrink-0" />
                    <span className="truncate">{req.audio_url}</span>
                  </a>
                  <span className="ml-auto flex-shrink-0">{new Date(req.created_at).toLocaleDateString()}</span>
                </div>

                {req.status === 'pending' && (
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => handleAccept(req)} disabled={processing === req.id} className="flex-1 gap-1 bg-emerald-600 hover:bg-emerald-700">
                      {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <CheckCircle className="w-3 h-3" />}
                      Accept & Add
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => handleReject(req)} disabled={processing === req.id} className="flex-1 gap-1">
                      {processing === req.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <XCircle className="w-3 h-3" />}
                      Reject
                    </Button>
                  </div>
                )}

                {req.status !== 'pending' && (
                  <div className="flex justify-end">
                    <Button size="sm" variant="ghost" onClick={() => handleDelete(req.id)} className="gap-1 text-muted-foreground">
                      <Trash2 className="w-3 h-3" /> Delete
                    </Button>
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SongRequests;
