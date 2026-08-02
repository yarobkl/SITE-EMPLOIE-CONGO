import { useCallback, useEffect, useRef } from 'react';
import { hasSupabaseConfig, supabase } from './lib/supabase';
import { getViewerKey } from './viewerIdentity';

function routeJobId() {
  return window.location.pathname.match(/^\/offres\/([0-9a-f-]{36})(?:-[^/]+)?(?:\/postuler)?$/i)?.[1] || '';
}

function statText(row) {
  const views = Number(row?.view_count || 0);
  return `${views.toLocaleString('fr-FR')} consultation${views > 1 ? 's' : ''}`;
}

export default function JobViewCounterExperience() {
  const recordedRef = useRef(new Set());
  const syncingRef = useRef(false);
  const timerRef = useRef(0);

  const injectStats = useCallback((statsById) => {
    document.querySelectorAll('.job-card[data-job-id]').forEach((card) => {
      const id = card.dataset.jobId;
      const row = statsById.get(id);
      if (!row) return;
      const host = card.querySelector('button span.min-w-0.flex-1') || card.querySelector('button') || card;
      let line = host.querySelector('[data-nzela-job-view-count]');
      if (!line) {
        line = document.createElement('span');
        line.dataset.nzelaJobViewCount = 'true';
        line.className = 'nz-immo-job-stats';
        host.appendChild(line);
      }
      const next = `◉ ${statText(row)}`;
      if (line.textContent !== next) line.textContent = next;
    });

    const id = routeJobId();
    if (!id) return;
    const row = statsById.get(id);
    const header = document.querySelector('main article header');
    if (!row || !header) return;
    let line = header.querySelector('[data-nzela-job-view-count]');
    if (!line) {
      line = document.createElement('p');
      line.dataset.nzelaJobViewCount = 'true';
      line.className = 'nz-immo-job-stats';
      header.appendChild(line);
    }
    const next = `◉ ${statText(row)}`;
    if (line.textContent !== next) line.textContent = next;
  }, []);

  const sync = useCallback(async () => {
    if (syncingRef.current || !hasSupabaseConfig || !supabase) return;
    syncingRef.current = true;
    try {
      const ids = new Set();
      document.querySelectorAll('.job-card[data-job-id]').forEach((card) => {
        if (card.dataset.jobId) ids.add(card.dataset.jobId);
      });
      const detailId = routeJobId();
      if (detailId) ids.add(detailId);
      if (!ids.size) return;

      if (detailId && !recordedRef.current.has(detailId)) {
        recordedRef.current.add(detailId);
        const { error } = await supabase.rpc('record_job_view', {
          p_job_id: detailId,
          p_session_key: getViewerKey(),
        });
        if (error) recordedRef.current.delete(detailId);
      }

      const { data, error } = await supabase.rpc('get_job_public_stats', { p_job_ids: [...ids] });
      if (error) return;
      injectStats(new Map((data || []).map((row) => [row.job_id, row])));
    } finally {
      syncingRef.current = false;
    }
  }, [injectStats]);

  useEffect(() => {
    const schedule = () => {
      window.clearTimeout(timerRef.current);
      timerRef.current = window.setTimeout(sync, 120);
    };
    const root = document.getElementById('root');
    const observer = new MutationObserver(schedule);
    if (root) observer.observe(root, { childList: true, subtree: true });
    window.addEventListener('popstate', schedule);
    schedule();
    const interval = window.setInterval(schedule, 5000);
    return () => {
      observer.disconnect();
      window.removeEventListener('popstate', schedule);
      window.clearInterval(interval);
      window.clearTimeout(timerRef.current);
    };
  }, [sync]);

  return null;
}
