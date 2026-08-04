type BatchStatus = 'Collection' | 'Processing' | 'Manufacturing' | 'Supply Chain' | 'Completed' | 'Rejected' | 'Pending' | 'Verified' | 'Active' | 'Suspended' | 'Disabled' | 'Inactive' | 'Open' | 'Under Review' | 'Resolved' | 'Closed' | 'Released' | 'On Hold' | 'Failed';

interface BatchStatusBadgeProps {
  status: BatchStatus | string;
  className?: string;
}

const statusConfig: Record<string, { bg: string; text: string; dot: string }> = {
  'Collection':    { bg: 'bg-cyan-100   dark:bg-cyan-950/50',    text: 'text-cyan-700   dark:text-cyan-400',    dot: 'bg-cyan-500'    },
  'Processing':    { bg: 'bg-amber-100  dark:bg-amber-950/50',   text: 'text-amber-700  dark:text-amber-400',   dot: 'bg-amber-500'   },
  'Manufacturing': { bg: 'bg-violet-100 dark:bg-violet-950/50',  text: 'text-violet-700 dark:text-violet-400',  dot: 'bg-violet-500'  },
  'Supply Chain':  { bg: 'bg-blue-100   dark:bg-blue-950/50',    text: 'text-blue-700   dark:text-blue-400',    dot: 'bg-blue-500'    },
  'Completed':     { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Rejected':      { bg: 'bg-red-100    dark:bg-red-950/50',     text: 'text-red-700    dark:text-red-400',     dot: 'bg-red-500'     },
  'Pending':       { bg: 'bg-gray-100   dark:bg-gray-800',       text: 'text-gray-600   dark:text-gray-400',    dot: 'bg-gray-400'    },
  'Verified':      { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Active':        { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Suspended':     { bg: 'bg-orange-100 dark:bg-orange-950/50',  text: 'text-orange-700 dark:text-orange-400',  dot: 'bg-orange-500'  },
  'Disabled':      { bg: 'bg-gray-100   dark:bg-gray-800',       text: 'text-gray-500   dark:text-gray-400',    dot: 'bg-gray-400'    },
  'Inactive':      { bg: 'bg-gray-100   dark:bg-gray-800',       text: 'text-gray-500   dark:text-gray-400',    dot: 'bg-gray-400'    },
  'Open':          { bg: 'bg-red-100    dark:bg-red-950/50',     text: 'text-red-700    dark:text-red-400',     dot: 'bg-red-500'     },
  'Under Review':  { bg: 'bg-amber-100  dark:bg-amber-950/50',   text: 'text-amber-700  dark:text-amber-400',   dot: 'bg-amber-500'   },
  'Resolved':      { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Closed':        { bg: 'bg-gray-100   dark:bg-gray-800',       text: 'text-gray-500   dark:text-gray-400',    dot: 'bg-gray-400'    },
  'Released':      { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'On Hold':       { bg: 'bg-amber-100  dark:bg-amber-950/50',   text: 'text-amber-700  dark:text-amber-400',   dot: 'bg-amber-500'   },
  'Failed':        { bg: 'bg-red-100    dark:bg-red-950/50',     text: 'text-red-700    dark:text-red-400',     dot: 'bg-red-500'     },
  'Ready':         { bg: 'bg-emerald-100 dark:bg-emerald-950/50', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  'Generating':    { bg: 'bg-amber-100  dark:bg-amber-950/50',   text: 'text-amber-700  dark:text-amber-400',   dot: 'bg-amber-500'   },
  'High':          { bg: 'bg-red-100    dark:bg-red-950/50',     text: 'text-red-700    dark:text-red-400',     dot: 'bg-red-500'     },
  'Medium':        { bg: 'bg-amber-100  dark:bg-amber-950/50',   text: 'text-amber-700  dark:text-amber-400',   dot: 'bg-amber-500'   },
  'Low':           { bg: 'bg-gray-100   dark:bg-gray-800',       text: 'text-gray-500   dark:text-gray-400',    dot: 'bg-gray-400'    },
};

export default function BatchStatusBadge({ status, className = '' }: BatchStatusBadgeProps) {
  const config = statusConfig[status] ?? statusConfig['Pending'];
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border border-current/20 ${config.bg} ${config.text} ${className}`}>
      <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${config.dot}`} />
      {status}
    </span>
  );
}
