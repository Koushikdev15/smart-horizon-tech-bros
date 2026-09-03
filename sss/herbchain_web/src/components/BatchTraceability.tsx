import { useState } from 'react';
import {
  Sprout, MapPin, Clock, CheckCircle2, XCircle, Loader2, Award, ChevronDown, User,
} from 'lucide-react';
import type { Batch } from '../types';
import { buildStages, onDay, when, type Stage, type StageStatus } from '../lib/traceStages';

/**
 * Farm-to-factory traceability for a batch.
 *
 * Built from the batch record rather than by replaying the raw timeline array.
 * That array is stored newest-first and padded with empty placeholder events
 * for stages not yet reached, so rendering it directly showed the laboratory
 * above the harvest that preceded it and printed "Invalid Date" for every
 * future stage.
 *
 * Here the chain is fixed and ordered — harvest, collection, laboratory,
 * manufacturing, distribution — and each stage pulls its own facts from the
 * batch. Long analyst narratives collapse behind a toggle so the flow stays
 * readable; the detail is still one click away.
 */

const STATUS_ICON: Record<StageStatus, React.ElementType> = {
  Completed: CheckCircle2,
  'In Progress': Loader2,
  Pending: Clock,
  Rejected: XCircle,
};

/** Horizontal rail showing where the batch has got to. */
function FlowRail({ stages }: { stages: Stage[] }) {
  return (
    <div className="flex items-start w-full overflow-x-auto pb-1">
      {stages.map((stage, i) => {
        const Icon = stage.icon;
        const done = stage.status === 'Completed';
        const live = stage.status === 'In Progress';
        const bad = stage.status === 'Rejected';
        return (
          <div key={stage.key} className="flex items-start flex-1 min-w-[86px]">
            <div className="flex flex-col items-center gap-1.5 flex-1">
              <div
                className={`w-9 h-9 rounded-full flex items-center justify-center border-2 shrink-0 transition-colors ${
                  done
                    ? 'bg-primary border-primary text-white'
                    : live
                      ? 'bg-blue-500 border-blue-500 text-white animate-pulse'
                      : bad
                        ? 'bg-red-500 border-red-500 text-white'
                        : 'bg-muted border-border text-muted-foreground'
                }`}
              >
                <Icon className="w-4 h-4" />
              </div>
              <p
                className={`text-[10px] text-center leading-tight px-0.5 ${
                  done || live ? 'font-semibold text-foreground' : 'text-muted-foreground'
                }`}
              >
                {stage.label}
              </p>
            </div>
            {i < stages.length - 1 && (
              <div
                className={`h-0.5 flex-1 mt-[18px] -mx-1 rounded ${
                  stages[i + 1].status === 'Completed' || done ? 'bg-primary/50' : 'bg-border'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

function StageCard({
  stage,
  onOpenCertificate,
}: {
  stage: Stage;
  onOpenCertificate?: () => void;
}) {
  const [open, setOpen] = useState(false);
  const Icon = stage.icon;
  const StatusIcon = STATUS_ICON[stage.status];
  const done = stage.status === 'Completed';
  const live = stage.status === 'In Progress';
  const bad = stage.status === 'Rejected';
  const pending = stage.status === 'Pending';

  const stamp = stage.key === 'harvest' ? onDay(stage.timestamp) : when(stage.timestamp);

  return (
    <div className="relative flex gap-3">
      {/* Rail node */}
      <div className="flex flex-col items-center shrink-0">
        <div
          className={`w-8 h-8 rounded-full flex items-center justify-center border-2 ${
            done
              ? 'bg-primary border-primary text-white'
              : live
                ? 'bg-blue-500 border-blue-500 text-white'
                : bad
                  ? 'bg-red-500 border-red-500 text-white'
                  : 'bg-muted border-border text-muted-foreground'
          }`}
        >
          <Icon className="w-3.5 h-3.5" />
        </div>
        <div className="w-px flex-1 bg-border mt-1" />
      </div>

      {/* Body */}
      <div className={`flex-1 pb-5 min-w-0 ${pending ? 'opacity-60' : ''}`}>
        <div className="flex flex-wrap items-center gap-2">
          <h4 className="font-semibold text-sm">{stage.label}</h4>
          <span
            className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-semibold ${
              done
                ? 'bg-primary/15 text-primary'
                : live
                  ? 'bg-blue-100 text-blue-700 dark:bg-blue-950/60 dark:text-blue-400'
                  : bad
                    ? 'bg-red-100 text-red-700 dark:bg-red-950/60 dark:text-red-400'
                    : 'bg-muted text-muted-foreground'
            }`}
          >
            <StatusIcon className={`w-2.5 h-2.5 ${live ? 'animate-spin' : ''}`} />
            {stage.status}
          </span>
        </div>

        {/* Who, when, where — the three questions a trace has to answer. */}
        <div className="mt-1 space-y-0.5">
          {(stage.actor || stage.organisation) && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <User className="w-3 h-3 shrink-0" />
              <span className="truncate">
                {stage.actor}
                {stage.actor && stage.organisation ? ' · ' : ''}
                {stage.organisation}
              </span>
            </p>
          )}
          {stamp && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <Clock className="w-3 h-3 shrink-0" />
              {stamp}
            </p>
          )}
          {stage.location && (
            <p className="text-xs text-muted-foreground flex items-center gap-1.5">
              <MapPin className="w-3 h-3 shrink-0" />
              <span className="truncate">{stage.location}</span>
            </p>
          )}
          {pending && !stamp && (
            <p className="text-xs text-muted-foreground italic">Not yet reached</p>
          )}
        </div>

        {/* Key facts as chips rather than a paragraph */}
        {stage.facts.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {stage.facts.map((f) => (
              <span
                key={f.label}
                className="text-[10px] px-2 py-1 rounded-md bg-muted/70 border border-border/50"
              >
                <span className="text-muted-foreground">{f.label}: </span>
                <span className="font-semibold">{f.value}</span>
              </span>
            ))}
          </div>
        )}

        {stage.certificate && onOpenCertificate && (
          <button
            type="button"
            onClick={onOpenCertificate}
            className="mt-2 inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline"
          >
            <Award className="w-3.5 h-3.5" />
            Quality Assurance Certificate — {stage.certificate}
          </button>
        )}

        {/* The analyst narrative, collapsed by default */}
        {stage.narrative && (
          <div className="mt-2">
            <button
              type="button"
              onClick={() => setOpen((o) => !o)}
              className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground hover:text-foreground"
            >
              <ChevronDown className={`w-3 h-3 transition-transform ${open ? 'rotate-180' : ''}`} />
              {open ? 'Hide full record' : 'Full record'}
            </button>
            {open && (
              <p className="mt-1.5 text-[11px] leading-relaxed text-muted-foreground bg-muted/40 border border-border/40 rounded-lg p-2.5">
                {stage.narrative}
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function BatchTraceability({
  batch,
  onOpenCertificate,
}: {
  batch: Batch;
  onOpenCertificate?: () => void;
}) {
  const stages = buildStages(batch);

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-border/60 bg-muted/20 px-3 py-4">
        <FlowRail stages={stages} />
      </div>

      <div>
        {stages.map((stage) => (
          <StageCard
            key={stage.key}
            stage={stage}
            onOpenCertificate={stage.certificate ? onOpenCertificate : undefined}
          />
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground flex items-center gap-1.5">
        <Sprout className="w-3 h-3" />
        Every step above is recorded on the AyurTrace+ ledger.
      </p>
    </div>
  );
}
