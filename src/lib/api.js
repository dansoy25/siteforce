import { supabase } from './supabase'

// ---- Profile / org ----
export async function fetchProfile(userId) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*, organization:organizations(*), site:sites(*)')
    .eq('id', userId)
    .single()
  if (error) throw error
  return data
}

export async function updateProfile(userId, patch) {
  const { error } = await supabase.from('profiles').update(patch).eq('id', userId)
  if (error) throw error
}

// ---- Sites ----
export async function fetchSites() {
  const { data, error } = await supabase.from('sites').select('*').order('name')
  if (error) throw error
  return data
}

export async function fetchSiteByQr(payload) {
  const { data, error } = await supabase
    .from('sites')
    .select('*')
    .eq('qr_payload', payload)
    .maybeSingle()
  if (error) throw error
  return data
}

// ---- Attendance ----
export async function fetchAttendance(profileId, limit = 30) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, site:sites(name)')
    .eq('profile_id', profileId)
    .order('work_date', { ascending: false })
    .order('clock_in', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// Returns the open (not yet clocked-out) attendance row for today, if any.
export async function fetchOpenAttendance(profileId) {
  const { data, error } = await supabase
    .from('attendance')
    .select('*, site:sites(name)')
    .eq('profile_id', profileId)
    .is('clock_out', null)
    .order('clock_in', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data
}

export async function clockIn({ profileId, orgId, site, project, lat, lng, method }) {
  const { data, error } = await supabase
    .from('attendance')
    .insert({
      profile_id: profileId,
      org_id: orgId,
      site_id: site?.id ?? null,
      project: project ?? null,
      clock_in: new Date().toISOString(),
      status: 'ongoing',
      method: method ?? 'Face + GPS',
      lat,
      lng,
    })
    .select('*, site:sites(name)')
    .single()
  if (error) throw error
  return data
}

export async function clockOut(attendanceId, clockInIso) {
  const now = new Date()
  const hours = clockInIso
    ? Math.round(((now - new Date(clockInIso)) / 3600000) * 100) / 100
    : null
  const { error } = await supabase
    .from('attendance')
    .update({ clock_out: now.toISOString(), hours, status: 'present' })
    .eq('id', attendanceId)
  if (error) throw error
  return hours
}

// ---- Leave ----
export async function fetchLeaveTypes() {
  const { data, error } = await supabase.from('leave_types').select('*').order('name')
  if (error) throw error
  return data
}

export async function fetchLeaveBalances(profileId) {
  const { data, error } = await supabase
    .from('leave_balances')
    .select('*, leave_type:leave_types(*)')
    .eq('profile_id', profileId)
  if (error) throw error
  return data
}

export async function fetchLeaveRequests(profileId) {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, leave_type:leave_types(name)')
    .eq('profile_id', profileId)
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function submitLeave({ profileId, orgId, leaveTypeId, from, to, days, reason }) {
  const { data, error } = await supabase
    .from('leave_requests')
    .insert({
      profile_id: profileId,
      org_id: orgId,
      leave_type_id: leaveTypeId,
      date_from: from,
      date_to: to,
      days,
      reason,
      status: 'pending',
    })
    .select('*, leave_type:leave_types(name)')
    .single()
  if (error) throw error
  return data
}

// ---- Payslips ----
export async function fetchPayslips(profileId) {
  const { data, error } = await supabase
    .from('payslips')
    .select('*')
    .eq('profile_id', profileId)
    .order('period_start', { ascending: false })
  if (error) throw error
  return data
}

// ---- Avatars ----
// Uploads a photo to the public 'avatars' bucket and saves it on the profile.
export async function uploadAvatar(profileId, file) {
  const ext = (file.name?.split('.').pop() || 'jpg').toLowerCase()
  const path = `${profileId}/${Date.now()}.${ext}`
  const { error: upErr } = await supabase.storage
    .from('avatars')
    .upload(path, file, { upsert: true, cacheControl: '3600', contentType: file.type || undefined })
  if (upErr) throw upErr
  const { data: pub } = supabase.storage.from('avatars').getPublicUrl(path)
  const url = pub.publicUrl
  const { error: updErr } = await supabase.from('profiles').update({ avatar_url: url }).eq('id', profileId)
  if (updErr) throw updErr
  return url
}

// ---- Activity log / notifications ----
const ACTIVITY_TEXT = {
  login: 'signed in',
  logout: 'signed out',
  clock_in: 'clocked in',
  clock_out: 'clocked out',
  leave_request: 'requested leave',
  leave_approved: 'approved a leave request',
  leave_rejected: 'rejected a leave request',
  payroll_locked: 'locked a payroll run',
}

// Records an activity event. Best-effort: never throw into the UI flow.
export async function logActivity({ orgId, actorId, actorName, type, message }) {
  if (!orgId || !actorId) return
  try {
    await supabase.from('notifications').insert({
      org_id: orgId,
      actor_id: actorId,
      actor_name: actorName,
      type,
      message: message || `${actorName || 'Someone'} ${ACTIVITY_TEXT[type] || type}`,
    })
  } catch (e) {
    console.warn('logActivity failed', e)
  }
}

// RLS decides scope: admins get org-wide, employees get their own.
export async function fetchNotifications(limit = 20) {
  const { data, error } = await supabase
    .from('notifications')
    .select('*, actor:profiles(avatar_url)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) throw error
  return data
}

// ---- Announcements ----
export async function fetchAnnouncements() {
  const { data, error } = await supabase
    .from('announcements')
    .select('*')
    .order('created_at', { ascending: false })
    .limit(10)
  if (error) throw error
  return data
}
