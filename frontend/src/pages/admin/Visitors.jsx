import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Globe, Eye, CalendarDays, UserRound, Search, RefreshCw, Trash2, Monitor, Smartphone, Copy, ExternalLink, List, Users, Network } from 'lucide-react';
import { fetchVisitors, fetchVisitorHistory, deleteVisitor, clearVisitors } from '../../store/slices/admin/visitorSlice';
import { notify } from '../../utils/notify';
import { confirmDialog } from '../../components/common/ConfirmDialog';
import DataTable from '../../components/admin/common/DataTable';
import Modal from '../../components/admin/common/Modal';
import ActionButton, { ActionGroup } from '../../components/admin/common/ActionButton';

const when = (d) => new Date(d).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' });

const matches = (q, fields) => !q || fields.some((v) => v?.toLowerCase().includes(q));

// Admin and website run on the same app, so the site URL is this origin
const SITE = window.location.origin;

// Page name with its full URL underneath (click opens the page in a new tab)
function PageLink({ name, path }) {
  return (
    <div className="min-w-0 max-w-xs">
      <p className="truncate font-medium text-gray-800">{name || path}</p>
      <a href={SITE + path} target="_blank" rel="noreferrer" title={SITE + path} className="flex items-center gap-1 truncate font-mono text-xs text-primary-600 hover:underline">
        <span className="truncate">{SITE + path}</span> <ExternalLink size={11} className="shrink-0" />
      </a>
    </div>
  );
}

function IpCell({ ip, name, email, onCopy, serverIp }) {
  return (
    <div>
      <button onClick={() => onCopy(ip)} title="Copy IP" className="flex items-center gap-1.5 font-mono font-medium text-gray-800 hover:text-primary-600">
        {ip} <Copy size={12} className="text-gray-400" />
      </button>
      {ip === serverIp && <span className="rounded bg-primary-50 px-1.5 text-[10px] font-medium text-primary-700">This computer</span>}
      {name && <p className="text-xs text-gray-400">{name} · {email}</p>}
    </div>
  );
}

// Short "Chrome on Windows" label from a user-agent string
function device(ua = '') {
  const browser = /Edg\//.test(ua) ? 'Edge' : /OPR\//.test(ua) ? 'Opera' : /Chrome\//.test(ua) ? 'Chrome'
    : /Firefox\//.test(ua) ? 'Firefox' : /Safari\//.test(ua) ? 'Safari' : 'Other';
  const os = /Android/.test(ua) ? 'Android' : /iPhone|iPad/.test(ua) ? 'iOS' : /Windows/.test(ua) ? 'Windows'
    : /Mac OS/.test(ua) ? 'macOS' : /Linux/.test(ua) ? 'Linux' : 'Unknown';
  return { label: `${browser} on ${os}`, mobile: /Mobi|Android|iPhone/.test(ua) };
}

function Device({ ua }) {
  if (!ua) return <span className="text-gray-400">-</span>;
  const { label, mobile } = device(ua);
  const Icon = mobile ? Smartphone : Monitor;
  return <span className="flex items-center gap-1.5 whitespace-nowrap text-gray-600" title={ua}><Icon size={14} className="text-gray-400" /> {label}</span>;
}

function Stat({ icon: Icon, label, value, tone, delay }) {
  return (
    <div className="animate-fadeInUp rounded-lg bg-white p-4 shadow-sm ring-1 ring-gray-100" style={{ animationDelay: `${delay}ms` }}>
      <div className="flex items-center gap-3">
        <span className={`flex h-10 w-10 items-center justify-center rounded-lg ${tone}`}><Icon size={20} /></span>
        <div>
          <p className="text-2xl font-semibold text-gray-800">{Number(value || 0).toLocaleString('en-IN')}</p>
          <p className="text-xs text-gray-500">{label}</p>
        </div>
      </div>
    </div>
  );
}

