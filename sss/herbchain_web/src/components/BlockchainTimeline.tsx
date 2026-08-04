import type { BatchTimelineEvent } from '../types';
import { CheckCircle2, Clock, XCircle, Loader2, Leaf, FlaskConical, Award, Factory, Truck, QrCode } from 'lucide-react';

const stageIcons: Record<string, React.ElementType> = {
  'Collection': Leaf,
  'Processing': FlaskConical,
  'Laboratory': Award,
  'Manufacturing': Factory,
  'Supply Chain': Truck,
  'Consumer Verification': QrCode,
};

const statusStyles: Record<string, string> = {
  'Completed': 'bg-primary/10 dark:bg-primary/20 border-primary/30 dark:border-primary/35 text-primary dark:text-primary',
  'In Progress': 'bg-blue-100 dark:bg-blue-950/60 border-blue-300 dark:border-blue-700 text-blue-700 dark:text-blue-400',
  'Pending': 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-500 dark:text-gray-400',
  'Rejected': 'bg-red-100 dark:bg-red-950/60 border-red-300 dark:border-red-700 text-red-700 dark:text-red-400',
};

const statusIcons: Record<string, React.ElementType> = {
  'Completed': CheckCircle2,
  'In Progress': Loader2,
  'Pending': Clock,
  'Rejected': XCircle,
};

interface BlockchainTimelineProps {
  events: BatchTimelineEvent[];
  compact?: boolean;
}

export default function BlockchainTimeline({ events, compact = false }: BlockchainTimelineProps) {
  return (
    <div className="relative">
      {/* Vertical line */}
      <div className="absolute left-5 top-8 bottom-0 w-0.5 bg-gradient-to-b from-primary/50 via-primary/20 to-transparent" />

      <div className="space-y-6">
        {events.map((event, index) => {
          const StageIcon = stageIcons[event.stage] || Leaf;
          const StatusIcon = statusIcons[event.status] || Clock;
          const isCompleted = event.status === 'Completed';
          const isRejected = event.status === 'Rejected';

          return (
            <div key={index} className="relative flex gap-4 pl-0">
              {/* Icon node */}
              <div
                className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center shrink-0 border-2 transition-all
                  ${isCompleted ? 'bg-primary border-primary/50 text-white shadow-md shadow-primary/15 dark:shadow-black/20' :
                    isRejected ? 'bg-red-500 border-red-500 text-white' :
                    event.status === 'In Progress' ? 'bg-blue-500 border-blue-500 text-white animate-pulse' :
                    'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-400'
                  }`}
              >
                <StageIcon className="w-4 h-4" />
              </div>

              {/* Content */}
              <div className="flex-1 pb-2">
                <div className={`rounded-xl border p-4 transition-all ${statusStyles[event.status]}`}>
                  <div className="flex flex-wrap items-start justify-between gap-2 mb-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-sm">{event.stage}</h4>
                        <span className={`inline-flex items-center gap-1 text-xs px-2 py-0.5 rounded-full font-medium
                          ${isCompleted ? 'bg-primary/18 dark:bg-primary/20 text-primary dark:text-primary' :
                            isRejected ? 'bg-red-200 dark:bg-red-900/60 text-red-800 dark:text-red-300' :
                            event.status === 'In Progress' ? 'bg-blue-200 dark:bg-blue-900/60 text-blue-800 dark:text-blue-300' :
                            'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
                          }`}>
                          <StatusIcon className={`w-3 h-3 ${event.status === 'In Progress' ? 'animate-spin' : ''}`} />
                          {event.status}
                        </span>
                      </div>
                      {!compact && (
                        <p className="text-xs opacity-80 mt-0.5">
                          {event.organization} — {event.user}
                        </p>
                      )}
                    </div>
                    <span className="text-xs opacity-70 whitespace-nowrap">
                      {new Date(event.timestamp).toLocaleString('en-IN', {
                        day: '2-digit', month: 'short', year: 'numeric',
                        hour: '2-digit', minute: '2-digit',
                      })}
                    </span>
                  </div>

                  {event.remarks && !compact && (
                    <p className="text-xs opacity-80 mt-1">{event.remarks}</p>
                  )}

                  {event.blockchainTxId && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <span className="text-xs opacity-60">TX:</span>
                      <code className="blockchain-hash text-[10px]">{event.blockchainTxId}</code>
                    </div>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
