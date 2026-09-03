import { useEffect } from 'react';
import { useParams, Navigate } from 'react-router-dom';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import EnterpriseDashboard from '../government/pages/EnterpriseDashboard';
import GovernmentMemberRegistration from '../government/pages/MemberRegistration';
import GovernmentPendingApprovals from '../government/pages/PendingApprovals';
import GovernmentActiveMembers from '../government/pages/ActiveMembers';
import GovernmentComplaints from '../government/pages/Complaints';
import GovernmentProductTracking from '../government/pages/ProductTracking';
import GovernmentAnalytics from '../government/pages/Analytics';
import GovernmentPayments from '../government/pages/GovPayments';
import GovernmentAuditLogs from '../government/pages/AuditLogs';
import GovernmentReports from '../government/pages/Reports';
import GovernmentSystemSettings from '../government/pages/SystemSettings';
import CollectionDashboard from '../collection/CollectionDashboard';
import CollectionFarmers from '../collection/pages/Farmers';
import CollectionWildCollectors from '../collection/pages/WildCollectors';
import CollectionCreateBatch from '../collection/pages/CreateBatch';
import CollectionBatchHistory from '../collection/pages/BatchHistory';
import CollectionMessages from '../collection/pages/Messages';
import CollectionPayments from '../collection/pages/CollectionPayments';
import ProcessingDashboard from '../processing/ProcessingDashboard';
import ProcessingRequests from '../processing/pages/ProcessingRequests';
import ProcessingRejectedBatches from '../processing/pages/RejectedBatches';
import ProcessingHistory from '../processing/pages/History';
import ProcessingPayments from '../processing/pages/Payments';
import ManufacturerDashboard from '../manufacturer/ManufacturerDashboard';
import ManufacturerRequests from '../manufacturer/pages/ManufacturerRequests';
import ManufacturerCreateProduct from '../manufacturer/pages/CreateProduct';
import ManufacturerAvailableProducts from '../manufacturer/pages/AvailableProducts';
import ManufacturerRejectedBatches from '../manufacturer/pages/RejectedBatches';
import ManufacturerHistory from '../manufacturer/pages/History';
import ManufacturerPayments from '../manufacturer/pages/Payments';
import SupplyChainDashboard from '../supply-chain/SupplyChainDashboard';
import SupplyRequests from '../supply-chain/pages/SupplyRequests';
import SupplyRejectedBatches from '../supply-chain/pages/RejectedBatches';
import SupplyHistory from '../supply-chain/pages/History';
import SupplyPayments from '../supply-chain/pages/Payments';
import ProfilePage from './ProfilePage';
import BatchTimelineView from '../government/pages/BatchTimeline';

const GOV_PAGES: Record<string, React.ComponentType> = {
  'dashboard':    EnterpriseDashboard,
  'registration': GovernmentMemberRegistration,
  'approvals':    GovernmentPendingApprovals,
  'members':      GovernmentActiveMembers,
  'complaints':   GovernmentComplaints,
  'tracking':     GovernmentProductTracking,
  'timeline':     BatchTimelineView,
  'analytics':    GovernmentAnalytics,
  'reports':      GovernmentReports,
  'payments':     GovernmentPayments,
  'audit':        GovernmentAuditLogs,
  'settings':     GovernmentSystemSettings,
  'profile':      ProfilePage,
};

const CC_PAGES: Record<string, React.ComponentType> = {
  'dashboard':    CollectionDashboard,
  'farmers':      CollectionFarmers,
  'collectors':   CollectionWildCollectors,
  'create-batch': CollectionCreateBatch,
  'batch-history':CollectionBatchHistory,
  'messages':     CollectionMessages,
  'payments':     CollectionPayments,
  'profile':      ProfilePage,
};

const PL_PAGES: Record<string, React.ComponentType> = {
  'dashboard': ProcessingDashboard,
  'requests':  ProcessingRequests,
  'rejected':  ProcessingRejectedBatches,
  'history':   ProcessingHistory,
  'messages':  CollectionMessages,
  'payments':  ProcessingPayments,
  'profile':   ProfilePage,
};

const MF_PAGES: Record<string, React.ComponentType> = {
  'dashboard': ManufacturerDashboard,
  'requests':  ManufacturerRequests,
  'create-product': ManufacturerCreateProduct,
  'products':  ManufacturerAvailableProducts,
  'rejected':  ManufacturerRejectedBatches,
  'history':   ManufacturerHistory,
  'messages':  CollectionMessages,
  'payments':  ManufacturerPayments,
  'profile':   ProfilePage,
};

const SC_PAGES: Record<string, React.ComponentType> = {
  'dashboard': SupplyChainDashboard,
  'requests':  SupplyRequests,
  'rejected':  SupplyRejectedBatches,
  'history':   SupplyHistory,
  'messages':  CollectionMessages,
  'payments':  SupplyPayments,
  'profile':   ProfilePage,
};

function RouterFallback({ label }: { label: string }) {
  return (
    <div className="flex h-full min-h-[60vh] w-full flex-col items-center justify-center gap-3 bg-background">
      <div className="glass flex flex-col items-center gap-2 rounded-xl border border-border/60 px-8 py-6 shadow-sm">
        <span className="text-sm font-medium tracking-tight text-foreground">{label}</span>
        <span className="kbd-chip text-muted-foreground">no matching route</span>
      </div>
    </div>
  );
}

export default function DashboardRouter() {
  const user = useAuthStore((s) => s.user);
  const setActiveNavItem = useAppStore((s) => s.setActiveNavItem);
  const { pageId } = useParams<{ pageId?: string }>();
  const activeNavItem = pageId || 'dashboard';

  // Keep the pinned/recent-nav bookkeeping in sync with whatever the URL currently shows,
  // regardless of whether the user got here via a sidebar click, the command palette, or a
  // direct/bookmarked link.
  useEffect(() => {
    setActiveNavItem(activeNavItem);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeNavItem]);

  if (!user) return <RouterFallback label="Awaiting authentication" />;

  let pageMap: Record<string, React.ComponentType> = {};
  if (user.role === 'Government')             pageMap = GOV_PAGES;
  else if (user.role === 'Collection Center') pageMap = CC_PAGES;
  else if (user.role === 'Processing & Laboratory') pageMap = PL_PAGES;
  else if (user.role === 'Manufacturer')      pageMap = MF_PAGES;
  else if (user.role === 'Supply Chain')      pageMap = SC_PAGES;

  const PageComponent = pageMap[activeNavItem];

  // Role Guard: the requested pageId isn't part of this role's allowed page-map at all
  // (either a typo'd/forbidden URL, or a page that belongs to a different role's namespace)
  // — never fall back to the dashboard silently, send them to the Unauthorized page instead.
  if (!PageComponent) return <Navigate to="/unauthorized" replace />;

  return (
    <div key={`${user.role}-${activeNavItem}`} className="animate-in fade-in duration-200 h-full w-full bg-transparent">
      <PageComponent />
    </div>
  );
}
