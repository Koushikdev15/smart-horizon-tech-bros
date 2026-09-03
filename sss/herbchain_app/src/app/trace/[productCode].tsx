import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Colors, Fonts, Type, Spacing, BorderRadius, Shadow } from '@/theme';
import Icon, { type IconName } from '@/components/Icon';
import {
  tracedProductService,
  type ProductTrace,
  type TraceStage,
  type TraceLane,
} from '@/services/tracedProductService';

/**
 * Farm-to-shelf traceability, rendered natively.
 *
 * The same chain the web portal's verification page shows, built from the same
 * Supabase records — but in the app, so a customer never leaves it for a
 * browser. A product trace is a confluence, not a line: each batch lived its
 * own life (harvest → collection → laboratory) before they were combined, so
 * each gets a lane, and the lanes visibly merge into the shared trunk below.
 */
export default function ProductTraceScreen() {
  const { productCode } = useLocalSearchParams<{ productCode: string }>();
  const router = useRouter();

  const [trace, setTrace] = useState<ProductTrace | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await tracedProductService.getTrace(String(productCode));
        if (cancelled) return;
        if (!result) setError('No product is registered under this code.');
        else setTrace(result);
      } catch {
        if (!cancelled) setError('Could not load the traceability record.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [productCode]);

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <View style={styles.headerRow}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Icon name="arrow-back" size={20} color={Colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Traceability</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerBox}>
          <ActivityIndicator color={Colors.primary} />
          <Text style={styles.mutedText}>Verifying product…</Text>
        </View>
      ) : error || !trace ? (
        <View style={styles.centerBox}>
          <Icon name="alert-circle-outline" size={40} color={Colors.error} />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
          {/* Verdict */}
          <View style={[styles.verdictCard, Shadow.sm]}>
            <Icon name="shield-checkmark" size={26} color={Colors.success} />
            <View style={{ flex: 1 }}>
              <Text style={styles.verdictTitle}>Genuine verified product</Text>
              <Text style={styles.verdictText}>
                This code matches a product registered on the AyurTrace+ ledger.
              </Text>
            </View>
          </View>

          {/* Identity */}
          <View style={[styles.card, Shadow.sm]}>
            <Text style={styles.productName}>{trace.product.productName}</Text>
            <Text style={styles.productSub}>
              {trace.product.category}
              {trace.product.formulation ? ` · ${trace.product.formulation}` : ''}
            </Text>
            <Text style={styles.productCode}>{trace.product.productCode}</Text>

            <View style={styles.factGrid}>
              {trace.product.mrp != null && <Fact label="MRP" value={`₹${trace.product.mrp}`} />}
              <Fact label="Manufacturer" value={trace.product.manufacturerName} />
              {trace.product.packagingType && (
                <Fact
                  label="Pack"
                  value={`${trace.product.packagingType}${trace.product.packSize ? ` · ${trace.product.packSize}` : ''}`}
                />
              )}
              {trace.product.expiryDate && (
                <Fact label="Expires" value={fmt(trace.product.expiryDate)} />
              )}
            </View>
          </View>

          {/* Usage */}
          {(trace.product.dosage || trace.product.indications || trace.product.contraindications) && (
            <View style={[styles.card, Shadow.sm]}>
              <Text style={styles.sectionTitle}>Usage</Text>
              {trace.product.dosage && <Line label="Dosage" value={trace.product.dosage} />}
              {trace.product.indications && <Line label="Indications" value={trace.product.indications} />}
              {trace.product.contraindications && (
                <Line label="Contraindications" value={trace.product.contraindications} />
              )}
              {trace.product.storageConditions && (
                <Line label="Storage" value={trace.product.storageConditions} />
              )}
            </View>
          )}

          {/* Tributary lanes */}
          <Text style={styles.groupHeading}>Where this came from</Text>
          <Text style={styles.groupHint}>
            {trace.lanes.length === 1
              ? 'Made from a single traced batch.'
              : `Made from ${trace.lanes.length} traced batches, combined during manufacture.`}
          </Text>

          {trace.lanes.map((lane) => (
            <LaneCard key={lane.batchNumber} lane={lane} />
          ))}

          {/* Merge */}
          <View style={styles.mergeWrap}>
            <View style={styles.mergeLine} />
            <View style={styles.mergePill}>
              <Icon name="git-merge-outline" size={13} color={Colors.onPrimary} />
              <Text style={styles.mergePillText}>
                {trace.lanes.length > 1 ? `${trace.lanes.length} batches combined` : 'Single batch'}
              </Text>
            </View>
            <View style={styles.mergeLine} />
          </View>

          {/* Shared trunk */}
          <View style={[styles.card, Shadow.sm]}>
            {trace.trunk.map((stage, i) => (
              <StageRow key={stage.key} stage={stage} last={i === trace.trunk.length - 1} />
            ))}
          </View>

          {/* Provenance statement */}
          {trace.product.summary && (
            <View style={styles.summaryCard}>
              <Text style={styles.summaryTitle}>Provenance Statement</Text>
              <Text style={styles.summaryText}>{trace.product.summary}</Text>
            </View>
          )}

          <Text style={styles.footer}>Verified against the AyurTrace+ ledger</Text>
          <Text style={styles.footerSub}>Ministry of AYUSH, Government of India</Text>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

/* ── Pieces ───────────────────────────────────────────────────────────────── */

function fmt(d?: string) {
  if (!d) return '—';
  const date = new Date(d);
  return Number.isNaN(date.getTime())
    ? '—'
    : date.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.factItem}>
      <Text style={styles.factLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.factValue}>{value}</Text>
    </View>
  );
}

