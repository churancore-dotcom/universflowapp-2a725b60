import { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, Upload, Music, Image, Send, Loader2, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import BottomNav from '@/components/BottomNav';
import MiniPlayer from '@/components/MiniPlayer';
import FullscreenPlayer from '@/components/FullscreenPlayer';
import PageTransition from '@/components/PageTransition';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useEffect } from 'react';

const genres = ['Pop', 'Rock', 'Hip-Hop', 'R&B', 'Electronic', 'Jazz', 'Classical', 'Country', 'Phonk', 'Funk', 'Lo-Fi', 'Metal', 'Indie', 'Latin', 'K-Pop', 'Other'];
const moods = ['Energetic', 'Chill', 'Happy', 'Sad', 'Romantic', 'Dark', 'Motivational', 'Party', 'Focus', 'Peaceful'];

interface SongRequest {
  id: string;
  title: string;
  artist: string;
  status: string;
  created_at: string;
}

const RequestSong = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [audioUrl, setAudioUrl] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [genre, setGenre] = useState('');
  const [mood, setMood] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [myRequests, setMyRequests] = useState<SongRequest[]>([]);
  const [loadingRequests, setLoadingRequests] = useState(true);

  // Load user's previous requests
  useEffect(() => {
    if (!user) return;
    (async () => {
      const { data } = await supabase
        .from('song_requests' as any)
        .select('id, title, artist, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setMyRequests((data as any[]) || []);
      setLoadingRequests(false);
    })();
  }, [user]);

  const handleSubmit = useCallback(async () => {
    if (!user) { toast.error('Please log in first'); return; }
    if (!title.trim() || !artist.trim() || !audioUrl.trim()) {
      toast.error('Title, Artist, and Audio URL are required');
      return;
    }

    setSubmitting(true);
    try {
      const { error } = await supabase.from('song_requests' as any).insert({
        user_id: user.id,
        title: title.trim(),
        artist: artist.trim(),
        audio_url: audioUrl.trim(),
        cover_url: coverUrl.trim() || null,
        genre: genre || null,
        mood: mood || null,
      } as any);

      if (error) throw error;

      toast.success('Song request submitted! Admin will review it.');
      setTitle('');
      setArtist('');
      setAudioUrl('');
      setCoverUrl('');
      setGenre('');
      setMood('');

      // Refresh requests
      const { data } = await supabase
        .from('song_requests' as any)
        .select('id, title, artist, status, created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);
      setMyRequests((data as any[]) || []);
    } catch (err: any) {
      toast.error(err.message || 'Failed to submit request');
    } finally {
      setSubmitting(false);
    }
  }, [user, title, artist, audioUrl, coverUrl, genre, mood]);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'accepted': return <CheckCircle className="w-4 h-4 text-emerald-400" />;
      case 'rejected': return <XCircle className="w-4 h-4 text-red-400" />;
      default: return <Clock className="w-4 h-4 text-yellow-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'accepted': return 'Accepted';
      case 'rejected': return 'Rejected';
      default: return 'Pending';
    }
  };

  return (
    <PageTransition>
      <div className="h-[100dvh] bg-background flex flex-col overflow-hidden">
        <header className="flex-shrink-0 z-30 px-2 pt-3 pb-2 flex items-center safe-area-pt" style={{ background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(40px)' }}>
          <button onClick={() => navigate(-1)} className="flex items-center gap-0.5 px-2 py-2 -ml-1 text-primary">
            <ChevronLeft className="w-5 h-5" />
            <span className="text-sm">Back</span>
          </button>
          <h1 className="text-sm font-semibold absolute left-1/2 -translate-x-1/2">Request a Song</h1>
        </header>

        <main className="flex-1 overflow-y-auto px-4 pt-4 pb-32 space-y-6" style={{ WebkitOverflowScrolling: 'touch' }}>
          {/* Request Form */}
          <section className="space-y-4">
            <div className="flex items-center gap-2 mb-1">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center">
                <Music className="w-4 h-4 text-white" />
              </div>
              <div>
                <h2 className="text-base font-semibold">Submit a Song</h2>
                <p className="text-xs text-muted-foreground">Admin will review and add it to the app</p>
              </div>
            </div>

            <div className="space-y-3 rounded-2xl p-4 bg-card border border-border">
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Title *</label>
                <Input value={title} onChange={e => setTitle(e.target.value)} placeholder="Song title" className="bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Artist *</label>
                <Input value={artist} onChange={e => setArtist(e.target.value)} placeholder="Artist name" className="bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Audio URL *</label>
                <Input value={audioUrl} onChange={e => setAudioUrl(e.target.value)} placeholder="Direct audio link (.mp3, .m4a)" className="bg-background" />
                <p className="text-[10px] text-muted-foreground/70 mt-1">Provide a direct link to the audio file</p>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Cover Image URL</label>
                <Input value={coverUrl} onChange={e => setCoverUrl(e.target.value)} placeholder="Cover image link (optional)" className="bg-background" />
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Genre</label>
                <div className="flex flex-wrap gap-1.5">
                  {genres.map(g => (
                    <button key={g} onClick={() => setGenre(genre === g ? '' : g)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${genre === g ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {g}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground mb-1 block">Mood</label>
                <div className="flex flex-wrap gap-1.5">
                  {moods.map(m => (
                    <button key={m} onClick={() => setMood(mood === m ? '' : m)}
                      className={`px-2.5 py-1 rounded-full text-xs transition-all ${mood === m ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <Button onClick={handleSubmit} disabled={submitting || !title || !artist || !audioUrl} className="w-full gap-2 mt-2">
                {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                {submitting ? 'Submitting...' : 'Submit Request'}
              </Button>
            </div>
          </section>

          {/* My Requests */}
          <section>
            <h3 className="text-sm font-semibold text-muted-foreground mb-3">My Requests</h3>
            {loadingRequests ? (
              <div className="flex justify-center py-8"><Loader2 className="w-5 h-5 animate-spin text-muted-foreground" /></div>
            ) : myRequests.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No requests yet</div>
            ) : (
              <div className="space-y-2">
                {myRequests.map(req => (
                  <motion.div key={req.id} className="flex items-center justify-between p-3 rounded-xl bg-card border border-border" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{req.title}</p>
                      <p className="text-xs text-muted-foreground truncate">{req.artist}</p>
                    </div>
                    <div className="flex items-center gap-1.5 ml-2">
                      {getStatusIcon(req.status)}
                      <span className={`text-xs font-medium ${req.status === 'accepted' ? 'text-emerald-400' : req.status === 'rejected' ? 'text-red-400' : 'text-yellow-400'}`}>
                        {getStatusLabel(req.status)}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>
        </main>

        <BottomNav />
        <MiniPlayer />
        <FullscreenPlayer />
      </div>
    </PageTransition>
  );
};

export default RequestSong;
