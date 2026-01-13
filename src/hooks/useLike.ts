import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export const useLike = (songId: string) => {
  const { user } = useAuth();
  const [isLiked, setIsLiked] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (user && songId) {
      checkIfLiked();
    }
  }, [user, songId]);

  const checkIfLiked = async () => {
    if (!user) return;

    const { data } = await supabase
      .from('user_library')
      .select('id')
      .eq('user_id', user.id)
      .eq('song_id', songId)
      .maybeSingle();

    setIsLiked(!!data);
  };

  const toggleLike = useCallback(async () => {
    if (!user) {
      toast.error('Please sign in to like songs');
      return;
    }

    if (isLoading) return;

    setIsLoading(true);

    try {
      if (isLiked) {
        // Unlike
        const { error } = await supabase
          .from('user_library')
          .delete()
          .eq('user_id', user.id)
          .eq('song_id', songId);

        if (error) throw error;
        setIsLiked(false);
        toast.success('Removed from library');
      } else {
        // Like
        const { error } = await supabase
          .from('user_library')
          .insert({
            user_id: user.id,
            song_id: songId,
          });

        if (error) throw error;
        setIsLiked(true);
        toast.success('Added to library ❤️');
      }
    } catch (error) {
      console.error('Error toggling like:', error);
      toast.error('Failed to update library');
    } finally {
      setIsLoading(false);
    }
  }, [user, songId, isLiked, isLoading]);

  return { isLiked, isLoading, toggleLike };
};

export const useRecentlyPlayed = () => {
  const { user } = useAuth();

  const trackPlay = useCallback(async (songId: string) => {
    if (!user) return;

    try {
      await supabase
        .from('recently_played')
        .insert({
          user_id: user.id,
          song_id: songId,
        });
    } catch (error) {
      console.error('Error tracking play:', error);
    }
  }, [user]);

  return { trackPlay };
};
