import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import PageHeader from '../../../components/PageHeader';
import { mockMessageThreads } from '../../../lib/mockData';
import { useAuthStore } from '../../../store/authStore';
import { Send, Lock, Leaf } from 'lucide-react';
import type { MessageThread } from '../../../types';

const roleColors: Record<string, string> = {
  'Government': 'bg-violet-100 text-violet-700 dark:bg-violet-950/50 dark:text-violet-400',
  'Collection Center': 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/50 dark:text-emerald-400',
  'Processing & Laboratory': 'bg-amber-100 text-amber-700 dark:bg-amber-950/50 dark:text-amber-400',
  'Manufacturer': 'bg-blue-100 text-blue-700 dark:bg-blue-950/50 dark:text-blue-400',
  'Supply Chain': 'bg-cyan-100 text-cyan-700 dark:bg-cyan-950/50 dark:text-cyan-400',
};

export default function Messages() {
  const user = useAuthStore((s) => s.user);
  const [threads] = useState<MessageThread[]>(mockMessageThreads);
  const [selected, setSelected] = useState<MessageThread>(threads[0]);
  const [newMsg, setNewMsg] = useState('');

  const sendMessage = () => {
    if (!newMsg.trim() || selected.isReadOnly || !user) return;
    // In real app, this would call API
    setNewMsg('');
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <PageHeader title="Messages" description="Batch-based communication with supply chain partners" />

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 h-[calc(100vh-220px)] min-h-[500px]">
        {/* Thread list */}
        <Card className="overflow-hidden flex flex-col">
          <CardHeader className="pb-2 shrink-0">
            <CardTitle className="text-sm">Batch Threads ({threads.length})</CardTitle>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto p-2 space-y-1.5">
            {threads.map((thread) => (
              <button
                key={thread.batchId}
                onClick={() => setSelected(thread)}
                className={`w-full text-left p-3 rounded-lg border transition-colors ${selected.batchId === thread.batchId ? 'border-emerald-400/50 bg-emerald-50 dark:bg-emerald-950/30' : 'border-border hover:bg-muted/50'}`}
              >
                <div className="flex items-center justify-between gap-2 mb-1">
                  <span className="font-mono text-xs font-bold truncate">{thread.batchId}</span>
                  {thread.isReadOnly && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                  {thread.messages.some(m => !m.isRead) && <div className="w-2 h-2 bg-emerald-500 rounded-full shrink-0" />}
                </div>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{thread.batchSpecies}</p>
                {thread.lastMessage && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">{thread.lastMessage.senderName}: {thread.lastMessage.content}</p>
                )}
              </button>
            ))}
          </CardContent>
        </Card>

        {/* Chat area */}
        <Card className="lg:col-span-2 flex flex-col overflow-hidden">
          <CardHeader className="shrink-0 border-b border-border/60 py-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-mono font-bold text-sm">{selected.batchId}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Leaf className="w-3 h-3" />{selected.batchSpecies}</p>
              </div>
              {selected.isReadOnly && (
                <Badge className="bg-gray-100 text-gray-600 border-gray-200 dark:bg-gray-800 dark:text-gray-400 flex items-center gap-1">
                  <Lock className="w-3 h-3" /> Read Only — Batch Completed
                </Badge>
              )}
            </div>
          </CardHeader>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {selected.messages.map((msg) => {
              const isMe = user?.role === msg.senderRole;
              return (
                <div key={msg.id} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                  <div className={`max-w-[75%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                    <div className="flex items-center gap-1.5">
                      {!isMe && (
                        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-950/50 flex items-center justify-center text-[10px] font-bold text-emerald-700">{msg.senderName.charAt(0)}</div>
                      )}
                      <span className="text-xs text-muted-foreground">{msg.senderName}</span>
                      <span className={`text-[10px] px-1.5 py-0.5 rounded-full ${roleColors[msg.senderRole] || 'bg-gray-100 text-gray-600'}`}>{msg.senderRole}</span>
                    </div>
                    <div className={`px-4 py-2.5 rounded-2xl text-sm ${isMe ? 'bg-emerald-600 text-white rounded-tr-sm' : 'bg-muted rounded-tl-sm'}`}>
                      {msg.content}
                    </div>
                    <span className="text-[10px] text-muted-foreground">{new Date(msg.timestamp).toLocaleString('en-IN', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: 'short' })}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Input */}
          <div className="shrink-0 border-t border-border/60 p-3">
            {selected.isReadOnly ? (
              <div className="flex items-center gap-2 justify-center text-muted-foreground text-sm py-1">
                <Lock className="w-4 h-4" /> This conversation is read-only — batch has been delivered.
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  placeholder="Type a message..."
                  value={newMsg}
                  onChange={(e) => setNewMsg(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); } }}
                  className="flex-1"
                />
                <Button onClick={sendMessage} disabled={!newMsg.trim()} className="bg-emerald-600 hover:bg-emerald-700 text-white px-3">
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
