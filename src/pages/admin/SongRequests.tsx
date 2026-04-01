import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';
import { CheckCircle, XCircle, Clock, Music, Play, Pause, Loader2, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface SongRequest {
  id: string;
  title: string;
  artist: string;
  audio_url: string;
  cover_url: string | null;
  genre: string | null;
  mood: string | null;
  status: string;
  created_at: string;
  user_id: string;
  reviewed_at: string | null;
  reviewed_by: string | null;
}

const SongRequests = () => {
  const { user } = useAuth();
  const [requests, setRequests] = useState<SongRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'pending' | 'accepted' | 'rejected'>('pending');
  const [search, setSearch] = useState('');
  const [processing, setProcessing] = useState<string | null>(null);
  const [playingId, setPlayingId] = useState<string | null>(null);
  const [audioEl] = useState(() => new Audio());

  const fetchRequests = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('song_requests').select('*').order('created_at', { ascending: false });
    if (filter !== 'all') query = query.eq('status', filter);
    const { data } = await query;
    setRequests(data || []);
    setLoading(false);
  }, [filter]);

  useEffect(() => { fetchRequests(); }, [fetchRequests]);

  useEffect(() => {
    return () => { audioEl.pause(); audioEl.src = ''; };
  }, [audioEl]);

  const togglePreview = (req: SongRequest) => {
    if (playingId === req.id) {
      audioEl.pause();
      setPlayingId(null);
    } else {
      audioEl.src = req.audio_url;
      audioEl.play();
      setPlayingId(req.id);
    }
  };

  const handleAccept = async (req: SongRequest) => {
    setProcessing(req.id);
    try {
      // Insert song into songs table
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
      const { error } = await supabase.from('song_requests').update({
        status: 'accepted',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id);
      if (error) throw error;

      toast.success(`"${req.title}" has been added to the library!`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to accept request');
    } finally {
      setProcessing(null);
    }
  };

  const handleReject = async (req: SongRequest) => {
    setProcessing(req.id);
    try {
      const { error } = await supabase.from('song_requests').update({
        status: 'rejected',
        reviewed_by: user?.id,
        reviewed_at: new Date().toISOString(),
      }).eq('id', req.id);
      if (error) throw error;

      toast.success(`"${req.title}" has been rejected`);
      fetchRequests();
    } catch (err: any) {
      toast.error(err.message || 'Failed to reject request');
    } finally {
      setProcessing(null);
    }
  };

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
        <Card className="bg-yellow-500/10 border-yellow-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-yellow-400">{stats.pending}</p>
            <p className="text-xs text-yellow-400/70">Pending</p>
          </CardContent>
        </Card>
        <Card className="bg-green-500/10 border-green-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-green-400">{stats.accepted}</p>
            <p className="text-xs text-green-400/70">Accepted</p>
          </CardContent>
        </Card>
        <Card className="bg-red-500/10 border-red-500/20">
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-red-400">{stats.rejected}</p>
            <p className="text-xs text-red-400/70">Rejected</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'accepted', 'rejected'] as const).map(f => (
          <Button
            key={f}
            variant={filter === f ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter(f)}
            className="capitalize"
          >
            {f}
          </Button>
        ))}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder="Search requests..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
      </div>

      {/* Requests List */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="w-6 h-6 animate-spin text-primary" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-12 text-muted-foreground">
          <Music className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>No requests found</p>
        </div>
      ) : (
        <div className="space-y-3">
          <AnimatePresence>
            {filtered.map(req => (
              <motion.div
                key={req.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
              >
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      {/* Cover / Preview */}
                      <button
                        className="relative w-14 h-14 rounded-lg overflow-hidden flex-shrink-0 bg-muted"
                        onClick={() => togglePreview(req)}
                      >
                        {req.cover_url ? (
                          <img src={req.cover_url} alt="" className="w-full h-full object-cover" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <Music className="w-5 h-5 text-muted-foreground" />
                          </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                          {playingId === req.id ? (
                            <Pause className="w-5 h-5 text-white" fill="white" />
                          ) : (
                            <Play className="w-5 h-5 text-white ml-0.5" fill="white" />
                          )}
                        </div>
                      </button>

                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-sm truncate">{req.title}</p>
                        <p className="text-xs text-muted-foreground truncate">{req.artist}</p>
                        <div className="flex gap-1.5 mt-1 flex-wrap">
                          {req.genre && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-primary/10 text-primary">{req.genre}</span>}
                          {req.mood && <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-accent/10 text-accent-foreground">{req.mood}</span>}
                        </div>
                        <p className="text-[10px] text-muted-foreground/60 mt-1">
                          {new Date(req.created_at).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Actions */}
                      {req.status === 'pending' ? (
                        <div className="flex gap-1.5 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-green-500/30 hover:bg-green-500/20"
                            onClick={() => handleAccept(req)}
                            disabled={processing === req.id}
                          >
                            {processing === req.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4 text-green-400" />}
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-8 w-8 p-0 border-red-500/30 hover:bg-red-500/20"
                            onClick={() => handleReject(req)}
                            disabled={processing === req.id}
                          >
                            <XCircle className="w-4 h-4 text-red-400" />
                          </Button>
                        </div>
                      ) : (
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${
                          req.status === 'accepted' ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                        }`}>
                          {req.status}
                        </span>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

export default SongRequests;
