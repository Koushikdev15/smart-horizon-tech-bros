import { useEffect, useMemo, useState } from 'react';
import { supabase } from '../../lib/supabase';
import { useBatchStore, useBatchesLive } from '../../store/useBatchStore';
import { useProductStore, useProductsLive } from '../../store/useProductStore';
import type { Batch, Product, UserRole } from '../../types';

/**
 * Everything the Government dashboard shows, derived from the live ledger.
 *
 * The dashboard previously displayed invented figures — 1,240 shipments, 45
 * nodes, 8,450 kg, a fixed list of ledger hashes. None of it moved when the
 * data did. This computes the same shape of information from the batches,
 * products and members that actually exist.
 */

export interface LedgerEntry {
  id: string;
  label: string;
  detail: string;
  hash?: string;
  timestamp: string;
  kind: 'batch' | 'product';
}

const num = (v: unknown) => (Number.isFinite(Number(v)) ? Number(v) : 0);

/** Roles that hold a supply-chain position, i.e. a node on the network. */
const NODE_ROLES: UserRole[] = [
  'Collection Center', 'Processing & Laboratory', 'Manufacturer', 'Supply Chain',
];

export function useNetworkStats() {
  useBatchesLive();
  useProductsLive();

  const batches = useBatchStore((s) => s.batches);
  const products = useProductStore((s) => s.products);
  const loadingBatches = useBatchStore((s) => s.loading);

  const [members, setMembers] = useState<{ role: UserRole; status: string }[]>([]);
  const [membersLoaded, setMembersLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const { data, error } = await supabase.from('members').select('role, status');
      if (cancelled) return;
      if (error) console.error('Failed to load members:', error);
      else setMembers((data as { role: UserRole; status: string }[]) ?? []);
      setMembersLoaded(true);
    })();
    return () => { cancelled = true; };
  }, []);

  return useMemo(() => {
    // ── Headline figures ────────────────────────────────────────────────────
    const totalKg = batches.reduce((s, b) => s + num(b.quantity), 0);
    const tested = batches.filter((b) => b.labReport);
    const verifiedKg = tested
      .filter((b) => b.labReport?.overallResult !== 'Fail')
      .reduce((s, b) => s + num(b.quantity), 0);

    const inTransit = products.filter(
      (p) => p.distribution && p.distribution.deliveryStatus !== 'Delivered',
    ).length;
    const delivered = products.filter(
      (p) => p.distribution?.deliveryStatus === 'Delivered',
    ).length;

    const activeMembers = members.filter((m) => m.status === 'Active').length;
    const activeNodes = members.filter(
      (m) => m.status === 'Active' && NODE_ROLES.includes(m.role),
    ).length;

    // Anything a regulator would actually want to look at.
    const rejected = batches.filter((b) => b.status === 'Rejected');
    const quarantined = batches.filter(
      (b) => b.labCheckIn?.decision === 'Quarantined' ||
             b.manufacturerCheckIn?.decision === 'Quarantined',
    );
    const failedTests = batches.filter((b) => b.labReport?.overallResult === 'Fail');
    const expiredProducts = products.filter((p) => {
      if (!p.expiryDate) return false;
      const d = new Date(p.expiryDate);
      return !Number.isNaN(d.getTime()) && d < new Date();
    });
    const recalled = products.filter((p) => p.status === 'Recalled');
    const flagged =
      rejected.length + quarantined.length + failedTests.length +
      expiredProducts.length + recalled.length;

    // ── Supply-chain funnel ─────────────────────────────────────────────────
    const stageOf = (b: Batch) => {
      if (b.status === 'Rejected') return 'Rejected';
      if (b.usedInProducts?.length) return 'Manufactured';
      if (b.manufacturerCheckIn) return 'At Manufacturer';
      if (b.labReport) return 'Lab Certified';
      if (b.labCheckIn) return 'At Laboratory';
      return 'Collected';
    };
    const FUNNEL = ['Collected', 'At Laboratory', 'Lab Certified', 'At Manufacturer', 'Manufactured', 'Rejected'];
    const funnelCounts = new Map<string, number>(FUNNEL.map((k) => [k, 0]));
    batches.forEach((b) => {
      const k = stageOf(b);
      funnelCounts.set(k, (funnelCounts.get(k) ?? 0) + 1);
    });
    const funnel = FUNNEL.map((stage) => ({ stage, count: funnelCounts.get(stage) ?? 0 }))
      .filter((d) => d.count > 0);

    // ── Volume by species ───────────────────────────────────────────────────
    const bySpecies = new Map<string, number>();
    batches.forEach((b) => {
      bySpecies.set(b.species, (bySpecies.get(b.species) ?? 0) + num(b.quantity));
    });
    const species = [...bySpecies.entries()]
      .map(([name, kg]) => ({ name, kg }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 8);

    // ── Collection volume by harvest month ──────────────────────────────────
    const byMonth = new Map<string, { kg: number; batches: number }>();
    batches.forEach((b) => {
      const d = new Date(b.harvestDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const cur = byMonth.get(key) ?? { kg: 0, batches: 0 };
      byMonth.set(key, { kg: cur.kg + num(b.quantity), batches: cur.batches + 1 });
    });
    const timeline = [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, v]) => ({
        month: new Date(`${key}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        kg: Math.round(v.kg),
        batches: v.batches,
      }));

    // ── Members by role ─────────────────────────────────────────────────────
    const byRole = new Map<string, number>();
    members.forEach((m) => byRole.set(m.role, (byRole.get(m.role) ?? 0) + 1));
    const roles = [...byRole.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ── Quality outcomes ────────────────────────────────────────────────────
    const quality = [
      { name: 'Passed', value: tested.filter((b) => b.labReport?.overallResult === 'Pass').length },
      { name: 'Conditional', value: tested.filter((b) => b.labReport?.overallResult === 'Conditional Pass').length },
      { name: 'Failed', value: failedTests.length },
      { name: 'Awaiting test', value: batches.length - tested.length },
    ].filter((d) => d.value > 0);

    // ── Regional distribution ───────────────────────────────────────────────
    // Regions are stored as free-text addresses; the district is the useful
    // grain, so take the trailing components rather than the whole string.
    const districtOf = (region: string) => {
      const parts = (region ?? '').split(',').map((x) => x.trim()).filter(Boolean);
      const district = parts.find((x) => /district/i.test(x));
      if (district) return district.replace(/\s*district\s*/i, '').trim();
      return parts.length > 1 ? parts[parts.length - 2] : (parts[0] ?? 'Unknown');
    };
    const byRegion = new Map<string, { kg: number; batches: number }>();
    batches.forEach((b) => {
      const key = districtOf(b.region) || 'Unknown';
      const cur = byRegion.get(key) ?? { kg: 0, batches: 0 };
      byRegion.set(key, { kg: cur.kg + num(b.quantity), batches: cur.batches + 1 });
    });
    const regions = [...byRegion.entries()]
      .map(([name, v]) => ({ name, kg: Math.round(v.kg), batches: v.batches }))
      .sort((a, b) => b.kg - a.kg)
      .slice(0, 8);

    // ── Where the material comes from ───────────────────────────────────────
    const farmerKg = batches
      .filter((b) => b.collectorType !== 'Wild Collector')
      .reduce((s, b) => s + num(b.quantity), 0);
    const wildKg = batches
      .filter((b) => b.collectorType === 'Wild Collector')
      .reduce((s, b) => s + num(b.quantity), 0);
    const sourcing = [
      { name: 'Cultivated', value: Math.round(farmerKg) },
      { name: 'Wild-collected', value: Math.round(wildKg) },
    ].filter((d) => d.value > 0);

    // ── Products released per month ─────────────────────────────────────────
    const prodByMonth = new Map<string, number>();
    products.forEach((p) => {
      const d = new Date(p.manufacturingDate);
      if (Number.isNaN(d.getTime())) return;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      prodByMonth.set(key, (prodByMonth.get(key) ?? 0) + 1);
    });
    const productTrend = [...prodByMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, count]) => ({
        month: new Date(`${key}-01`).toLocaleDateString('en-IN', { month: 'short', year: '2-digit' }),
        products: count,
      }));

    // ── Product categories ──────────────────────────────────────────────────
    const byCategory = new Map<string, number>();
    products.forEach((p) => byCategory.set(p.category, (byCategory.get(p.category) ?? 0) + 1));
    const categories = [...byCategory.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);

    // ── Laboratory throughput ───────────────────────────────────────────────
    const byLab = new Map<string, number>();
    batches.forEach((b) => {
      const lab = b.labReport?.labName;
      if (lab) byLab.set(lab, (byLab.get(lab) ?? 0) + 1);
    });
    const labs = [...byLab.entries()]
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value)
      .slice(0, 8);

    // ── Average moisture, a headline pharmacopoeial measure ─────────────────
    const moistures = batches
      .map((b) => Number(b.labReport?.moisture))
      .filter((v) => Number.isFinite(v));
    const avgMoisture = moistures.length
      ? moistures.reduce((s, v) => s + v, 0) / moistures.length
      : null;

    // ── Ledger: real timeline events, newest first ──────────────────────────
    const entries: LedgerEntry[] = [];
    batches.forEach((b) => {
      (b.timeline ?? []).forEach((e, i) => {
        if (!e.timestamp || e.status === 'Pending') return;
        entries.push({
          id: `${b.id}-${i}`,
          label: `${b.batchNumber} — ${e.stage}`,
          detail: [e.organization, e.status].filter(Boolean).join(' · '),
          hash: b.blockchainHash,
          timestamp: e.timestamp,
          kind: 'batch',
        });
      });
    });
    products.forEach((p) => {
      (p.timeline ?? []).forEach((e, i) => {
        if (!e.timestamp) return;
        entries.push({
          id: `${p.id}-${i}`,
          label: `${p.productCode} — ${e.stage}`,
          detail: [p.productName, e.organization].filter(Boolean).join(' · '),
          hash: p.blockchainHash,
          timestamp: e.timestamp,
          kind: 'product',
        });
      });
    });
    const ledger = entries
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
      .slice(0, 6);

    // ── Inventory: the most recent real batches ─────────────────────────────
    const inventory = [...batches]
      .sort((a, b) => new Date(b.harvestDate).getTime() - new Date(a.harvestDate).getTime())
      .slice(0, 6);

    return {
      loading: loadingBatches || !membersLoaded,
      counts: {
        batches: batches.length,
        totalKg: Math.round(totalKg),
        verifiedKg: Math.round(verifiedKg),
        products: products.length,
        inTransit,
        delivered,
        activeMembers,
        activeNodes,
        totalMembers: members.length,
        flagged,
        speciesCount: bySpecies.size,
        tested: tested.length,
      },
      funnel,
      species,
      timeline,
      roles,
      quality,
      regions,
      sourcing,
      productTrend,
      categories,
      labs,
      avgMoisture,
      ledger,
      inventory: inventory as Batch[],
      /** Every batch, for the reporting screens that export the full set. */
      inventoryAll: batches as Batch[],
      products: products as Product[],
    };
  }, [batches, products, members, membersLoaded, loadingBatches]);
}
