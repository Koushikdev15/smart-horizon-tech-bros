import { useMemo } from 'react';
import { useBatchStore, useBatchesLive } from '../../store/useBatchStore';
import { useProductStore, useProductsLive } from '../../store/useProductStore';

/**
 * The real audit trail.
 *
 * Every batch and product carries a timeline of the events that actually
 * happened to it — who did what, where, and when. Flattened and sorted, that
 * *is* the ledger; the page previously showed a fixed list of five invented
 * rows instead.
 */

export interface AuditEvent {
  id: string;
  /** Batch number or product code the event belongs to. */
  entity: string;
  entityKind: 'Batch' | 'Product';
  stage: string;
  action: string;
  organization: string;
  user: string;
  status: 'Completed' | 'In Progress' | 'Pending' | 'Rejected';
  remarks?: string;
  timestamp: string;
  txHash?: string;
}

export function useAuditTrail() {
  useBatchesLive();
  useProductsLive();

  const batches = useBatchStore((s) => s.batches);
  const products = useProductStore((s) => s.products);
  const loading = useBatchStore((s) => s.loading);

  return useMemo(() => {
    const events: AuditEvent[] = [];

    batches.forEach((b) => {
      (b.timeline ?? []).forEach((e, i) => {
        // Placeholder rows for stages not yet reached are not events.
        if (!e.timestamp || e.status === 'Pending') return;
        events.push({
          id: `b-${b.id}-${i}`,
          entity: b.batchNumber,
          entityKind: 'Batch',
          stage: e.stage,
          action: `${e.stage} — ${e.status}`,
          organization: e.organization || '—',
          user: e.user || '—',
          status: e.status,
          remarks: e.remarks,
          timestamp: e.timestamp,
          txHash: e.blockchainTxId ?? b.blockchainHash,
        });
      });
    });

    products.forEach((p) => {
      (p.timeline ?? []).forEach((e, i) => {
        if (!e.timestamp) return;
        events.push({
          id: `p-${p.id}-${i}`,
          entity: p.productCode,
          entityKind: 'Product',
          stage: e.stage,
          action: `${e.stage} — ${e.status}`,
          organization: e.organization || p.manufacturerName || '—',
          user: e.user || '—',
          status: e.status,
          remarks: e.remarks ?? p.productName,
          timestamp: e.timestamp,
          txHash: e.blockchainTxId ?? p.blockchainHash,
        });
      });
    });

    events.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    const organizations = [...new Set(events.map((e) => e.organization))].filter((o) => o !== '—').sort();
    const stages = [...new Set(events.map((e) => e.stage))].sort();

    return {
      loading,
      events,
      organizations,
      stages,
      counts: {
        total: events.length,
        batches: events.filter((e) => e.entityKind === 'Batch').length,
        products: events.filter((e) => e.entityKind === 'Product').length,
        rejected: events.filter((e) => e.status === 'Rejected').length,
        entities: new Set(events.map((e) => e.entity)).size,
      },
    };
  }, [batches, products, loading]);
}