function Line({ label, value }: { label: string; value: string }) {
  return (
    <View style={{ marginTop: Spacing.sm }}>
      <Text style={styles.factLabel}>{label.toUpperCase()}</Text>
      <Text style={styles.lineValue}>{value}</Text>
    </View>
  );
}

function LaneCard({ lane }: { lane: TraceLane }) {
  return (
    <View style={[styles.card, Shadow.sm, { paddingTop: 0, overflow: 'hidden' }]}>
      <View style={styles.laneHeader}>
        <View style={styles.laneIcon}>
          <Icon name="leaf-outline" size={16} color={Colors.primary} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.laneSpecies}>{lane.species}</Text>
          {lane.botanicalName ? (
            <Text style={styles.laneBotanical}>{lane.botanicalName}</Text>
          ) : null}
          <Text style={styles.laneMeta}>
            {lane.quantityUsed} used · {lane.batchNumber}
          </Text>
        </View>
      </View>
      <View style={{ paddingTop: Spacing.sm }}>
        {lane.stages.map((s, i) => (
          <StageRow key={s.key} stage={s} last={i === lane.stages.length - 1} />
        ))}
      </View>
    </View>
  );
}

function StageRow({ stage, last }: { stage: TraceStage; last: boolean }) {
  const done = stage.state === 'done';
  const active = stage.state === 'active';
  return (
    <View style={styles.stageRow}>
      <View style={styles.stageRail}>
        <View
          style={[
            styles.stageDot,
            done && styles.stageDotDone,
            active && styles.stageDotActive,
          ]}
        >
          <Icon
            name={stage.icon as IconName}
            size={12}
            color={done || active ? Colors.onPrimary : Colors.textMuted}
          />
        </View>
        {!last && <View style={styles.stageConnector} />}
      </View>

      <View style={[styles.stageBody, stage.state === 'pending' && { opacity: 0.55 }]}>
        <Text style={styles.stageLabel}>{stage.label}</Text>
        {(stage.actor || stage.organisation) && (
          <Text style={styles.stageMeta} numberOfLines={2}>
            {[stage.actor, stage.organisation].filter(Boolean).join(' · ')}
          </Text>
        )}
        {stage.date && (
          <View style={styles.stageMetaRow}>
            <Icon name="time-outline" size={10} color={Colors.textMuted} />
            <Text style={styles.stageMetaSm}>{stage.date}</Text>
          </View>
        )}
        {stage.location && (
          <View style={styles.stageMetaRow}>
            <Icon name="location-outline" size={10} color={Colors.textMuted} />
            <Text style={styles.stageMetaSm} numberOfLines={1}>{stage.location}</Text>
          </View>
        )}
        {stage.state === 'pending' && !stage.date && (
          <Text style={styles.stagePending}>Not yet reached</Text>
        )}

        {stage.facts.length > 0 && (
          <View style={styles.chipRow}>
            {stage.facts.map((f) => (
              <View key={f.label} style={styles.chip}>
                <Text style={styles.chipText}>
                  <Text style={styles.chipLabel}>{f.label}: </Text>
                  {f.value}
                </Text>
              </View>
            ))}
          </View>
        )}

        {stage.certificate && (
          <View style={styles.certRow}>
            <Icon name="ribbon-outline" size={12} color={Colors.gold} />
            <Text style={styles.certText}>Certificate {stage.certificate}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.gutter,
    paddingVertical: Spacing.md,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { ...Type.headlineSm, color: Colors.primary },
  centerBox: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, padding: Spacing.lg },
  mutedText: { ...Type.bodySm, color: Colors.textMuted },
  errorText: { ...Type.bodyMd, color: Colors.error, textAlign: 'center' },
  scroll: { paddingHorizontal: Spacing.gutter, paddingBottom: Spacing['3xl'] },

  verdictCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.success,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  verdictTitle: { ...Type.labelMd, fontSize: 14, color: Colors.onSurface },
  verdictText: { ...Type.bodySm, fontSize: 11, color: Colors.textSecondary, marginTop: 2 },

  card: {
    backgroundColor: Colors.surfaceContainerLowest,
    borderRadius: BorderRadius['2xl'],
    borderWidth: 1,
    borderColor: Colors.outlineVariant,
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  productName: { ...Type.headlineSm, color: Colors.onSurface },
  productSub: { ...Type.bodySm, color: Colors.textSecondary, marginTop: 2 },
  productCode: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted, marginTop: 2 },
  factGrid: { flexDirection: 'row', flexWrap: 'wrap', marginTop: Spacing.md },
  factItem: { width: '50%', marginBottom: Spacing.sm, paddingRight: Spacing.sm },
  factLabel: { fontFamily: Fonts.family.semiBold, fontSize: 9, color: Colors.textMuted, letterSpacing: 0.6 },
  factValue: { ...Type.labelMd, fontSize: 13, color: Colors.onSurface, marginTop: 1 },
  lineValue: { ...Type.bodySm, color: Colors.onSurfaceVariant, marginTop: 1 },
  sectionTitle: { ...Type.labelMd, fontSize: 12, color: Colors.primary },

  groupHeading: { ...Type.labelMd, fontSize: 13, color: Colors.primary, marginTop: Spacing.xs },
  groupHint: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted, marginBottom: Spacing.sm },

  laneHeader: {
    flexDirection: 'row',
    gap: Spacing.sm,
    alignItems: 'center',
    backgroundColor: Colors.secondaryContainer,
    marginHorizontal: -Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  laneIcon: {
    width: 30,
    height: 30,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceContainerLowest,
    alignItems: 'center',
    justifyContent: 'center',
  },
  laneSpecies: { ...Type.labelMd, fontSize: 14, color: Colors.onSurface },
  laneBotanical: { ...Type.bodySm, fontSize: 10, fontStyle: 'italic', color: Colors.textMuted },
  laneMeta: { ...Type.bodySm, fontSize: 10, color: Colors.textSecondary, marginTop: 1 },

  stageRow: { flexDirection: 'row', gap: Spacing.sm },
  stageRail: { alignItems: 'center', width: 24 },
  stageDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surfaceContainerHigh,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stageDotDone: { backgroundColor: Colors.primary },
  stageDotActive: { backgroundColor: Colors.gold },
  stageConnector: { width: 1, flex: 1, backgroundColor: Colors.outlineVariant, marginVertical: 2 },
  stageBody: { flex: 1, paddingBottom: Spacing.md },
  stageLabel: { ...Type.labelMd, fontSize: 12, color: Colors.onSurface },
  stageMeta: { ...Type.bodySm, fontSize: 11, color: Colors.textSecondary, marginTop: 1 },
  stageMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 3, marginTop: 1 },
  stageMetaSm: { ...Type.bodySm, fontSize: 10, color: Colors.textMuted, flexShrink: 1 },
  stagePending: { ...Type.bodySm, fontSize: 10, fontStyle: 'italic', color: Colors.textMuted, marginTop: 1 },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 4, marginTop: Spacing.xs },
  chip: {
    backgroundColor: Colors.surfaceContainerHigh,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  chipText: { fontFamily: Fonts.family.semiBold, fontSize: 9.5, color: Colors.onSurface },
  chipLabel: { fontFamily: Fonts.family.regular, color: Colors.textMuted },

  certRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: Spacing.xs },
  certText: { fontFamily: Fonts.family.semiBold, fontSize: 10, color: Colors.gold },

  mergeWrap: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: Spacing.md },
  mergeLine: { flex: 1, height: 1, backgroundColor: Colors.outlineVariant },
  mergePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.sm + 2,
    paddingVertical: 5,
    borderRadius: BorderRadius.full,
  },
  mergePillText: { fontFamily: Fonts.family.bold, fontSize: 10, color: Colors.onPrimary },

  summaryCard: {
    backgroundColor: Colors.secondaryContainer,
    borderRadius: BorderRadius['2xl'],
    padding: Spacing.md,
    marginBottom: Spacing.md,
  },
  summaryTitle: { fontFamily: Fonts.family.bold, fontSize: 10, color: Colors.onSecondaryContainer, letterSpacing: 0.6 },
  summaryText: { ...Type.bodySm, fontSize: 11, color: Colors.onSecondaryContainer, marginTop: Spacing.xs, lineHeight: 17 },

  footer: { ...Type.bodySm, fontSize: 11, color: Colors.textMuted, textAlign: 'center', marginTop: Spacing.sm },
  footerSub: { ...Type.bodySm, fontSize: 10, color: Colors.textMuted, textAlign: 'center', marginTop: 2 },
});
