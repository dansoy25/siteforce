import { supabase } from './supabase'

const manilaToday = () => {
  // YYYY-MM-DD in Asia/Manila
  return new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

// ---------- Dashboard ----------
export async function fetchDashboard() {
  const today = manilaToday()

  const [{ data: profiles }, { data: todayAtt }, { data: leavePending }, { data: leaveApproved }, { data: trendRows }, { data: run }] =
    await Promise.all([
      supabase.from('profiles').select('id, is_admin, status'),
      supabase.from('attendance').select('id, status, profile_id').eq('work_date', today),
      supabase
        .from('leave_requests')
        .select('id, status, date_from, date_to, days, reason, profile:profiles(full_name, position, site:sites(name)), leave_type:leave_types(name, color)')
        .eq('status', 'pending')
        .order('created_at', { ascending: false }),
      supabase.from('leave_requests').select('id, date_from, date_to').eq('status', 'approved'),
      supabase.from('attendance').select('work_date').gte('work_date', shiftDays(today, -6)),
      supabase.from('payroll_runs').select('*').order('period_start', { ascending: false }).limit(1).maybeSingle(),
    ])

  const employees = (profiles || []).filter((p) => !p.is_admin && p.status === 'active')
  const present = (todayAtt || []).filter((a) => a.status === 'present' || a.status === 'ongoing').length
  const late = (todayAtt || []).filter((a) => a.status === 'late').length
  const onLeave = (leaveApproved || []).filter((l) => l.date_from <= today && l.date_to >= today).length
  const absent = Math.max(0, employees.length - present - late - onLeave)

  // 7-day trend (counts per day)
  const counts = {}
  for (let i = 6; i >= 0; i--) counts[shiftDays(today, -i)] = 0
  ;(trendRows || []).forEach((r) => {
    if (counts[r.work_date] != null) counts[r.work_date]++
  })
  const trend = Object.entries(counts).map(([date, count]) => ({ date, count }))

  return {
    employeeCount: employees.length,
    present,
    late,
    absent,
    onLeave,
    pending: leavePending || [],
    pendingCount: (leavePending || []).length,
    trend,
    run,
    today,
  }
}

function shiftDays(isoDate, delta) {
  const d = new Date(isoDate + 'T00:00:00+08:00')
  d.setDate(d.getDate() + delta)
  return d.toLocaleDateString('en-CA', { timeZone: 'Asia/Manila' })
}

// ---------- Attendance (today) ----------
export async function fetchTodayAttendance() {
  const today = manilaToday()
  const { data, error } = await supabase
    .from('attendance')
    .select('*, profile:profiles(full_name, position), site:sites(name)')
    .eq('work_date', today)
    .order('clock_in', { ascending: true })
  if (error) throw error
  return data
}

export async function fetchSites() {
  const { data, error } = await supabase.from('sites').select('*').order('name')
  if (error) throw error
  return data
}

export async function updateSiteRadius(siteId, radius) {
  const { data, error } = await supabase
    .from('sites')
    .update({ radius_m: radius })
    .eq('id', siteId)
    .select('id')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Not permitted to update this site.')
}

// ---------- Leave approvals ----------
export async function fetchLeaveQueue() {
  const { data, error } = await supabase
    .from('leave_requests')
    .select('*, profile:profiles(full_name, position, site:sites(name)), leave_type:leave_types(name, color)')
    .order('created_at', { ascending: false })
  if (error) throw error
  return data
}

export async function decideLeave(id, decision, reviewerName, note) {
  const { error } = await supabase
    .from('leave_requests')
    .update({
      status: decision, // 'approved' | 'rejected'
      reviewer_name: reviewerName,
      decided_at: new Date().toISOString(),
      decision_note: note || null,
    })
    .eq('id', id)
  if (error) throw error
}

// ---------- Projects ----------
export async function fetchProjects() {
  const { data, error } = await supabase.from('projects').select('*, site:sites(name)').order('created_at')
  if (error) throw error
  return data
}

export async function fetchProject(id) {
  const today = manilaToday()
  const [{ data: project }, { data: members }, { data: inventory }] = await Promise.all([
    supabase.from('projects').select('*, site:sites(name)').eq('id', id).single(),
    supabase.from('project_members').select('profile:profiles(id, full_name, position, daily_rate)').eq('project_id', id),
    supabase.from('inventory_items').select('*').limit(3),
  ])
  // today's status for each member
  const ids = (members || []).map((m) => m.profile.id)
  let statusById = {}
  if (ids.length) {
    const { data: att } = await supabase
      .from('attendance')
      .select('profile_id, status')
      .eq('work_date', today)
      .in('profile_id', ids)
    ;(att || []).forEach((a) => (statusById[a.profile_id] = a.status))
  }
  return {
    project,
    members: (members || []).map((m) => ({ ...m.profile, today: statusById[m.profile.id] || 'absent' })),
    inventory: inventory || [],
  }
}

// ---------- Inventory ----------
export async function fetchInventory() {
  const { data, error } = await supabase.from('inventory_items').select('*').order('name')
  if (error) throw error
  return data
}

// ---------- Employees ----------
export async function fetchEmployees() {
  const today = manilaToday()
  const [{ data: profiles }, { data: att }, { data: leaveApproved }] = await Promise.all([
    supabase.from('profiles').select('*, site:sites(name)').order('full_name'),
    supabase.from('attendance').select('profile_id, status').eq('work_date', today),
    supabase.from('leave_requests').select('profile_id, date_from, date_to').eq('status', 'approved'),
  ])
  const attBy = {}
  ;(att || []).forEach((a) => (attBy[a.profile_id] = a.status))
  const onLeave = new Set(
    (leaveApproved || []).filter((l) => l.date_from <= today && l.date_to >= today).map((l) => l.profile_id)
  )
  return (profiles || []).map((p) => ({
    ...p,
    today: onLeave.has(p.id) ? 'on_leave' : attBy[p.id] || 'absent',
  }))
}

// ---------- Payroll ----------
export async function fetchPayrollRun() {
  const { data: run } = await supabase
    .from('payroll_runs')
    .select('*')
    .order('period_start', { ascending: false })
    .limit(1)
    .maybeSingle()

  // Build a per-employee preview from rate + a representative attendance assumption.
  const { data: profiles } = await supabase
    .from('profiles')
    .select('id, full_name, position, daily_rate, is_admin')
    .eq('status', 'active')
  const { data: settings } = await supabase.from('org_settings').select('*').maybeSingle()

  const otMult = Number(settings?.ot_multiplier || 1.25)
  const meal = Number(settings?.meal_allowance || 70)

  const rows = (profiles || [])
    .filter((p) => !p.is_admin && Number(p.daily_rate) > 0)
    .map((p) => {
      const rate = Number(p.daily_rate)
      const hourly = rate / 8
      const regH = 88
      const otH = 6
      const gross = Math.round(hourly * regH + hourly * otMult * otH + meal * 11)
      const statutory = Math.round(gross * 0.092)
      const net = gross - statutory
      return { ...p, regH, otH, gross, statutory, late: 0, net }
    })

  const totals = rows.reduce(
    (t, r) => ({ gross: t.gross + r.gross, statutory: t.statutory + r.statutory, net: t.net + r.net }),
    { gross: 0, statutory: 0, net: 0 }
  )

  return { run, rows, totals, count: rows.length }
}

export async function lockPayrollRun(id) {
  const { error } = await supabase
    .from('payroll_runs')
    .update({ status: 'locked', locked_at: new Date().toISOString() })
    .eq('id', id)
  if (error) throw error
}

// ---------- Roles / settings ----------
export async function fetchRoles() {
  const { data, error } = await supabase.from('roles').select('*').order('sort')
  if (error) throw error
  return data
}

export async function fetchOrgSettings() {
  const { data, error } = await supabase.from('org_settings').select('*').maybeSingle()
  if (error) throw error
  return data
}

// ---------- Organization (company code) ----------
export async function fetchOrganization() {
  const { data, error } = await supabase.from('organizations').select('*').maybeSingle()
  if (error) throw error
  return data
}

export async function updateCompanyCode(orgId, code) {
  const clean = (code || '').trim().toUpperCase()
  if (!clean) throw new Error('Company code cannot be empty.')
  const { data, error } = await supabase
    .from('organizations')
    .update({ code: clean })
    .eq('id', orgId)
    .select('id, code')
  if (error) throw error
  if (!data || data.length === 0) throw new Error('Not permitted to change the company code.')
  return data[0]
}
