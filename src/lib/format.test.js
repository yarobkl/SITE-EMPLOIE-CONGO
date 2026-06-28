import { describe, expect, it } from 'vitest';
import {
  classNames,
  getInitials,
  normalizeApplication,
  normalizeJob,
  normalizeNotification,
} from './format';

describe('classNames', () => {
  it('joins truthy values and drops falsy ones', () => {
    expect(classNames('a', false, 'b', null, undefined, 'c')).toBe('a b c');
  });

  it('returns an empty string when nothing is truthy', () => {
    expect(classNames(false, null, undefined)).toBe('');
  });
});

describe('getInitials', () => {
  it('builds initials from first and last name', () => {
    expect(getInitials({ prenom: 'Grace', nom: 'Moungala' })).toBe('GM');
  });

  it('falls back to the email when names are missing', () => {
    expect(getInitials({ email: 'recruteur@example.com' })).toBe('R');
  });

  it('falls back to U when nothing is available', () => {
    expect(getInitials({})).toBe('U');
  });
});

describe('normalizeJob', () => {
  it('maps database columns to the app shape', () => {
    const row = {
      id: 'job-1',
      company_id: 'company-1',
      title: 'Developpeur',
      location: 'Brazzaville',
      contract_type: 'CDI',
      salary_range: 'Attractif',
      sector: 'Tech',
      description: 'Mission',
      requirements: ['Node.js'],
      status: 'published',
      companies: { name: 'Airtel' },
    };
    expect(normalizeJob(row)).toMatchObject({
      id: 'job-1',
      companyId: 'company-1',
      company: 'Airtel',
      role: 'Developpeur',
      loc: 'Brazzaville',
      type: 'CDI',
      salary: 'Attractif',
      sector: 'Tech',
      requirements: ['Node.js'],
      status: 'published',
    });
  });

  it('applies sensible defaults when fields are missing', () => {
    const job = normalizeJob({ id: 1, title: 'Stage', location: 'Oyo', contract_type: 'Stage' });
    expect(job.company).toBe('Entreprise');
    expect(job.sector).toBe('General');
    expect(job.requirements).toHaveLength(3);
    expect(job.status).toBe('published');
  });
});

describe('normalizeApplication', () => {
  it('maps an application row including nested job and company', () => {
    const row = {
      id: 'app-1',
      job_id: 'job-1',
      candidate_id: 'cand-1',
      nom: 'Grace',
      email: 'grace@example.com',
      phone: '+242',
      cv_url: 'public/cv.pdf',
      tracking_enabled: true,
      application_opened: false,
      cv_opened: true,
      status: 'reviewed',
      jobs: { title: 'Auditeur', companies: { name: 'BGFI' } },
    };
    const app = normalizeApplication(row);
    expect(app).toMatchObject({
      id: 'app-1',
      jobId: 'job-1',
      jobRole: 'Auditeur',
      company: 'BGFI',
      cvPath: 'public/cv.pdf',
      trackingEnabled: true,
      cvOpened: true,
      message: '',
    });
  });
});

describe('normalizeNotification', () => {
  it('maps a notification row', () => {
    const row = { id: 1, title: 'Bienvenue', body: 'Pret', read: false, created_at: '2026-01-01' };
    expect(normalizeNotification(row)).toEqual({
      id: 1,
      title: 'Bienvenue',
      body: 'Pret',
      read: false,
      createdAt: '2026-01-01',
    });
  });
});
