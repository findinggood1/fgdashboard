import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Mic, Square, Loader2, X, Save } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface VoiceMemoRecorderProps {
  clientEmail: string;
  onSaved: () => void;
}

const CONTEXT_OPTIONS = [
  { value: 'pre-session', label: 'Pre-Session' },
  { value: 'post-session', label: 'Post-Session' },
  { value: 'observation', label: 'Observation' },
  { value: 'other', label: 'Other' },
];

export function VoiceMemoRecorder({ clientEmail, onSaved }: VoiceMemoRecorderProps) {
  const { coachData } = useAuth();
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const [recordedBlob, setRecordedBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  
  // Form state
  const [title, setTitle] = useState('');
  const [context, setContext] = useState('observation');
  const [tags, setTags] = useState('');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    return () => {
      // Cleanup on unmount
      if (timerRef.current) clearInterval(timerRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
      if (audioUrl) URL.revokeObjectURL(audioUrl);
    };
  }, [audioUrl]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
      mediaRecorderRef.current = mediaRecorder;
      chunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
        setRecordedBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setDuration(0);

      // Start duration timer
      timerRef.current = setInterval(() => {
        setDuration(d => d + 1);
      }, 1000);
    } catch (err) {
      console.error('Error starting recording:', err);
      toast.error('Could not access microphone. Please check permissions.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const discardRecording = () => {
    if (audioUrl) URL.revokeObjectURL(audioUrl);
    setRecordedBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setTitle('');
    setContext('observation');
    setTags('');
  };

  const handleSave = async () => {
    if (!recordedBlob || !coachData?.id) {
      toast.error('No recording to save');
      return;
    }

    setSaving(true);
    try {
      const timestamp = Date.now();
      const storagePath = `voice-memos/${coachData.id}/${timestamp}.webm`;

      // Upload to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('client-files')
        .upload(storagePath, recordedBlob, {
          contentType: 'audio/webm',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: urlData } = supabase.storage
        .from('client-files')
        .getPublicUrl(storagePath);

      // Parse tags
      const parsedTags = tags
        .split(',')
        .map(t => t.trim())
        .filter(t => t.length > 0);

      // Insert into voice_memos table
      const { error: insertError } = await supabase
        .from('voice_memos')
        .insert({
          client_email: clientEmail,
          coach_id: coachData.id,
          audio_storage_path: storagePath,
          audio_url: urlData.publicUrl,
          duration_seconds: duration,
          title: title.trim() || null,
          context: context,
          tags: parsedTags.length > 0 ? parsedTags : null,
          recorded_at: new Date().toISOString(),
          is_transcribed: false,
        });

      if (insertError) throw insertError;

      toast.success('Voice memo saved');
      discardRecording();
      onSaved();
    } catch (err) {
      console.error('Error saving voice memo:', err);
      toast.error('Failed to save voice memo');
    } finally {
      setSaving(false);
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Show recording form after recording
  if (recordedBlob && audioUrl) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="p-4 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">New Recording</span>
            <Badge variant="secondary">{formatDuration(duration)}</Badge>
          </div>

          {/* Audio preview */}
          <audio controls src={audioUrl} className="w-full h-10" />

          {/* Form */}
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label htmlFor="memo-title" className="text-xs">Title (optional)</Label>
              <Input
                id="memo-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g., Pre-session thoughts"
                className="h-9"
              />
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Context</Label>
              <Select value={context} onValueChange={setContext}>
                <SelectTrigger className="h-9">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CONTEXT_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>
                      {opt.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="memo-tags" className="text-xs">Tags (comma separated)</Label>
              <Input
                id="memo-tags"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                placeholder="e.g., breakthrough, follow-up"
                className="h-9"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={discardRecording}
              disabled={saving}
              className="flex-1"
            >
              <X className="h-4 w-4 mr-1" />
              Discard
            </Button>
            <Button
              size="sm"
              onClick={handleSave}
              disabled={saving}
              className="flex-1"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
              ) : (
                <Save className="h-4 w-4 mr-1" />
              )}
              Save Memo
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Recording button
  return (
    <div className="flex flex-col items-center gap-3">
      {isRecording ? (
        <>
          <Button
            variant="destructive"
            size="lg"
            onClick={stopRecording}
            className="gap-2"
          >
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
            </span>
            Stop Recording
          </Button>
          <span className="text-lg font-mono tabular-nums">{formatDuration(duration)}</span>
        </>
      ) : (
        <Button
          variant="outline"
          size="lg"
          onClick={startRecording}
          className="gap-2"
        >
          <Mic className="h-5 w-5" />
          Record Memo
        </Button>
      )}
    </div>
  );
}
