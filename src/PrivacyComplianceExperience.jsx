import { useEffect, useMemo, useState } from 'react';
import { hasSupabaseConfig, supabase } from './lib/supabase';

const LEGAL_VERSION = '2026-08-02-v1';
const PENDING_SIGNUP_KEY = 'nzelajobs.pendingLegalConsent';
const PENDING_APPLICATION_KEY = 'nzelajobs.pendingApplicationConsent';
const RECORDED_APPLICATION_KEY = 'nzelajobs.recordedApplicationConsent';

const styles = {
  bar: {
    position: 'fixed', right: 12, bottom: 12, zIndex: 80, display: 'flex', gap: 8,
    alignItems: 'center', padding: '8px 10px', border: '1px solid #dbe4f0',
    borderRadius: 999, background: 'rgba(255,255,255,.96)',
    boxShadow: '0 12px 32px rgba(15,23,42,.16)', fontSize: 12,
  },
  button: { border: 0, background: 'transparent', color: '#1d4ed8', fontWeight: 700, cursor: 'pointer', padding: '4px 6px' },
  overlay: { position: 'fixed', inset: 0, zIndex: 120, background: 'rgba(15,23,42,.62)', display: 'grid', placeItems: 'center', padding: 16 },
  modal: { width: 'min(980px, 100%)', maxHeight: '92vh', overflow: 'auto', borderRadius: 24, background: '#fff', boxShadow: '0 28px 80px rgba(15,23,42,.35)' },
  header: { position: 'sticky', top: 0, zIndex: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 22px', borderBottom: '1px solid #e2e8f0', background: '#fff' },
  content: { padding: '24px 22px 32px', color: '#334155', lineHeight: 1.7 },
  tabs: { display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 22 },
  tab: { border: '1px solid #cbd5e1', borderRadius: 999, padding: '8px 12px', background: '#fff', cursor: 'pointer', fontWeight: 700, color: '#334155' },
};

const LEGAL_PAGES = {
  privacy: {
    title: 'Politique de confidentialité',
    intro: 'Version applicable au 2 août 2026 — document de mise en conformité initiale.',
    sections: [
      ['Responsable du traitement', 'Rodrin Bakala Mouengue, fondateur et porteur du projet Nzela Jobs, détermine les finalités et les moyens des traitements réalisés par la plateforme pendant sa phase de structuration juridique. Les demandes relatives aux données sont déposées au moyen du formulaire « Vos droits » intégré au site.'],
      ['Données traitées', 'Comptes utilisateurs, nom, prénom, adresse e-mail, téléphone, ville, intitulé professionnel, CV, informations de candidature, favoris, messages, notifications, données de connexion et données techniques nécessaires à la sécurité du service. Nzela Jobs ne demande pas, dans ses formulaires standards, l’origine ethnique, la religion, les opinions politiques, la santé, la vie sexuelle ou le casier judiciaire.'],
      ['Annonces immobilières', 'Nzela Jobs traite les informations des logements publiés, leurs photos, leur ville, leur quartier, leur prix, leurs équipements, leur durée de disponibilité, les coordonnées rendues publiques par l’auteur, les favoris, les signalements et les demandes de contact ou de visite. Un identifiant aléatoire pseudonyme sert à compter une vue unique sans révéler au propriétaire l’identité des visiteurs. Les photos des annonces publiées sont accessibles publiquement ; les autres coordonnées et les messages restent soumis aux contrôles d’accès.'],
      ['Finalités et bases', 'Créer et sécuriser les comptes, publier et consulter les offres, transmettre les candidatures aux recruteurs concernés, assurer le suivi des candidatures, permettre la messagerie, prévenir les abus et répondre aux demandes des utilisateurs. Les traitements reposent selon les cas sur l’exécution du service demandé, les mesures précontractuelles, les obligations légales et le consentement lorsqu’il est requis, notamment pour la prospection.'],
      ['Destinataires', 'L’utilisateur concerné, les recruteurs propriétaires des offres auxquelles il postule, les administrateurs strictement habilités et les prestataires techniques agissant pour Nzela Jobs. Un CV n’est pas rendu public : il est conservé dans un espace privé et communiqué au recruteur concerné par un lien temporaire.'],
      ['Hébergement et transferts', 'La base de données et les fichiers sont actuellement opérés avec Supabase dans la région eu-west-3 (Paris). L’application est hébergée par Vercel. Ces services et certains de leurs sous-traitants peuvent conduire à des traitements hors de l’espace CEMAC/CEEAC ; ces flux doivent être documentés et présentés à l’autorité congolaise compétente.'],
      ['Durées', 'Les CV sont associés à une échéance de conservation de douze mois à compter de la candidature. Les comptes sont conservés pendant leur utilisation puis supprimés ou anonymisés à la suite d’une demande recevable ou d’une procédure d’inactivité. Les demandes d’exercice de droits sont suivies pendant le temps nécessaire à leur traitement et à la preuve de la réponse.'],
      ['Sécurité', 'Contrôle d’accès par rôle, politiques de sécurité au niveau des lignes de base de données, espace de stockage privé des CV, liens temporaires, limitation des types et de la taille des fichiers, journalisation fonctionnelle des consultations et séparation des accès candidats, recruteurs et administrateurs.'],
      ['Droits', 'Toute personne peut demander l’accès, la rectification, la portabilité, l’opposition, le retrait d’un consentement ou la suppression de ses données, sous réserve des obligations de conservation applicables. Une demande est enregistrée avec une échéance de traitement de trente jours.'],
      ['Texte applicable', 'La plateforme organise sa conformité au regard de la loi congolaise n° 29-2019 du 10 octobre 2019 portant protection des données à caractère personnel et des textes instituant l’autorité de contrôle.'],
    ],
  },
  terms: {
    title: 'Conditions générales d’utilisation',
    intro: 'Nzela Jobs est actuellement proposé en version bêta.',
    sections: [
      ['Objet', 'Nzela Jobs facilite la diffusion d’offres, la recherche d’opportunités, la transmission et le suivi des candidatures ainsi que les échanges entre candidats et recruteurs. La plateforme ne délivre aucun visa, contrat officiel, autorisation de travail ou décision administrative à la place de l’ACPE ou d’une autre autorité.'],
      ['Comptes', 'L’utilisateur fournit des informations exactes, protège ses identifiants et utilise un seul rôle cohérent avec son activité. Les comptes frauduleux, usurpés ou utilisés pour contourner les contrôles peuvent être suspendus.'],
      ['Offres et recrutements', 'Le recruteur demeure responsable de la légalité, de l’exactitude et de la non-discrimination de ses offres. Nzela Jobs peut modérer, suspendre ou retirer une offre présentant un risque, une incohérence ou un contenu illicite. La plateforme ne garantit ni recrutement ni embauche.'],
      ['Candidatures', 'Le candidat choisit les offres auxquelles il postule et autorise la transmission des informations et du CV au recruteur concerné. Il ne doit pas téléverser de documents contenant des données excessives ou sensibles sans nécessité.'],
      ['Règles immobilières', 'Tout particulier ou professionnel peut publier une annonce s’il dispose du droit de proposer le bien et d’utiliser les photos. L’auteur reste responsable de l’exactitude du prix, de la disponibilité et des conditions. Nzela Jobs fournit un service de publication et de mise en relation : la plateforme n’est pas l’agence du propriétaire, ne garantit pas le bien et n’encaisse aucun loyer, caution ou acompte dans cette version. Les annonces frauduleuses, dupliquées, discriminatoires ou exigeant un paiement trompeur peuvent être suspendues.'],
      ['Interdictions', 'Sont interdits : usurpation d’identité, collecte automatisée non autorisée, revente de données, harcèlement, discrimination, fausses offres, frais illégitimes imposés aux candidats, contenus malveillants et atteintes à la sécurité.'],
      ['Responsabilité et bêta', 'La version bêta peut évoluer et connaître des interruptions. Nzela Jobs met en œuvre des moyens raisonnables de sécurité et de disponibilité sans garantir l’absence totale d’incident. Les utilisateurs doivent conserver leurs propres copies des documents importants.'],
    ],
  },
  notices: {
    title: 'Mentions légales',
    intro: 'Informations d’identification du service en phase de structuration.',
    sections: [
      ['Éditeur et propriétaire du produit', 'Rodrin Bakala Mouengue — fondateur, porteur du projet et responsable produit de Nzela Jobs. La structure juridique définitive est en cours de formalisation ; les informations d’immatriculation seront ajoutées avant la commercialisation générale.'],
      ['Service', 'Nzela Jobs — plateforme privée indépendante de mise en relation et de gestion des candidatures, destinée prioritairement au Congo-Brazzaville.'],
      ['Nzela Immobilier', 'Nzela Immobilier est un module de petites annonces en libre-service qui permet aux particuliers et aux professionnels de publier et de consulter des logements, puis de se contacter directement. Dans cette version, il ne constitue pas un service d’encaissement, de séquestre ou de gestion locative.'],
      ['Hébergement', 'Application : Vercel. Base de données, authentification et stockage privé des CV : Supabase, projet hébergé en région eu-west-3 (Paris).'],
      ['Propriété intellectuelle', 'La marque, l’interface, les contenus originaux, le code et les éléments graphiques de Nzela Jobs sont protégés. Les contenus transmis par les entreprises et les utilisateurs restent sous leur responsabilité.'],
      ['Contact', 'Les demandes liées aux données personnelles sont déposées dans l’espace « Vos droits ». Les demandes générales peuvent être adressées par les canaux officiels publiés sur le site ou le dépôt GitHub du projet pendant la phase bêta.'],
    ],
  },
  cookies: {
    title: 'Cookies et stockage local',
    intro: 'Le site utilise actuellement des mécanismes principalement techniques.',
    sections: [
      ['Nécessaires', 'Supabase conserve les éléments indispensables à l’authentification et au maintien de session. Le navigateur conserve aussi certains réglages, favoris, brouillons et identifiants techniques afin d’assurer le fonctionnement et la continuité du parcours.'],
      ['Mesure et publicité', 'La version auditée ne contient pas de bibliothèque publicitaire ni d’outil d’analyse marketing déclaré dans ses dépendances. Tout ajout ultérieur d’un outil non nécessaire devra être documenté et, lorsque requis, soumis à un choix préalable.'],
      ['Gestion', 'La suppression du stockage du navigateur peut déconnecter l’utilisateur et effacer certains réglages locaux. Les données enregistrées dans la base restent soumises aux procédures d’accès et de suppression.'],
    ],
  },
  rights: { title: 'Exercer vos droits', intro: 'Déposez une demande et conservez la référence qui sera générée.', sections: [] },
};

function textOf(element) {
  return element?.textContent?.replace(/\s+/g, ' ').trim() || '';
}

function safeParse(value) {
  try { return JSON.parse(value || 'null'); } catch { return null; }
}

function createConsentBlock(form, kind, openLegal) {
  if (!form || form.querySelector(`[data-nzela-consent="${kind}"]`)) return;
  const block = document.createElement('div');
  block.dataset.nzelaConsent = kind;
  block.style.cssText = 'margin:14px 0;padding:12px;border:1px solid #dbe4f0;border-radius:12px;background:#f8fafc;font-size:13px;line-height:1.5;color:#334155;';
  block.innerHTML = `
    <label style="display:flex;align-items:flex-start;gap:9px;cursor:pointer">
      <input type="checkbox" data-nzela-required-consent style="margin-top:3px" />
      <span>${kind === 'signup'
        ? "J’accepte les conditions d’utilisation et je reconnais avoir lu la politique de confidentialité."
        : "J’autorise la transmission de mes informations et de mon CV au recruteur concerné par cette offre."}</span>
    </label>
    ${kind === 'signup' ? '<label style="display:flex;align-items:flex-start;gap:9px;margin-top:8px"><input type="checkbox" data-nzela-marketing style="margin-top:3px" /><span>Je souhaite recevoir les actualités Nzela Jobs. Facultatif.</span></label>' : ''}
    <div style="display:flex;gap:12px;margin-top:8px">
      <button type="button" data-open-privacy style="border:0;background:transparent;padding:0;color:#1d4ed8;font-weight:700;cursor:pointer">Confidentialité</button>
      <button type="button" data-open-terms style="border:0;background:transparent;padding:0;color:#1d4ed8;font-weight:700;cursor:pointer">Conditions</button>
    </div>
    <p data-nzela-consent-error hidden style="margin:8px 0 0;color:#b91c1c;font-weight:700">Votre accord est nécessaire pour continuer.</p>`;
  block.querySelector('[data-open-privacy]')?.addEventListener('click', () => openLegal('privacy'));
  block.querySelector('[data-open-terms]')?.addEventListener('click', () => openLegal('terms'));
  const submitButton = Array.from(form.querySelectorAll('button')).find((button) =>
    button.type === 'submit' || /créer|inscription|candidature|postuler|connexion/i.test(textOf(button)),
  );
  if (submitButton?.parentElement) submitButton.parentElement.insertBefore(block, submitButton);
  else form.appendChild(block);
  form.dataset.nzelaComplianceType = kind;
}

export default function PrivacyComplianceExperience() {
  const [page, setPage] = useState(null);
  const [session, setSession] = useState(null);
  const [message, setMessage] = useState('');
  const [requestForm, setRequestForm] = useState({ email: '', tracking: '', type: 'access', details: '' });
  const [needsAcknowledgement, setNeedsAcknowledgement] = useState(false);
  const currentPage = useMemo(() => (page ? LEGAL_PAGES[page] : null), [page]);

  const openLegal = (nextPage) => { setMessage(''); setPage(nextPage); };

  const persistAccountConsent = async (user, pending = {}) => {
    if (!user || !hasSupabaseConfig || !supabase) return;
    const now = new Date().toISOString();
    const records = [
      { user_id: user.id, subject_email: user.email, consent_type: 'terms_acceptance', document_version: LEGAL_VERSION, source: 'web_signup', granted_at: pending.grantedAt || now },
      { user_id: user.id, subject_email: user.email, consent_type: 'privacy_acknowledgement', document_version: LEGAL_VERSION, source: 'web_signup', granted_at: pending.grantedAt || now },
    ];
    if (pending.marketing) records.push({ user_id: user.id, subject_email: user.email, consent_type: 'marketing', document_version: LEGAL_VERSION, source: 'web_signup', granted_at: pending.grantedAt || now });
    for (const record of records) {
      const { error } = await supabase.from('consent_records').insert(record);
      if (error && error.code !== '23505') console.warn('Consent record not persisted', error.message);
    }
    await supabase.from('profiles').update({
      privacy_version: LEGAL_VERSION,
      privacy_acknowledged_at: pending.grantedAt || now,
      terms_accepted_at: pending.grantedAt || now,
      marketing_opt_in: Boolean(pending.marketing),
      marketing_opt_in_at: pending.marketing ? (pending.grantedAt || now) : null,
    }).eq('id', user.id);
    localStorage.removeItem(PENDING_SIGNUP_KEY);
    setNeedsAcknowledgement(false);
  };

  useEffect(() => {
    if (!hasSupabaseConfig || !supabase) return undefined;
    let active = true;
    const syncSession = async () => {
      const { data } = await supabase.auth.getSession();
      if (!active) return;
      const nextSession = data.session || null;
      setSession(nextSession);
      if (nextSession?.user) {
        setRequestForm((current) => ({ ...current, email: current.email || nextSession.user.email || '' }));
        const pending = safeParse(localStorage.getItem(PENDING_SIGNUP_KEY));
        if (pending) await persistAccountConsent(nextSession.user, pending);
        const { data: profileRow } = await supabase.from('profiles').select('privacy_version').eq('id', nextSession.user.id).maybeSingle();
        if (profileRow && profileRow.privacy_version !== LEGAL_VERSION) setNeedsAcknowledgement(true);
      }
    };
    syncSession();
    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession || null);
      if (nextSession?.user) {
        const pending = safeParse(localStorage.getItem(PENDING_SIGNUP_KEY));
        if (pending) persistAccountConsent(nextSession.user, pending);
      }
    });
    return () => { active = false; listener.subscription.unsubscribe(); };
  }, []);

  useEffect(() => {
    let frame = 0;
    const apply = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const signupHeading = Array.from(document.querySelectorAll('h1,h2')).find((heading) => /créer votre compte|inscription/i.test(textOf(heading)));
        const signupForm = signupHeading?.closest('form') || signupHeading?.parentElement?.querySelector('form');
        createConsentBlock(signupForm, 'signup', openLegal);
        const applicationButton = Array.from(document.querySelectorAll('button')).find((button) => /envoyer.*candidature|postuler maintenant/i.test(textOf(button)));
        createConsentBlock(applicationButton?.closest('form'), 'application', openLegal);

        const reference = (document.body?.innerText || '').match(/Candidature envoy[eé]e\.\s*R[eé]f[eé]rence\s*:?\s*(NZJ-[A-Z0-9-]+)/i)?.[1];
        const pending = safeParse(localStorage.getItem(PENDING_APPLICATION_KEY));
        const alreadyRecorded = localStorage.getItem(RECORDED_APPLICATION_KEY);
        if (reference && pending && reference !== alreadyRecorded && hasSupabaseConfig && supabase) {
          supabase.auth.getSession().then(({ data }) => {
            const user = data.session?.user || null;
            return supabase.from('consent_records').insert({
              user_id: user?.id || null,
              subject_email: pending.email || user?.email || null,
              tracking_number: reference,
              consent_type: 'application_data_transfer',
              document_version: LEGAL_VERSION,
              source: 'application_form',
              granted_at: pending.grantedAt,
              metadata: { page: window.location.pathname },
            });
          }).then(({ error }) => {
            if (!error || error.code === '23505') {
              localStorage.setItem(RECORDED_APPLICATION_KEY, reference);
              localStorage.removeItem(PENDING_APPLICATION_KEY);
            }
          });
        }
      });
    };

    const onSubmitCapture = (event) => {
      const form = event.target;
      if (!(form instanceof HTMLFormElement)) return;
      const kind = form.dataset.nzelaComplianceType;
      if (!kind) return;
      const block = form.querySelector(`[data-nzela-consent="${kind}"]`);
      const checkbox = block?.querySelector('[data-nzela-required-consent]');
      const error = block?.querySelector('[data-nzela-consent-error]');
      if (!checkbox?.checked) {
        event.preventDefault(); event.stopPropagation(); event.stopImmediatePropagation();
        if (error) error.hidden = false;
        checkbox?.focus();
        return;
      }
      if (error) error.hidden = true;
      const email = form.querySelector('input[type="email"]')?.value?.trim() || '';
      const grantedAt = new Date().toISOString();
      if (kind === 'signup') {
        const marketing = Boolean(block.querySelector('[data-nzela-marketing]')?.checked);
        localStorage.setItem(PENDING_SIGNUP_KEY, JSON.stringify({ email, marketing, grantedAt, version: LEGAL_VERSION }));
      } else {
        localStorage.setItem(PENDING_APPLICATION_KEY, JSON.stringify({ email, grantedAt, version: LEGAL_VERSION }));
      }
    };

    document.addEventListener('submit', onSubmitCapture, true);
    const observer = new MutationObserver(apply);
    const root = document.getElementById('root');
    if (root) observer.observe(root, { childList: true, subtree: true });
    apply();
    return () => { document.removeEventListener('submit', onSubmitCapture, true); observer.disconnect(); cancelAnimationFrame(frame); };
  }, []);

  const exportMyData = async () => {
    if (!session?.user || !supabase) { setMessage('Connectez-vous pour exporter les données liées à votre compte.'); return; }
    setMessage('Préparation de votre export…');
    const [profile, applications, savedJobs, threads, messages, consents, requests] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
      supabase.from('applications').select('*').eq('candidate_id', session.user.id),
      supabase.from('saved_jobs').select('*').eq('candidate_id', session.user.id),
      supabase.from('message_threads').select('*'),
      supabase.from('messages').select('*'),
      supabase.from('consent_records').select('*').eq('user_id', session.user.id),
      supabase.from('privacy_requests').select('*').eq('user_id', session.user.id),
    ]);
    const payload = {
      generated_at: new Date().toISOString(), legal_version: LEGAL_VERSION,
      account: { id: session.user.id, email: session.user.email, created_at: session.user.created_at },
      profile: profile.data || null, applications: applications.data || [], saved_jobs: savedJobs.data || [],
      message_threads: threads.data || [], messages: messages.data || [], consents: consents.data || [], privacy_requests: requests.data || [],
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url; link.download = `nzela-jobs-donnees-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
    setMessage('Votre export a été généré.');
  };

  const submitPrivacyRequest = async (event) => {
    event.preventDefault();
    if (!hasSupabaseConfig || !supabase) { setMessage('Le service de demande est temporairement indisponible.'); return; }
    const email = requestForm.email.trim();
    if (!email) { setMessage('Indiquez votre adresse e-mail.'); return; }
    const { error } = await supabase.from('privacy_requests').insert({
      user_id: session?.user?.id || null, email, tracking_number: requestForm.tracking.trim() || null,
      request_type: requestForm.type, details: requestForm.details.trim() || null,
    });
    if (error) { setMessage(`Demande non enregistrée : ${error.message}`); return; }
    setMessage('Votre demande est enregistrée. Le délai cible de réponse est de trente jours.');
    setRequestForm((current) => ({ ...current, tracking: '', details: '' }));
  };

  return (
    <>
      <div style={styles.bar} aria-label="Informations légales Nzela Jobs">
        <span style={{ color: '#64748b', fontWeight: 800 }}>Bêta</span>
        <button type="button" style={styles.button} onClick={() => openLegal('privacy')}>Confidentialité</button>
        <button type="button" style={styles.button} onClick={() => openLegal('rights')}>Vos droits</button>
      </div>

      {needsAcknowledgement && (
        <div style={{ ...styles.bar, left: 12, right: 'auto', maxWidth: 520, borderRadius: 16 }}>
          <span style={{ color: '#334155' }}>Les informations juridiques ont été mises à jour.</span>
          <button type="button" style={styles.button} onClick={() => openLegal('privacy')}>Lire</button>
          <button type="button" style={{ ...styles.button, background: '#1d4ed8', color: '#fff', borderRadius: 999 }} onClick={() => persistAccountConsent(session?.user, { grantedAt: new Date().toISOString(), marketing: false })}>J’accepte</button>
        </div>
      )}

      {currentPage && (
        <div style={styles.overlay} role="dialog" aria-modal="true" aria-label={currentPage.title}>
          <div style={styles.modal}>
            <header style={styles.header}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: '#1d4ed8', textTransform: 'uppercase', letterSpacing: '.08em' }}>Nzela Jobs</div>
                <h2 style={{ margin: '4px 0 0', color: '#0f172a' }}>{currentPage.title}</h2>
              </div>
              <button type="button" onClick={() => setPage(null)} style={{ ...styles.tab, fontSize: 18 }} aria-label="Fermer">×</button>
            </header>
            <main style={styles.content}>
              <div style={styles.tabs}>
                {Object.entries(LEGAL_PAGES).map(([key, value]) => (
                  <button key={key} type="button" style={{ ...styles.tab, ...(key === page ? { background: '#eff6ff', borderColor: '#60a5fa', color: '#1d4ed8' } : {}) }} onClick={() => setPage(key)}>{value.title}</button>
                ))}
              </div>
              <p style={{ fontWeight: 700, color: '#475569' }}>{currentPage.intro}</p>
              {currentPage.sections.map(([title, body]) => (
                <section key={title} style={{ marginTop: 24 }}><h3 style={{ color: '#0f172a', marginBottom: 6 }}>{title}</h3><p style={{ margin: 0 }}>{body}</p></section>
              ))}
              {page === 'rights' && (
                <section style={{ marginTop: 18 }}>
                  {session?.user && <button type="button" onClick={exportMyData} style={{ ...styles.tab, background: '#0f172a', color: '#fff', borderColor: '#0f172a', marginBottom: 18 }}>Télécharger mes données</button>}
                  <form onSubmit={submitPrivacyRequest} style={{ display: 'grid', gap: 12, maxWidth: 680 }}>
                    <label><span style={{ display: 'block', fontWeight: 800, marginBottom: 5 }}>Adresse e-mail</span><input type="email" required value={requestForm.email} onChange={(event) => setRequestForm((current) => ({ ...current, email: event.target.value }))} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 10 }} /></label>
                    <label><span style={{ display: 'block', fontWeight: 800, marginBottom: 5 }}>Référence de candidature, le cas échéant</span><input value={requestForm.tracking} onChange={(event) => setRequestForm((current) => ({ ...current, tracking: event.target.value }))} placeholder="NZJ-CAND-…" style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 10 }} /></label>
                    <label><span style={{ display: 'block', fontWeight: 800, marginBottom: 5 }}>Type de demande</span><select value={requestForm.type} onChange={(event) => setRequestForm((current) => ({ ...current, type: event.target.value }))} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 10 }}><option value="access">Accès à mes données</option><option value="rectification">Rectification</option><option value="deletion">Suppression</option><option value="objection">Opposition</option><option value="portability">Portabilité</option><option value="consent_withdrawal">Retrait du consentement</option></select></label>
                    <label><span style={{ display: 'block', fontWeight: 800, marginBottom: 5 }}>Précisions</span><textarea value={requestForm.details} onChange={(event) => setRequestForm((current) => ({ ...current, details: event.target.value }))} rows={4} style={{ width: '100%', padding: 12, border: '1px solid #cbd5e1', borderRadius: 10, resize: 'vertical' }} /></label>
                    <button type="submit" style={{ ...styles.tab, background: '#1d4ed8', color: '#fff', borderColor: '#1d4ed8', justifySelf: 'start' }}>Enregistrer ma demande</button>
                  </form>
                </section>
              )}
              {message && <p role="status" style={{ marginTop: 18, padding: 12, borderRadius: 10, background: '#eff6ff', color: '#1e40af', fontWeight: 700 }}>{message}</p>}
              <p style={{ marginTop: 30, fontSize: 12, color: '#64748b' }}>Version juridique : {LEGAL_VERSION}. Ce socle doit être complété par les formalités auprès de l’autorité congolaise compétente et par la structuration juridique de l’exploitant.</p>
            </main>
          </div>
        </div>
      )}
    </>
  );
}
