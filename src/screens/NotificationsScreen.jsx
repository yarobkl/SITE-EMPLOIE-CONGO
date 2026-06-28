import { PageHeader } from '../components/ui';
import { classNames } from '../lib/format';

export default function NotificationsScreen({ notifications, setNotifications }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Notifications" subtitle={`${notifications.length} message(s)`} />
      <button onClick={() => setNotifications((items) => items.map((item) => ({ ...item, read: true })))} className="min-h-11 rounded-lg border border-slate-300 px-4 text-sm font-black text-slate-700">
        Tout marquer comme lu
      </button>
      <div className="grid gap-3">
        {notifications.map((item) => (
          <div key={item.id} className={classNames('rounded-lg border p-4', item.read ? 'border-slate-200 bg-white' : 'border-blue-200 bg-blue-50')}>
            <h3 className="font-black">{item.title}</h3>
            <p className="mt-1 text-sm font-semibold text-slate-600">{item.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
