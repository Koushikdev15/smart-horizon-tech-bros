import { create } from 'zustand';
import { mockBatches } from '../lib/mockData';
import type { Batch, TimelineEvent } from '../types';

interface BatchStore {
  batches: Batch[];
  addBatch: (batch: Batch) => void;
  updateBatchStatus: (id: string, status: Batch['status'], newEvent: TimelineEvent) => void;
  rejectBatch: (id: string, stage: string, reason: string) => void;
}

export const useBatchStore = create<BatchStore>((set) => ({
  batches: mockBatches,
  
  addBatch: (batch) => set((state) => ({ 
    batches: [batch, ...state.batches] 
  })),
  
  updateBatchStatus: (id, status, newEvent) => set((state) => ({
    batches: state.batches.map(b => 
      b.id === id 
        ? { ...b, status, currentStage: newEvent.stage, timeline: [newEvent, ...b.timeline] }
        : b
    )
  })),

  rejectBatch: (id, stage, reason) => set((state) => ({
    batches: state.batches.map(b => 
      b.id === id 
        ? { 
            ...b, 
            status: 'Rejected', 
            currentStage: stage,
            timeline: [
              {
                id: `evt-${Date.now()}`,
                date: new Date().toISOString().split('T')[0],
                time: new Date().toTimeString().split(' ')[0],
                stage: stage,
                action: 'Batch Rejected',
                actor: 'System User',
                details: `Rejected: ${reason}`
              },
              ...b.timeline
            ] 
          }
        : b
    )
  }))
}));