export default function Visitors() {
  const dispatch = useDispatch();
  const { ips: all, views, stats, serverIp, history, loading } = useSelector((state) => state.visitors);
  const [tab, setTab] = useState('views'); // 'views' = every page view, 'ips' = one row per IP
  const [query, setQuery] = useState('');
  const [viewIp, setViewIp] = useState(null);

  const load = () => dispatch(fetchVisitors()).unwrap().catch(notify.error);
  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const openView = (row) => {
    setViewIp(row);
    dispatch(fetchVisitorHistory(row.ip)).unwrap().catch(notify.error);
  };

  const copyIp = (ip) => navigator.clipboard?.writeText(ip).then(() => notify.success(`Copied ${ip}`));

  const handleDelete = async (row) => {
    const ok = await confirmDialog({
      title: 'Delete visitor history?',
      message: `All ${row.visits} page views from ${row.ip} will be permanently deleted.`,
      onConfirm: () => dispatch(deleteVisitor(row.ip)).unwrap(),
    });
    if (!ok) return;
    notify.deleted('Visitor history deleted');
    setViewIp(null);
  };

  const handleClear = async () => {
    const ok = await confirmDialog({
      title: 'Clear visitor log?',
      message: 'Every recorded page view and IP address will be permanently deleted.',
      confirmText: 'Yes, clear all',
      onConfirm: () => dispatch(clearVisitors()).unwrap(),
    });
    if (!ok) return;
    notify.deleted('Visitor log cleared');
  };

  const q = query.trim().toLowerCase();
  // Memoised: DataTable jumps back to page 1 whenever it gets a new rows array
  const ipRows = useMemo(() => all.filter((r) => matches(q, [r.ip, r.user_name, r.user_email, r.last_path, r.last_page_name])), [all, q]);
  const viewRows = useMemo(() => views.filter((r) => matches(q, [r.ip, r.user_name, r.user_email, r.path, r.page_name])), [views, q]);

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-gray-800">Visitors</h2>
          <p className="text-sm text-gray-500">IP address and page of everyone browsing the website</p>
          {serverIp && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-gray-500">
              <Network size={13} className="text-primary-600" /> This computer&apos;s network IP:
              <button onClick={() => copyIp(serverIp)} title="Copy IP" className="font-mono font-semibold text-gray-800 hover:text-primary-600">{serverIp}</button>
            </p>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          <div className="relative">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search IP, customer, page"
              className="w-60 rounded-md border border-gray-300 py-2 pl-9 pr-3 text-sm focus:border-primary-500 focus:outline-none focus:ring-1 focus:ring-primary-500"
            />
          </div>
          <button onClick={load} className="flex items-center gap-2 rounded-md border border-gray-300 bg-white px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50">
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> Refresh
          </button>
          {all.length > 0 && (
            <button onClick={handleClear} className="flex items-center gap-2 rounded-md border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-600 hover:bg-rose-100">
              <Trash2 size={16} /> Clear all
            </button>
          )}
        </div>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={Globe} label="Unique IP addresses" value={stats.unique_ips} tone="bg-primary-50 text-primary-600" delay={0} />
        <Stat icon={Eye} label="Total page views" value={stats.total_visits} tone="bg-sky-50 text-sky-600" delay={60} />
        <Stat icon={UserRound} label="Visitors today" value={stats.today_ips} tone="bg-emerald-50 text-emerald-600" delay={120} />
        <Stat icon={CalendarDays} label="Page views today" value={stats.today_visits} tone="bg-amber-50 text-amber-600" delay={180} />
      </div>

      <div className="mb-3 flex w-fit gap-1 rounded-lg bg-white p-1 shadow-sm ring-1 ring-gray-100">
        {[['views', 'All page views', List, views.length], ['ips', 'By IP address', Users, all.length]].map(([id, label, Icon, n]) => (
          <button
            key={id} onClick={() => setTab(id)}
            className={`flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-all duration-200 ${
              tab === id ? 'bg-gradient-to-r from-primary-600 to-violet-600 text-white shadow' : 'text-gray-500 hover:text-gray-800'
            }`}
          >
            <Icon size={15} /> {label}
            <span className={`rounded-full px-1.5 text-xs ${tab === id ? 'bg-white/25' : 'bg-gray-100'}`}>{n}</span>
          </button>
        ))}
      </div>

      {tab === 'views' ? (
        <DataTable
          columns={[
            { key: 'ip', label: 'IP Address', render: (r) => <IpCell ip={r.ip} name={r.user_name} email={r.user_email} onCopy={copyIp} serverIp={serverIp} /> },
            { key: 'page', label: 'Page / URL', render: (r) => <PageLink name={r.page_name} path={r.path} /> },
            { key: 'device', label: 'Device', render: (r) => <Device ua={r.user_agent} /> },
            { key: 'created_at', label: 'Time', render: (r) => <span className="whitespace-nowrap text-gray-500">{when(r.created_at)}</span> },
          ]}
          rows={viewRows}
          pageSize={15}
          emptyText={q ? 'No page views match your search' : 'No page views recorded yet'}
          renderActions={(row) => (
            <ActionGroup>
              <ActionButton type="view" onClick={() => openView(all.find((a) => a.ip === row.ip) || { ip: row.ip })} label="IP history" />
            </ActionGroup>
          )}
        />
      ) : (
        <DataTable
          columns={[
            { key: 'ip', label: 'IP Address', render: (r) => <IpCell ip={r.ip} name={r.user_name} email={r.user_email} onCopy={copyIp} serverIp={serverIp} /> },
            { key: 'visits', label: 'Views', render: (r) => <span className="font-semibold text-gray-800">{r.visits}</span> },
            { key: 'last_path', label: 'Last page / URL', render: (r) => <PageLink name={r.last_page_name} path={r.last_path} /> },
            { key: 'device', label: 'Device', render: (r) => <Device ua={r.user_agent} /> },
            { key: 'last_seen', label: 'Last seen', render: (r) => <span className="whitespace-nowrap text-gray-500">{when(r.last_seen)}</span> },
          ]}
          rows={ipRows}
          pageSize={10}
          emptyText={q ? 'No visitors match your search' : 'No visitors recorded yet'}
          renderActions={(row) => (
            <ActionGroup>
              <ActionButton type="view" onClick={() => openView(row)} label="History" />
              <ActionButton type="delete" onClick={() => handleDelete(row)} />
            </ActionGroup>
          )}
        />
      )}

      <Modal open={!!viewIp} size="max-w-3xl" title={viewIp ? `Visitor ${viewIp.ip}` : 'Visitor'} onClose={() => setViewIp(null)}>
        {viewIp && (
          <div className="space-y-4">
            <div className="grid animate-fadeInUp grid-cols-2 gap-3 text-sm sm:grid-cols-4">
              <div><p className="text-xs text-gray-400">Page views</p><p className="font-semibold text-gray-800">{viewIp.visits}</p></div>
              <div><p className="text-xs text-gray-400">Pages</p><p className="font-semibold text-gray-800">{viewIp.pages}</p></div>
              <div><p className="text-xs text-gray-400">First seen</p><p className="text-gray-700">{when(viewIp.first_seen)}</p></div>
              <div><p className="text-xs text-gray-400">Last seen</p><p className="text-gray-700">{when(viewIp.last_seen)}</p></div>
            </div>

            <div className="max-h-96 overflow-y-auto rounded-lg ring-1 ring-sky-100">
              <table className="min-w-full divide-y divide-sky-100 text-sm">
                <thead className="sticky top-0 z-10 cp-gradient-bg text-left text-xs uppercase tracking-wide text-white animate-gradient motion-reduce:animate-none">
                  <tr><th className="px-3 py-2">Time</th><th className="px-3 py-2">Page / URL</th><th className="px-3 py-2">Customer</th><th className="px-3 py-2">Device</th></tr>
                </thead>
                <tbody className="divide-y divide-sky-50">
                  {history.map((h, idx) => (
                    <tr key={h.id} className="animate-rowIn transition-colors even:bg-sky-50/40 hover:bg-sky-50" style={{ animationDelay: `${Math.min(idx, 15) * 35}ms` }}>
                      <td className="whitespace-nowrap px-3 py-2 text-gray-500">{when(h.created_at)}</td>
                      <td className="px-3 py-2"><PageLink name={h.page_name} path={h.path} /></td>
                      <td className="px-3 py-2 text-gray-600">{h.user_name || <span className="text-gray-400">Guest</span>}</td>
                      <td className="px-3 py-2"><Device ua={h.user_agent} /></td>
                    </tr>
                  ))}
                  {history.length === 0 && (
                    <tr><td colSpan={4} className="px-3 py-6 text-center text-gray-400">Loading…</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
