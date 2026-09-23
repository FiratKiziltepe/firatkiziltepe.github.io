// ============================================================
// CLOUD — Supabase data layer for collaborative screening
//  profiles (admin | reviewer) · projects · project_members ·
//  records (bibliographic data + AI result) · votes (one per user
//  and record: decision, labels, note). Permissions and blind mode
//  are enforced by row level security; this file only calls the API.
// ============================================================
/* global supabase */
window.Cloud = (() => {
  const cfg = window.SUPABASE_CONFIG || {};
  const available = !!(window.supabase && cfg.url && cfg.publishableKey);
  const client = available ? window.supabase.createClient(cfg.url, cfg.publishableKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true }
  }) : null;

  const PAGE = 1000;   // PostgREST max rows per request
  const CHUNK = 200;   // rows per write request (AI JSON can be a few KB per record)

  let user = null;
  let profile = null;
  const listeners = new Set();

  const check = ({ data, error }) => { if (error) throw new Error(error.message || String(error)); return data; };

  async function loadProfile() {
    profile = null;
    if (!user) return;
    const { data, error } = await client.from('profiles').select('id,email,display_name,role').eq('id', user.id).maybeSingle();
    if (!error) profile = data;
  }

  async function init() {
    if (!client) return;
    const { data } = await client.auth.getSession();
    user = data.session ? data.session.user : null;
    await loadProfile();
    client.auth.onAuthStateChange((event, session) => {
      const prev = user && user.id;
      user = session ? session.user : null;
      // supabase-js forbids awaiting other calls inside this callback
      setTimeout(async () => {
        if ((user && user.id) !== prev || event === 'USER_UPDATED' || !profile) await loadProfile();
        listeners.forEach(fn => { try { fn(event); } catch (e) { console.error(e); } });
      }, 0);
    });
  }

  // ---------- helpers mapping local records <-> rows ----------
  const AI_OMIT = ['title', 'abstract', 'authors', 'year', 'doi', 'id', 'order', 'source_row'];
  function stripAi(row) {
    if (!row) return null;
    const out = {};
    Object.keys(row).forEach(k => { if (!AI_OMIT.includes(k)) out[k] = row[k]; });
    return out;
  }

  function recordToRow(pid, rec, ai) {
    return {
      project_id: pid,
      rid: rec.rid,
      ord: rec.order,
      source_id: rec.ID || '',
      source_row: rec.SourceRow || null,
      title: rec.Title || '',
      abstract: rec.Abstract || '',
      authors: rec.Authors || '',
      year: rec.Year || '',
      doi: rec.DOI || '',
      keywords: rec.Keywords || '',
      doctype: rec.DocType || '',
      no_abstract: !!rec.noAbstract,
      duplicate_of: rec.duplicateOf || null,
      dup_kind: rec.dupKind || null,
      dup_score: typeof rec.dupScore === 'number' ? rec.dupScore : null,
      not_dup_of: rec.notDupOf || [],
      removed: !!rec.removed,
      removed_reason: rec.removedReason || '',
      ai: stripAi(ai),
      ai_decision: ai ? ai.ai_decision || ai.decision || null : null
    };
  }

  function rowToRecord(row) {
    return {
      dbId: row.id,
      rid: row.rid,
      order: row.ord,
      ID: row.source_id,
      SourceRow: row.source_row,
      Title: row.title,
      Abstract: row.abstract,
      Authors: row.authors,
      Year: row.year,
      DOI: row.doi,
      Keywords: row.keywords,
      DocType: row.doctype,
      noAbstract: row.no_abstract,
      duplicateOf: row.duplicate_of || '',
      dupKind: row.dup_kind || '',
      dupScore: row.dup_score,
      notDupOf: row.not_dup_of || [],
      removed: row.removed,
      removedReason: row.removed_reason,
      finalDecision: row.final_decision || '',
      finalBy: row.final_by || null
    };
  }

  function aiFromRow(row, rec) {
    if (!row.ai) return null;
    return Object.assign({}, row.ai, {
      rid: rec.rid, order: rec.order, id: rec.ID, title: rec.Title, abstract: rec.Abstract,
      authors: rec.Authors, year: rec.Year, doi: rec.DOI, source_row: rec.SourceRow
    });
  }

  async function fetchAll(build) {
    const out = [];
    for (let from = 0; ; from += PAGE) {
      const rows = check(await build().range(from, from + PAGE - 1));
      out.push(...rows);
      if (rows.length < PAGE) return out;
    }
  }

  return {
    get available() { return available; },
    get client() { return client; },
    get user() { return user; },
    get profile() { return profile; },
    get isAdmin() { return !!(profile && profile.role === 'admin'); },
    get displayName() { return profile ? profile.display_name || profile.email : (user ? user.email : ''); },
    onChange(fn) { listeners.add(fn); return () => listeners.delete(fn); },
    init,
    rowToRecord, aiFromRow, recordToRow, stripAi,

    // ---------- auth ----------
    async signIn(email, password) {
      check(await client.auth.signInWithPassword({ email, password }));
    },
    async signUp(email, password, displayName) {
      const data = check(await client.auth.signUp({
        email, password,
        options: { data: { display_name: displayName }, emailRedirectTo: location.origin + location.pathname }
      }));
      return { needsConfirmation: !data.session };
    },
    async signOut() { await client.auth.signOut(); },
    async resetPassword(email) {
      check(await client.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname }));
    },
    async updatePassword(password) { check(await client.auth.updateUser({ password })); },
    async updateDisplayName(name) {
      check(await client.from('profiles').update({ display_name: name }).eq('id', user.id));
      await loadProfile();
    },

    // ---------- projects ----------
    async listProjects() { return check(await client.rpc('project_overview')); },
    async getProject(id) { return check(await client.from('projects').select('*').eq('id', id).single()); },
    async createProject(p) { return check(await client.from('projects').insert(p).select('*').single()); },
    async updateProject(id, patch) { return check(await client.from('projects').update(patch).eq('id', id).select('*').single()); },
    async deleteProject(id) { check(await client.from('projects').delete().eq('id', id)); },

    // ---------- members & people ----------
    async listMembers(pid) {
      return check(await client.from('project_members')
        .select('user_id, added_at, profiles(id,email,display_name,role)').eq('project_id', pid));
    },
    async addMember(pid, userId) { check(await client.from('project_members').insert({ project_id: pid, user_id: userId })); },
    async removeMember(pid, userId) { check(await client.from('project_members').delete().eq('project_id', pid).eq('user_id', userId)); },
    async listProfiles() { return check(await client.from('profiles').select('id,email,display_name,role').order('display_name')); },

    // ---------- records ----------
    async fetchRecords(pid) {
      return fetchAll(() => client.from('records').select('*').eq('project_id', pid).order('ord'));
    },
    /** Upserts full records; returns [{id, rid}] */
    async upsertRecords(pid, items, onProgress) {
      const ids = [];
      for (let i = 0; i < items.length; i += CHUNK) {
        const rows = items.slice(i, i + CHUNK).map(({ rec, ai }) => recordToRow(pid, rec, ai));
        ids.push(...check(await client.from('records').upsert(rows, { onConflict: 'project_id,rid' }).select('id,rid')));
        if (onProgress) onProgress(Math.min(items.length, i + CHUNK), items.length);
      }
      return ids;
    },
    /** Partial update of existing records; every patch must have the same keys (plus rid). */
    async patchRecords(pid, patches) {
      for (let i = 0; i < patches.length; i += CHUNK) {
        const rows = patches.slice(i, i + CHUNK).map(p => Object.assign({ project_id: pid }, p));
        check(await client.from('records').upsert(rows, { onConflict: 'project_id,rid' }));
      }
    },

    // ---------- votes ----------
    async fetchVotes(pid) {
      return fetchAll(() => client.from('votes').select('record_id,user_id,decision,labels,note,updated_at').eq('project_id', pid).order('record_id'));
    },
    async upsertVote(v) {
      return check(await client.from('votes').upsert(Object.assign({ user_id: user.id }, v), { onConflict: 'record_id,user_id' })
        .select('record_id,user_id,decision,labels,note,updated_at').single());
    },
    async upsertVotes(votes) {
      for (let i = 0; i < votes.length; i += CHUNK) {
        const rows = votes.slice(i, i + CHUNK).map(v => Object.assign({ user_id: user.id }, v));
        check(await client.from('votes').upsert(rows, { onConflict: 'record_id,user_id' }));
      }
    },
    subscribeVotes(pid, onVote) {
      const ch = client.channel(`votes-${pid}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'votes', filter: `project_id=eq.${pid}` },
          payload => { if (payload.new && payload.new.record_id) onVote(payload.new); })
        .subscribe();
      return () => { client.removeChannel(ch); };
    }
  };
})();
