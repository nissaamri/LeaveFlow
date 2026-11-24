import { useEffect, useState } from 'react'
import {
  LayoutDashboard, Users, CalendarDays, ClipboardList,
  CheckCircle2, Wallet, Building2, Calendar, FileText,
  Search, Bell, Menu, X, ChevronDown,
  ArrowUpRight, Clock3, CircleCheck, CircleX, Plus,
  MoreHorizontal, BriefcaseBusiness, CalendarCheck,
  AlertCircle, Pencil, Trash2, LoaderCircle, ChevronLeft, ChevronRight, RefreshCw, LogOut, Mail, LockKeyhole
} from 'lucide-react'
import { api, auth } from './services/api'
import './App.css'

const navigation = [
  {
    title: 'MAIN MENU',
    items: [
      { name: 'Dashboard', icon: LayoutDashboard },
      { name: 'Employees', icon: Users },
      { name: 'Leave Applications', icon: ClipboardList },
      { name: 'Leave History', icon: FileText },
      { name: 'Leave Balances', icon: Wallet },
      { name: 'Approvals', icon: CheckCircle2 },
    ],
  },
  {
    title: 'MANAGEMENT',
    items: [
      { name: 'Leave Calendar', icon: CalendarDays },
      { name: 'Departments', icon: Building2 },
      { name: 'Leave Types', icon: FileText },
      { name: 'Public Holidays', icon: Calendar },
      { name: 'Audit Logs', icon: ClipboardList },
    ],
  },
]

const emptyForm = {
  full_name: '',
  email: '',
  password: '',
  role: 'employee',
  department_id: '',
  manager_id: '',
}

const emptyApplicationForm = {
  leave_type_id: '',
  start_date: '',
  end_date: '',
  reason: '',
}

function calculateWeekdays(startDate, endDate) {
  if (!startDate || !endDate || endDate < startDate) return 0

  const [startYear, startMonth, startDay] = startDate.split('-').map(Number)
  const [endYear, endMonth, endDay] = endDate.split('-').map(Number)
  const current = new Date(startYear, startMonth - 1, startDay)
  const end = new Date(endYear, endMonth - 1, endDay)
  let total = 0

  while (current <= end) {
    const weekday = current.getDay()
    if (weekday !== 0 && weekday !== 6) total += 1
    current.setDate(current.getDate() + 1)
  }

  return total
}

function formatDate(dateString) {
  if (!dateString) return '—'

  return new Date(`${dateString}T00:00:00`).toLocaleDateString(
    'en-MY',
    { day: '2-digit', month: 'short', year: 'numeric' }
  )
}

function formatDateRange(startDate, endDate) {
  if (!startDate || !endDate) return '—'

  if (startDate === endDate) return formatDate(startDate)

  return `${formatDate(startDate)} – ${formatDate(endDate)}`
}

function capitalize(value) {
  if (!value) return 'Unknown'

  return value.charAt(0).toUpperCase() + value.slice(1).toLowerCase()
}

function formatAuditAction(action) {
  if (!action) return 'Unknown action'

  return action
    .replace(/^leave_application_/, '')
    .replace(/_/g, ' ')
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

function formatAuditDate(dateString) {
  if (!dateString) return '—'

  const date = new Date(dateString)
  if (Number.isNaN(date.getTime())) return '—'

  return date.toLocaleString('en-MY', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function toDateKey(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function LoginPage({ onLogin }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (event) => {
    event.preventDefault()
    setLoading(true)
    setError('')

    try {
      await onLogin({ email: email.trim(), password })
    } catch (loginError) {
      setError(loginError.message || 'Unable to sign in. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="login-screen">
      <div className="login-card">
        <div className="login-brand-icon"><CalendarCheck size={28} /></div>
        <h1>Welcome to LeaveFlow</h1>
        <p className="login-subtitle">Sign in to manage your leave and requests</p>

        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-field">
            <label htmlFor="login-email">Email address</label>
            <div className="login-input-wrap">
              <Mail size={18} />
              <input
                id="login-email"
                type="email"
                autoComplete="username"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </div>
          </div>

          <div className="form-field">
            <label htmlFor="login-password">Password</label>
            <div className="login-input-wrap">
              <LockKeyhole size={18} />
              <input
                id="login-password"
                type="password"
                autoComplete="current-password"
                placeholder="Enter your password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
              />
            </div>
          </div>

          {error && <div className="error-message"><AlertCircle size={17} />{error}</div>}

          <button className="primary-button login-submit" type="submit" disabled={loading}>
            {loading ? <><LoaderCircle size={18} className="login-spinner" /> Signing in...</> : 'Sign In'}
          </button>
        </form>
        <p className="login-footer">LeaveFlow · Leave Management System</p>
      </div>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] = useState(() =>
    auth.isLoggedIn() ? auth.getUser() : null
  )
  const [activePage, setActivePage] = useState('Dashboard')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(
    () => new Date(new Date().getFullYear(), new Date().getMonth(), 1)
  )
  const [selectedCalendarDate, setSelectedCalendarDate] = useState(
    () => toDateKey(new Date())
  )

  const [employees, setEmployees] = useState(null)
  const [applications, setApplications] = useState(null)
  const [leaveTypes, setLeaveTypes] = useState(null)
  const [departments, setDepartments] = useState(null)
  const [publicHolidays, setPublicHolidays] = useState(null)
  const [managementSearch, setManagementSearch] = useState('')
  const [approvals, setApprovals] = useState(null)
  const [leaveBalances, setLeaveBalances] = useState(null)
  const [auditLogs, setAuditLogs] = useState(null)
  const [auditSearchTerm, setAuditSearchTerm] = useState('')
  const [auditActionFilter, setAuditActionFilter] = useState('all')
  const [auditDateFilter, setAuditDateFilter] = useState('')
  const [auditPage, setAuditPage] = useState(1)
  const [auditRefreshing, setAuditRefreshing] = useState(false)
  const [balanceModalOpen, setBalanceModalOpen] = useState(false)
  const [editingBalance, setEditingBalance] = useState(null)
  const [balanceSaving, setBalanceSaving] = useState(false)
  const [balanceFormError, setBalanceFormError] = useState('')
  const [balanceForm, setBalanceForm] = useState({
    employee_id: '', leave_type_id: '', entitlement: '', used_days: '0',
    year: String(new Date().getFullYear()),
  })

  const [errors, setErrors] = useState({})
  const [searchTerm, setSearchTerm] = useState('')
  const [historySearchTerm, setHistorySearchTerm] = useState('')
  const [historyStatusFilter, setHistoryStatusFilter] = useState('all')

  const [modalOpen, setModalOpen] = useState(false)
  const [editingEmployee, setEditingEmployee] = useState(null)
  const [formData, setFormData] = useState(emptyForm)

  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState('')
  const [formError, setFormError] = useState('')

  const [deleteTarget, setDeleteTarget] = useState(null)

  const [applicationModalOpen, setApplicationModalOpen] = useState(false)
  const [editingApplication, setEditingApplication] = useState(null)
  const [applicationForm, setApplicationForm] = useState(emptyApplicationForm)
  const [applicationSaving, setApplicationSaving] = useState(false)
  const [applicationFormError, setApplicationFormError] = useState('')
  const [applicationDeleteTarget, setApplicationDeleteTarget] = useState(null)
  const [cancellingApplicationId, setCancellingApplicationId] = useState(null)

  const [approvalTarget, setApprovalTarget] = useState(null)
  const [approvalDecision, setApprovalDecision] = useState('approved')
  const [approvalComments, setApprovalComments] = useState('')
  const [approvalSaving, setApprovalSaving] = useState(false)
  const [approvalError, setApprovalError] = useState('')

  const loadEmployees = async () => {
    try {
      const data = await api.get('/employees/')
      setEmployees(data)
      setErrors((previous) => ({ ...previous, employees: null }))
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        employees: error.message,
      }))
    }
  }

  const loadApplications = async () => {
    try {
      const data = await api.get('/leave-applications/')
      setApplications(data)
      setErrors((previous) => ({ ...previous, applications: null }))
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        applications: error.message,
      }))
    }
  }

  const loadDepartments = async () => {
    try {
      const data = await api.get('/departments/')
      setDepartments(data)
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        departments: error.message,
      }))
    }
  }

  const loadLeaveTypes = async () => {
    try {
      const data = await api.get('/leave-types/')
      setLeaveTypes(data)
      setErrors((previous) => ({ ...previous, leaveTypes: null }))
    } catch (error) {
      setErrors((previous) => ({
        ...previous,
        leaveTypes: error.message,
      }))
    }
  }

  const loadPublicHolidays = async () => {
    try {
      const data = await api.get('/public-holidays/')
      setPublicHolidays(data)
      setErrors((previous) => ({ ...previous, publicHolidays: null }))
    } catch (error) {
      setPublicHolidays([])
      setErrors((previous) => ({
        ...previous,
        publicHolidays: error.message,
      }))
    }
  }

  const loadLeaveBalances = async () => {
    try {
      const data = await api.get('/leave-balances/')
      setLeaveBalances(data)
      setErrors((previous) => ({ ...previous, leaveBalances: null }))
    } catch (error) {
      setLeaveBalances([])
      setErrors((previous) => ({ ...previous, leaveBalances: error.message }))
    }
  }

  const loadApprovals = async () => {
    try {
      const data = await api.get('/approvals/')
      setApprovals(data)
      setErrors((previous) => ({ ...previous, approvals: null }))
    } catch (error) {
      setApprovals([])
      setErrors((previous) => ({ ...previous, approvals: error.message }))
    }
  }

  const loadAuditLogs = async () => {
    setAuditRefreshing(true)

    try {
      const data = await api.get('/audit-logs/')
      setAuditLogs(Array.isArray(data) ? data : [])
      setErrors((previous) => ({ ...previous, auditLogs: null }))
    } catch (error) {
      setAuditLogs([])
      setErrors((previous) => ({ ...previous, auditLogs: error.message }))
    } finally {
      setAuditRefreshing(false)
    }
  }

  useEffect(() => {
    if (!currentUser) return

    // Clear old account data before loading the newly signed-in user's records.
    setEmployees(currentUser.role === 'hr_admin' ? null : [])
    setApplications(null)
    setDepartments(null)
    setLeaveTypes(null)
    setApprovals(['manager', 'hr_admin'].includes(currentUser.role) ? null : [])
    setLeaveBalances(null)
    setAuditLogs(currentUser.role === 'hr_admin' ? null : [])
    setErrors({})

    if (currentUser.role === 'hr_admin') {
      loadEmployees()
      loadAuditLogs()
    }

    if (['manager', 'hr_admin'].includes(currentUser.role)) {
      loadApprovals()
    }

    loadApplications()
    loadDepartments()
    loadLeaveTypes()
    loadLeaveBalances()
  }, [currentUser])

  const getEmployeeName = (employeeId) => {
    if (employeeId === currentUser?.employee_id) {
      return currentUser.full_name
    }

    const employee = employees?.find(
      (item) => item.employee_id === employeeId
    )

    return employee?.full_name || `Employee #${employeeId}`
  }

  const getLeaveTypeName = (leaveTypeId) => {
    const leaveType = leaveTypes?.find(
      (item) => item.leave_type_id === leaveTypeId
    )

    return leaveType?.leave_type_name || leaveType?.name || `Leave Type #${leaveTypeId}`
  }

  const getDepartmentName = (departmentId) => {
    const department = departments?.find(
      (item) => item.department_id === departmentId
    )

    return department?.department_name || `Department #${departmentId}`
  }

  const currentYear = new Date().getFullYear()
  const currentYearBalances = (leaveBalances || []).filter(
    (balance) => balance.year === currentYear
  )
  const totalEntitlement = currentYearBalances.reduce((sum, item) => sum + item.entitlement, 0)
  const totalUsedDays = currentYearBalances.reduce((sum, item) => sum + item.used_days, 0)
  const totalRemainingDays = totalEntitlement - totalUsedDays

  const pendingCount = applications?.filter(
    (item) => item.status?.toLowerCase() === 'pending'
  ).length ?? 0

  const approvedCount = applications?.filter(
    (item) => item.status?.toLowerCase() === 'approved'
  ).length ?? 0

  const rejectedCount = applications?.filter(
    (item) => item.status?.toLowerCase() === 'rejected'
  ).length ?? 0

  const stats = [
    {
      title: currentUser?.role === 'hr_admin' ? 'Total Employees' : 'Signed-in Role',
      value: currentUser?.role === 'hr_admin'
        ? (employees === null ? '...' : employees.length)
        : (currentUser?.role === 'hr_admin' ? 'HR Admin' : capitalize(currentUser?.role)),
      change: currentUser?.role === 'hr_admin' ? 'Retrieved from database' : 'Your LeaveFlow access level',
      icon: Users,
      color: 'blue',
    },
    {
      title: 'Pending Requests',
      value: applications === null ? '...' : pendingCount,
      change: 'Awaiting approval',
      icon: Clock3,
      color: 'orange',
    },
    {
      title: 'Approved Leaves',
      value: applications === null ? '...' : approvedCount,
      change: 'From leave applications',
      icon: CircleCheck,
      color: 'green',
    },
    {
      title: 'Rejected Requests',
      value: applications === null ? '...' : rejectedCount,
      change: 'From leave applications',
      icon: CircleX,
      color: 'red',
    },
  ]

  const recentApplications = applications
    ? [...applications].sort(
        (a, b) =>
          new Date(b.submitted_at) - new Date(a.submitted_at)
      )
    : []

  const filteredHistoryApplications = recentApplications.filter((application) => {
    const search = historySearchTerm.trim().toLowerCase()
    const matchesSearch = !search || [
      String(application.application_id),
      getEmployeeName(application.employee_id),
      getLeaveTypeName(application.leave_type_id),
      application.reason || '',
    ].some((value) => value.toLowerCase().includes(search))
    const matchesStatus = historyStatusFilter === 'all' ||
      application.status?.toLowerCase() === historyStatusFilter

    return matchesSearch && matchesStatus
  })

  const sortedAuditLogs = [...(auditLogs || [])].sort(
    (a, b) => new Date(b.created_at) - new Date(a.created_at)
  )

  const filteredAuditLogs = sortedAuditLogs.filter((log) => {
    const search = auditSearchTerm.trim().toLowerCase()
    const actorName = getEmployeeName(log.actor_id)
    const matchesSearch = !search || [
      String(log.audit_id),
      String(log.actor_id),
      actorName,
      log.action || '',
      log.entity_type || '',
      String(log.entity_id),
    ].some((value) => value.toLowerCase().includes(search))
    const matchesAction = auditActionFilter === 'all' || log.action === auditActionFilter
    const logDate = log.created_at ? new Date(log.created_at).toLocaleDateString('en-CA') : ''
    const matchesDate = !auditDateFilter || logDate === auditDateFilter

    return matchesSearch && matchesAction && matchesDate
  })

  const auditPageSize = 8
  const auditPageCount = Math.max(1, Math.ceil(filteredAuditLogs.length / auditPageSize))
  const paginatedAuditLogs = filteredAuditLogs.slice(
    (auditPage - 1) * auditPageSize,
    auditPage * auditPageSize
  )

  useEffect(() => {
    setAuditPage(1)
  }, [auditSearchTerm, auditActionFilter, auditDateFilter])

  useEffect(() => {
    if (auditPage > auditPageCount) setAuditPage(auditPageCount)
  }, [auditPage, auditPageCount])

  const auditLeaveActionCount = (auditLogs || []).filter(
    (log) => log.entity_type === 'leave_application'
  ).length
  const auditActorCount = new Set((auditLogs || []).map((log) => log.actor_id)).size

  const approvedCalendarApplications = (applications || []).filter(
    (application) =>
      application.status?.toLowerCase() === 'approved' &&
      application.start_date &&
      application.end_date
  )

  const calendarYear = calendarMonth.getFullYear()
  const calendarMonthIndex = calendarMonth.getMonth()
  const calendarFirstDay = new Date(calendarYear, calendarMonthIndex, 1)
  const calendarStartOffset = calendarFirstDay.getDay()
  const calendarDays = Array.from({ length: 42 }, (_, index) => {
    const date = new Date(calendarYear, calendarMonthIndex, index - calendarStartOffset + 1)
    const dateKey = toDateKey(date)
    const dayApplications = approvedCalendarApplications.filter(
      (application) =>
        application.start_date <= dateKey && application.end_date >= dateKey
    )

    return {
      date,
      dateKey,
      isCurrentMonth: date.getMonth() === calendarMonthIndex,
      isToday: dateKey === toDateKey(new Date()),
      applications: dayApplications,
    }
  })

  const selectedDayApplications = approvedCalendarApplications.filter(
    (application) =>
      application.start_date <= selectedCalendarDate &&
      application.end_date >= selectedCalendarDate
  )

  const calendarMonthApplications = approvedCalendarApplications.filter(
    (application) =>
      application.start_date <= toDateKey(new Date(calendarYear, calendarMonthIndex + 1, 0)) &&
      application.end_date >= toDateKey(calendarFirstDay)
  )

  const calendarEmployeeCount = new Set(
    calendarMonthApplications.map((application) => application.employee_id)
  ).size

  const changeCalendarMonth = (amount) => {
    const nextMonth = new Date(calendarYear, calendarMonthIndex + amount, 1)
    setCalendarMonth(nextMonth)
    setSelectedCalendarDate(toDateKey(nextMonth))
  }

  const pendingApplications = recentApplications.filter(
    (application) => application.status?.toLowerCase() === 'pending'
  )

  const filteredEmployees = employees?.filter((employee) => {
    const search = searchTerm.toLowerCase()

    return (
      employee.full_name.toLowerCase().includes(search) ||
      employee.email.toLowerCase().includes(search) ||
      employee.role.toLowerCase().includes(search) ||
      employee.employee_id.toString().includes(search)
    )
  }) ?? []

  const openAddModal = () => {
    setEditingEmployee(null)
    setFormData(emptyForm)
    setFormError('')
    setMessage('')
    setModalOpen(true)
  }

  const openEditModal = (employee) => {
    setEditingEmployee(employee)
    setFormData({
      full_name: employee.full_name,
      email: employee.email,
      password: '',
      role: employee.role,
      department_id: employee.department_id.toString(),
      manager_id: employee.manager_id?.toString() || '',
    })
    setFormError('')
    setMessage('')
    setModalOpen(true)
  }

  const closeModal = () => {
    if (saving) return

    setModalOpen(false)
    setEditingEmployee(null)
    setFormData(emptyForm)
    setFormError('')
  }

  const handleFormChange = (event) => {
    const { name, value } = event.target

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }))
  }

  const handleSaveEmployee = async (event) => {
    event.preventDefault()
    setSaving(true)
    setFormError('')
    setMessage('')

    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        role: formData.role,
        department_id: Number(formData.department_id),
        manager_id: formData.manager_id
          ? Number(formData.manager_id)
          : null,
      }

      if (!editingEmployee) {
        if (!formData.password) {
          throw new Error('Password is required for a new employee.')
        }

        payload.password = formData.password

        await api.post('/employees/', payload)
      } else {
        if (formData.password.trim()) {
          payload.password = formData.password
        }

        await api.put(
          `/employees/${editingEmployee.employee_id}`,
          payload
        )
      }

      await loadEmployees()

      setModalOpen(false)
      setEditingEmployee(null)
      setFormData(emptyForm)

      setMessage(
        editingEmployee
          ? 'Employee updated successfully.'
          : 'Employee created successfully.'
      )
    } catch (error) {
      setFormError(error.message)
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteEmployee = async () => {
    if (!deleteTarget) return

    try {
      await api.delete(`/employees/${deleteTarget.employee_id}`)
      setDeleteTarget(null)
      setMessage('Employee deleted successfully.')
      await loadEmployees()
    } catch (error) {
      setMessage(`Unable to delete employee: ${error.message}`)
      setDeleteTarget(null)
    }
  }

  const openAddApplicationModal = () => {
    setEditingApplication(null)
    setApplicationForm({
      ...emptyApplicationForm,
      leave_type_id: leaveTypes?.find((item) => item.is_active)?.leave_type_id?.toString() || '',
    })
    setApplicationFormError('')
    setMessage('')
    setApplicationModalOpen(true)
  }

  const openEditApplicationModal = (application) => {
    setEditingApplication(application)
    setApplicationForm({
      employee_id: application.employee_id.toString(),
      leave_type_id: application.leave_type_id.toString(),
      start_date: application.start_date,
      end_date: application.end_date,
      reason: application.reason,
    })
    setApplicationFormError('')
    setMessage('')
    setApplicationModalOpen(true)
  }

  const closeApplicationModal = () => {
    if (applicationSaving) return
    setApplicationModalOpen(false)
    setEditingApplication(null)
    setApplicationForm(emptyApplicationForm)
    setApplicationFormError('')
  }

  const handleApplicationFormChange = (event) => {
    const { name, value } = event.target
    setApplicationForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSaveApplication = async (event) => {
    event.preventDefault()
    setApplicationSaving(true)
    setApplicationFormError('')
    setMessage('')

    try {
      if (!applicationForm.leave_type_id) {
        throw new Error('Please select a leave type.')
      }
      if (!applicationForm.start_date || !applicationForm.end_date) {
        throw new Error('Please select both leave dates.')
      }
      if (applicationForm.end_date < applicationForm.start_date) {
        throw new Error('End date cannot be before start date.')
      }
      if (calculateWeekdays(applicationForm.start_date, applicationForm.end_date) < 1) {
        throw new Error('The selected date range must include at least one weekday.')
      }
      if (!applicationForm.reason.trim()) {
        throw new Error('Please provide a reason for your leave.')
      }

      const payload = {
        leave_type_id: Number(applicationForm.leave_type_id),
        start_date: applicationForm.start_date,
        end_date: applicationForm.end_date,
        reason: applicationForm.reason.trim(),
      }

      if (editingApplication) {
        await api.put(
          `/leave-applications/${editingApplication.application_id}`,
          payload
        )
      } else {
        await api.post('/leave-applications/', payload)
      }

      await loadApplications()
      setApplicationModalOpen(false)
      setEditingApplication(null)
      setApplicationForm(emptyApplicationForm)
      setMessage(
        editingApplication
          ? 'Leave application updated successfully.'
          : 'Leave application submitted successfully.'
      )
    } catch (error) {
      setApplicationFormError(error.message)
    } finally {
      setApplicationSaving(false)
    }
  }

  const handleDeleteApplication = async () => {
    if (!applicationDeleteTarget) return

    try {
      await api.delete(`/leave-applications/${applicationDeleteTarget.application_id}`)
      setApplicationDeleteTarget(null)
      await loadApplications()
      setMessage('Leave application deleted successfully.')
    } catch (error) {
      setApplicationDeleteTarget(null)
      setMessage(`Unable to delete application: ${error.message}`)
    }
  }

  const handleCancelApplication = async (application) => {
    const confirmed = window.confirm(
      application.status?.toLowerCase() === 'approved'
        ? `Cancel approved application #${application.application_id}? The deducted leave days will be returned to the employee's balance.`
        : `Cancel pending application #${application.application_id}?`
    )

    if (!confirmed) return

    setCancellingApplicationId(application.application_id)
    setMessage('')

    try {
      await api.post(`/leave-applications/${application.application_id}/cancel`)
      await Promise.all([
        loadApplications(),
        loadLeaveBalances(),
        loadApprovals(),
      ])
      setMessage(
        application.status?.toLowerCase() === 'approved'
          ? 'Approved leave cancelled successfully. The leave balance has been restored.'
          : 'Leave application cancelled successfully.'
      )
    } catch (error) {
      setMessage(`Unable to cancel application: ${error.message}`)
    } finally {
      setCancellingApplicationId(null)
    }
  }

  const openAddBalanceModal = () => {
    setEditingBalance(null)
    setBalanceForm({
      employee_id: employees?.[0]?.employee_id?.toString() || '',
      leave_type_id: leaveTypes?.find((item) => item.is_active)?.leave_type_id?.toString() || '',
      entitlement: '',
      used_days: '0',
      year: String(new Date().getFullYear()),
    })
    setBalanceFormError('')
    setMessage('')
    setBalanceModalOpen(true)
  }

  const openEditBalanceModal = (balance) => {
    setEditingBalance(balance)
    setBalanceForm({
      employee_id: String(balance.employee_id),
      leave_type_id: String(balance.leave_type_id),
      entitlement: String(balance.entitlement),
      used_days: String(balance.used_days),
      year: String(balance.year),
    })
    setBalanceFormError('')
    setMessage('')
    setBalanceModalOpen(true)
  }

  const closeBalanceModal = () => {
    if (balanceSaving) return
    setBalanceModalOpen(false)
    setEditingBalance(null)
    setBalanceFormError('')
  }

  const handleBalanceFormChange = (event) => {
    const { name, value } = event.target
    setBalanceForm((previous) => ({ ...previous, [name]: value }))
  }

  const handleSaveBalance = async (event) => {
    event.preventDefault()
    setBalanceSaving(true)
    setBalanceFormError('')
    try {
      const payload = {
        employee_id: Number(balanceForm.employee_id),
        leave_type_id: Number(balanceForm.leave_type_id),
        entitlement: Number(balanceForm.entitlement),
        used_days: Number(balanceForm.used_days),
        year: Number(balanceForm.year),
      }
      if (!payload.employee_id || !payload.leave_type_id) {
        throw new Error('Please select an employee and leave type.')
      }
      if (!Number.isInteger(payload.entitlement) || payload.entitlement < 0 ||
          !Number.isInteger(payload.used_days) || payload.used_days < 0) {
        throw new Error('Entitlement and used days must be whole numbers of zero or more.')
      }
      if (payload.used_days > payload.entitlement) {
        throw new Error('Used days cannot exceed the leave entitlement.')
      }
      if (!Number.isInteger(payload.year) || payload.year < 1) {
        throw new Error('Please enter a valid year.')
      }
      if (editingBalance) {
        await api.put(`/leave-balances/${editingBalance.balance_id}`, payload)
      } else {
        await api.post('/leave-balances/', payload)
      }
      await loadLeaveBalances()
      setBalanceModalOpen(false)
      setEditingBalance(null)
      setMessage(editingBalance ? 'Leave balance updated successfully.' : 'Leave balance created successfully.')
    } catch (error) {
      setBalanceFormError(error.message)
    } finally {
      setBalanceSaving(false)
    }
  }

  const handleDeleteBalance = async (balance) => {
    const confirmed = window.confirm(`Delete the leave balance for ${getEmployeeName(balance.employee_id)} — ${getLeaveTypeName(balance.leave_type_id)} (${balance.year})?`)
    if (!confirmed) return
    try {
      await api.delete(`/leave-balances/${balance.balance_id}`)
      await loadLeaveBalances()
      setMessage('Leave balance deleted successfully.')
    } catch (error) {
      setMessage(`Unable to delete leave balance: ${error.message}`)
    }
  }

  const openApprovalModal = (application, decision) => {
    setApprovalTarget(application)
    setApprovalDecision(decision)
    setApprovalComments('')
    setApprovalError('')
    setMessage('')
  }

  const closeApprovalModal = () => {
    if (approvalSaving) return
    setApprovalTarget(null)
    setApprovalComments('')
    setApprovalError('')
  }

  const handleSubmitApproval = async (event) => {
    event.preventDefault()
    if (!approvalTarget) return

    setApprovalSaving(true)
    setApprovalError('')

    try {
      const params = new URLSearchParams({
        application_id: String(approvalTarget.application_id),
        decision: approvalDecision,
      })
      if (approvalComments.trim()) {
        params.set('comments', approvalComments.trim())
      }

      // The backend identifies the approving manager or HR Admin from the JWT.
      await api.post(`/approvals/?${params.toString()}`)
      await Promise.all([loadApplications(), loadApprovals()])
      setApprovalTarget(null)
      setApprovalComments('')
      setMessage(
        approvalDecision === 'approved'
          ? 'Leave application approved successfully.'
          : 'Leave application rejected successfully.'
      )
    } catch (error) {
      setApprovalError(error.message)
    } finally {
      setApprovalSaving(false)
    }
  }

  const handleLogin = async (credentials) => {
    const loginData = await api.post('/auth/login', credentials)
    auth.save(loginData)
    setActivePage('Dashboard')
    setCurrentUser(loginData.employee)
  }

  const handleLogout = () => {
    auth.logout()
    setCurrentUser(null)
    setActivePage('Dashboard')
    setEmployees(null)
    setApplications(null)
    setDepartments(null)
    setLeaveTypes(null)
    setApprovals(null)
    setLeaveBalances(null)
    setAuditLogs(null)
    setMessage('')
  }

  const visibleNavigation = navigation.map((section) => ({
    ...section,
    items: section.items.filter((item) => {
      if (item.name === 'Employees' || item.name === 'Audit Logs') {
        return currentUser?.role === 'hr_admin'
      }
      if (item.name === 'Approvals') {
        return ['manager', 'hr_admin'].includes(currentUser?.role)
      }
      return true
    }),
  })).filter((section) => section.items.length > 0)

  const canManageApplication = (application) =>
    currentUser?.role === 'hr_admin' ||
    application.employee_id === currentUser?.employee_id

  if (!currentUser) {
    return <LoginPage onLogin={handleLogin} />
  }


  return (
    <div className="app-container">
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-brand">
          <div className="brand-icon">
            <CalendarCheck size={23} />
          </div>

          <div className="brand-text">
            <h2>LeaveFlow</h2>
            <span>LEAVE MANAGEMENT</span>
          </div>

          <button
            className="mobile-close"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <div className="sidebar-content">
          {visibleNavigation.map((section) => (
            <div className="nav-section" key={section.title}>
              <p className="nav-section-title">{section.title}</p>

              {section.items.map((item) => {
                const Icon = item.icon

                return (
                  <button
                    key={item.name}
                    className={`nav-item ${
                      activePage === item.name ? 'active' : ''
                    }`}
                    onClick={() => {
                      setActivePage(item.name)
                      setSidebarOpen(false)
                      setMessage('')
                      if (item.name === 'Audit Logs') loadAuditLogs()
                    }}
                  >
                    <Icon size={19} />
                    <span>{item.name}</span>
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        <div className="sidebar-bottom">
          <div className="help-card">
            <div className="help-icon">
              <BriefcaseBusiness size={19} />
            </div>
            <div>
              <strong>Need assistance?</strong>
              <p>Contact your administrator</p>
            </div>
          </div>

          <div className="sidebar-version">
            <span>LeaveFlow</span>
            <span>Version 1.0.0</span>
          </div>
        </div>
      </aside>

      <main className="main-content">
        <header className="topbar">
          <div className="topbar-left">
            <button
              className="mobile-menu"
              onClick={() => setSidebarOpen(true)}
            >
              <Menu size={22} />
            </button>

            <div className="breadcrumb">
              <span>Pages</span>
              <span className="breadcrumb-divider">/</span>
              <strong>{activePage}</strong>
            </div>
          </div>

          <div className="topbar-right">
            <div className="search-box">
              <Search size={17} />
              <input type="text" placeholder="Search anything..." />
              <span>⌘ K</span>
            </div>

            <button className="notification-button">
              <Bell size={20} />
              <span className="notification-dot" />
            </button>

            <div className="topbar-divider" />

            <div className="signed-in-profile">
              <div className="profile-avatar">{currentUser.full_name?.split(/\s+/).map((part) => part[0]).join('').slice(0, 2).toUpperCase()}</div>
              <div className="profile-info">
                <strong>{currentUser.full_name}</strong>
                <span>{currentUser.role === 'hr_admin' ? 'HR Admin' : capitalize(currentUser.role)}</span>
              </div>
              <button className="logout-button" onClick={handleLogout} title="Sign out" aria-label="Sign out">
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="dashboard-content">
          <div className="page-heading">
            <div>
              <p className="welcome-text">WELCOME BACK, {currentUser.full_name?.toUpperCase()}</p>
              <h1>{activePage}</h1>
              <p className="page-description">
                Here's what's happening with your organisation today.
              </p>
            </div>

            {activePage === 'Employees' && (
              <button className="primary-button" onClick={openAddModal}>
                <Plus size={18} />
                Add Employee
              </button>
            )}

            {activePage === 'Departments' && (
              <button className="secondary-button management-refresh-button" onClick={loadDepartments}><RefreshCw size={16} /> Refresh</button>
            )}
            {activePage === 'Leave Types' && (
              <button className="secondary-button management-refresh-button" onClick={loadLeaveTypes}><RefreshCw size={16} /> Refresh</button>
            )}
            {activePage === 'Public Holidays' && (
              <button className="secondary-button management-refresh-button" onClick={loadPublicHolidays}><RefreshCw size={16} /> Refresh</button>
            )}

            {activePage === 'Leave History' && (
            <section className="content-card">
              <div className="card-heading">
                <div>
                  <h3>Leave Application History</h3>
                  <p>View submitted leave requests and their latest status</p>
                </div>
                <span className="employee-count">
                  {applications === null
                    ? 'Loading...'
                    : `${filteredHistoryApplications.length} of ${applications.length} records`}
                </span>
              </div>

              {errors.applications && (
                <div className="error-message">
                  <AlertCircle size={18} /> {errors.applications}
                  <button onClick={loadApplications}>Retry</button>
                </div>
              )}

              <div className="employee-toolbar">
                <div className="employee-search">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search employee, leave type, request ID or reason..."
                    value={historySearchTerm}
                    onChange={(event) => setHistorySearchTerm(event.target.value)}
                  />
                </div>
                <select
                  aria-label="Filter leave history by status"
                  value={historyStatusFilter}
                  onChange={(event) => setHistoryStatusFilter(event.target.value)}
                >
                  <option value="all">All statuses</option>
                  <option value="pending">Pending</option>
                  <option value="approved">Approved</option>
                  <option value="rejected">Rejected</option>
                  <option value="cancelled">Cancelled</option>
                </select>
              </div>

              {applications === null ? (
                <p className="empty-state">Loading leave history...</p>
              ) : filteredHistoryApplications.length === 0 ? (
                <p className="empty-state">
                  {applications.length === 0
                    ? 'No leave applications have been submitted yet.'
                    : 'No leave applications match your search or status filter.'}
                </p>
              ) : (
                <div className="table-wrapper">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>REQUEST</th>
                        <th>EMPLOYEE</th>
                        <th>LEAVE TYPE</th>
                        <th>LEAVE DATES</th>
                        <th>DURATION</th>
                        <th>REASON</th>
                        <th>STATUS</th>
                        <th>SUBMITTED ON</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredHistoryApplications.map((application) => (
                        <tr key={application.application_id}>
                          <td>#{application.application_id}</td>
                          <td>{getEmployeeName(application.employee_id)}</td>
                          <td>{getLeaveTypeName(application.leave_type_id)}</td>
                          <td>{formatDateRange(application.start_date, application.end_date)}</td>
                          <td>{application.total_days} days</td>
                          <td className="approval-reason-cell">{application.reason || '—'}</td>
                          <td>
                            <span className={`status-badge ${application.status?.toLowerCase()}`}>
                              <span className="status-dot" />
                              {capitalize(application.status)}
                            </span>
                          </td>
                          <td>
                            {application.submitted_at
                              ? new Date(application.submitted_at).toLocaleString('en-MY')
                              : '—'}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activePage === 'Leave Balances' && currentUser.role === 'hr_admin' && (
              <button className="primary-button" onClick={openAddBalanceModal} disabled={!employees?.length || !leaveTypes?.some((item) => item.is_active)}>
                <Plus size={18} /> Add Leave Balance
              </button>
            )}

            {activePage === 'Leave Applications' && (
              <button
                className="primary-button"
                onClick={openAddApplicationModal}
                disabled={!leaveTypes?.some((item) => item.is_active)}
              >
                <Plus size={18} />
                Apply for Leave
              </button>
            )}
          </div>

          {activePage === 'Dashboard' && (
            <>
              <div className="stats-grid">
                {stats.map((stat) => {
                  const Icon = stat.icon
                  return (
                    <div className="stat-card" key={stat.title}>
                      <div className={`stat-icon ${stat.color}`}>
                        <Icon size={21} />
                      </div>
                      <div className="stat-details">
                        <p>{stat.title}</p>
                        <h2>{stat.value}</h2>
                        <span>{stat.change}</span>
                      </div>
                    </div>
                  )
                })}
              </div>

              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h3>Recent Leave Applications</h3>
                    <p>Latest requests submitted by employees</p>
                  </div>
                  <button
                    className="text-button"
                    onClick={() => setActivePage('Leave Applications')}
                  >
                    View all
                    <ArrowUpRight size={16} />
                  </button>
                </div>

                {applications === null ? (
                  <p className="empty-state">Loading leave applications...</p>
                ) : recentApplications.length === 0 ? (
                  <p className="empty-state">No leave applications have been submitted yet.</p>
                ) : (
                  <div className="table-wrapper recent-applications-table-wrap">
                    <table className="applications-table recent-applications-table">
                      <thead>
                        <tr>
                          <th>EMPLOYEE</th>
                          <th>LEAVE TYPE</th>
                          <th>DATE</th>
                          <th>DURATION</th>
                          <th>STATUS</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentApplications.slice(0, 5).map((application, index) => {
                          const employeeName = getEmployeeName(application.employee_id)
                          const initials = employeeName
                            .split(/\s+/)
                            .map((part) => part[0])
                            .join('')
                            .slice(0, 2)
                            .toUpperCase()
                          const avatarColors = ['green', 'blue', 'orange', 'purple']

                          return (
                            <tr key={application.application_id}>
                              <td>
                                <div className="employee-cell recent-employee-cell">
                                  <div className={`employee-avatar ${avatarColors[index % avatarColors.length]}`}>
                                    {initials}
                                  </div>
                                  <div>
                                    <strong>{employeeName}</strong>
                                    <span>Employee #{application.employee_id}</span>
                                  </div>
                                </div>
                              </td>
                              <td><span className="recent-leave-type">{getLeaveTypeName(application.leave_type_id)}</span></td>
                              <td>{formatDateRange(application.start_date, application.end_date)}</td>
                              <td><strong className="recent-duration">{application.total_days} {application.total_days === 1 ? 'day' : 'days'}</strong></td>
                              <td>
                                <span className={`status-badge ${application.status?.toLowerCase()}`}>
                                  <span className="status-dot" />
                                  {capitalize(application.status)}
                                </span>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === 'Employees' && (
            <section className="content-card">
              <div className="card-heading">
                <div>
                  <h3>Employee Directory</h3>
                  <p>Manage your organisation's employee records</p>
                </div>
                <span className="employee-count">
                  {employees === null ? 'Loading...' : `${employees.length} employees`}
                </span>
              </div>

              <div className="employee-toolbar">
                <div className="employee-search">
                  <Search size={17} />
                  <input
                    type="text"
                    placeholder="Search by name, email, role or ID..."
                    value={searchTerm}
                    onChange={(event) => setSearchTerm(event.target.value)}
                  />
                </div>
              </div>

              {errors.employees && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  {errors.employees}
                  <button onClick={loadEmployees}>Retry</button>
                </div>
              )}

              {employees === null ? (
                <p className="empty-state">Loading employees...</p>
              ) : filteredEmployees.length === 0 ? (
                <p className="empty-state">
                  {searchTerm ? 'No employees match your search.' : 'No employees found.'}
                </p>
              ) : (
                <div className="table-wrapper employee-directory-table-wrapper">
                  <table className="employee-directory-table">
                    <thead>
                      <tr>
                        <th>EMPLOYEE</th>
                        <th>EMPLOYEE ID</th>
                        <th>ROLE</th>
                        <th>DEPARTMENT</th>
                        <th>MANAGER</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredEmployees.map((employee) => (
                        <tr key={employee.employee_id}>
                          <td>
                            <div className="employee-name-cell">
                              <div className="employee-avatar">
                                {employee.full_name?.charAt(0)?.toUpperCase()}
                              </div>
                              <div>
                                <strong>{employee.full_name}</strong>
                                <span>{employee.email}</span>
                              </div>
                            </div>
                          </td>
                          <td>#{employee.employee_id}</td>
                          <td>
                            <span className={`role-badge ${employee.role}`}>
                              {capitalize(employee.role === 'hr_admin' ? 'HR Admin' : employee.role)}
                            </span>
                          </td>
                          <td>{getDepartmentName(employee.department_id)}</td>
                          <td>
                            {employee.manager_id
                              ? getEmployeeName(employee.manager_id)
                              : '—'}
                          </td>
                          <td>
                            <div className="action-buttons">
                              <button
                                className="icon-action edit-action"
                                title="Edit employee"
                                onClick={() => openEditModal(employee)}
                              >
                                <Pencil size={16} />
                              </button>
                              <button
                                className="icon-action delete-action"
                                title="Delete employee"
                                onClick={() => setDeleteTarget(employee)}
                              >
                                <Trash2 size={16} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}

          {activePage === 'Leave Applications' && (
            <section className="content-card">
              <div className="card-heading">
                <div>
                  <h3>Leave Application Records</h3>
                  <p>Submit and manage leave requests</p>
                </div>
                <span className="employee-count">
                  {applications === null ? 'Loading...' : `${applications.length} applications`}
                </span>
              </div>

              {errors.applications && (
                <div className="error-message">
                  <AlertCircle size={18} />
                  {errors.applications}
                  <button onClick={loadApplications}>Retry</button>
                </div>
              )}

              {applications === null ? (
                <p className="empty-state">Loading applications...</p>
              ) : applications.length === 0 ? (
                <p className="empty-state">
                  No applications found. Select Apply for Leave to submit the first request.
                </p>
              ) : (
                <div className="table-wrapper">
                  <table className="applications-table">
                    <thead>
                      <tr>
                        <th>APPLICATION ID</th>
                        <th>EMPLOYEE</th>
                        <th>LEAVE TYPE</th>
                        <th>DATE</th>
                        <th>DURATION</th>
                        <th>STATUS</th>
                        <th>ACTIONS</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentApplications.map((application) => (
                        <tr key={application.application_id}>
                          <td>#{application.application_id}</td>
                          <td>{getEmployeeName(application.employee_id)}</td>
                          <td>{getLeaveTypeName(application.leave_type_id)}</td>
                          <td>{formatDateRange(application.start_date, application.end_date)}</td>
                          <td>{application.total_days} days</td>
                          <td>
                            <span className={`status-badge ${application.status?.toLowerCase()}`}>
                              <span className="status-dot" />
                              {capitalize(application.status)}
                            </span>
                          </td>
                          <td>
                            {canManageApplication(application) && ['pending', 'approved'].includes(application.status?.toLowerCase()) ? (
                              <div className="action-buttons">
                                {application.status?.toLowerCase() === 'pending' && (
                                  <>
                                    <button
                                      className="icon-action edit-action"
                                      title="Edit application"
                                      onClick={() => openEditApplicationModal(application)}
                                    >
                                      <Pencil size={16} />
                                    </button>
                                    <button
                                      className="icon-action delete-action"
                                      title="Delete application"
                                      onClick={() => setApplicationDeleteTarget(application)}
                                    >
                                      <Trash2 size={16} />
                                    </button>
                                  </>
                                )}
                                <button
                                  className="icon-action delete-action"
                                  title="Cancel application"
                                  onClick={() => handleCancelApplication(application)}
                                  disabled={cancellingApplicationId === application.application_id}
                                >
                                  {cancellingApplicationId === application.application_id
                                    ? <LoaderCircle size={16} />
                                    : <CircleX size={16} />}
                                </button>
                              </div>
                            ) : (
                              <span className="muted-text">View only</span>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          )}


          {activePage === 'Leave Balances' && (
            <>
              <div className="balance-summary-grid">
                <div className="balance-summary-card">
                  <div className="balance-summary-icon blue"><Wallet size={21} /></div>
                  <div><span>Total Entitlement ({currentYear})</span><strong>{leaveBalances === null ? '...' : `${totalEntitlement} days`}</strong></div>
                </div>
                <div className="balance-summary-card">
                  <div className="balance-summary-icon orange"><CalendarDays size={21} /></div>
                  <div><span>Leave Used ({currentYear})</span><strong>{leaveBalances === null ? '...' : `${totalUsedDays} days`}</strong></div>
                </div>
                <div className="balance-summary-card">
                  <div className="balance-summary-icon green"><CircleCheck size={21} /></div>
                  <div><span>Remaining Balance ({currentYear})</span><strong>{leaveBalances === null ? '...' : `${totalRemainingDays} days`}</strong></div>
                </div>
              </div>

              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h3>Employee Leave Balances</h3>
                    <p>Manage annual entitlements, used days and remaining leave</p>
                  </div>
                  <span className="employee-count">{leaveBalances === null ? 'Loading...' : `${leaveBalances.length} records`}</span>
                </div>

                {errors.leaveBalances && (
                  <div className="error-message">
                    <AlertCircle size={18} /> {errors.leaveBalances}
                    <button onClick={loadLeaveBalances}>Retry</button>
                  </div>
                )}

                {leaveBalances === null ? (
                  <p className="empty-state">Loading leave balances...</p>
                ) : leaveBalances.length === 0 ? (
                  <div className="empty-state balance-empty-state">
                    <Wallet size={32} />
                    <strong>No leave balances yet</strong>
                    <span>{currentUser.role === 'hr_admin' ? "Create a balance record to set an employee's entitlement for a leave type and year." : 'No leave balance records are available for your account yet.'}</span>
                    {currentUser.role === 'hr_admin' && (
                      <button className="primary-button" onClick={openAddBalanceModal} disabled={!employees?.length || !leaveTypes?.some((item) => item.is_active)}>
                        <Plus size={17} /> Create First Balance
                      </button>
                    )}
                  </div>
                ) : (
                  <div className="table-wrapper balance-table-wrapper">
                    <table className="balance-table">
                      <thead>
                        <tr>
                          <th>EMPLOYEE</th>
                          <th>LEAVE TYPE</th>
                          <th>YEAR</th>
                          <th>ENTITLEMENT</th>
                          <th>USED</th>
                          <th>REMAINING</th>
                          <th>USAGE</th>
                          {currentUser.role === 'hr_admin' && <th>ACTIONS</th>}
                        </tr>
                      </thead>
                      <tbody>
                        {[...leaveBalances].sort((a, b) => b.year - a.year || a.employee_id - b.employee_id).map((balance) => {
                          const remaining = balance.entitlement - balance.used_days
                          const usage = balance.entitlement > 0 ? Math.min(100, (balance.used_days / balance.entitlement) * 100) : 0
                          return (
                            <tr key={balance.balance_id}>
                              <td><strong>{getEmployeeName(balance.employee_id)}</strong></td>
                              <td>{getLeaveTypeName(balance.leave_type_id)}</td>
                              <td>{balance.year}</td>
                              <td>{balance.entitlement} days</td>
                              <td>{balance.used_days} days</td>
                              <td><strong className="balance-remaining-value">{remaining} days</strong></td>
                              <td>
                                <div className="balance-usage-cell">
                                  <div className="balance-usage-track"><span style={{ width: `${usage}%` }} /></div>
                                  <small>{Math.round(usage)}% used</small>
                                </div>
                              </td>
                              {currentUser.role === 'hr_admin' && (
                                <td>
                                  <div className="action-buttons">
                                    <button className="icon-action edit-action" title="Edit leave balance" onClick={() => openEditBalanceModal(balance)}><Pencil size={16} /></button>
                                    <button className="icon-action delete-action" title="Delete leave balance" onClick={() => handleDeleteBalance(balance)}><Trash2 size={16} /></button>
                                  </div>
                                </td>
                              )}
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === 'Approvals' && (
            <>
              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h3>Pending Leave Requests</h3>
                    <p>Review requests and record an approval decision</p>
                  </div>
                  <span className="employee-count">{applications === null ? 'Loading...' : `${pendingApplications.length} pending`}</span>
                </div>

                {errors.applications && (
                  <div className="error-message">
                    <AlertCircle size={18} />
                    {errors.applications}
                    <button onClick={loadApplications}>Retry</button>
                  </div>
                )}

                {applications === null ? (
                  <p className="empty-state">Loading pending requests...</p>
                ) : pendingApplications.length === 0 ? (
                  <div className="empty-state approval-empty-state">
                    <CheckCircle2 size={30} />
                    <strong>All caught up!</strong>
                    <span>There are no pending leave requests to review.</span>
                  </div>
                ) : (
                  <div className="table-wrapper">
                    <table className="applications-table">
                      <thead>
                        <tr>
                          <th>EMPLOYEE</th>
                          <th>LEAVE TYPE</th>
                          <th>LEAVE DATES</th>
                          <th>DURATION</th>
                          <th>REASON</th>
                          <th>DECISION</th>
                        </tr>
                      </thead>
                      <tbody>
                        {pendingApplications.map((application) => (
                          <tr key={application.application_id}>
                            <td>
                              <div className="approval-employee-cell">
                                <strong>{getEmployeeName(application.employee_id)}</strong>
                                <span>Request #{application.application_id}</span>
                              </div>
                            </td>
                            <td>{getLeaveTypeName(application.leave_type_id)}</td>
                            <td>{formatDateRange(application.start_date, application.end_date)}</td>
                            <td>{application.total_days} days</td>
                            <td className="approval-reason-cell">{application.reason}</td>
                            <td>
                              <div className="approval-action-buttons">
                                <button
                                  className="approval-approve-button"
                                  onClick={() => openApprovalModal(application, 'approved')}
                                  
                                >
                                  <CircleCheck size={16} /> Approve
                                </button>
                                <button
                                  className="approval-reject-button"
                                  onClick={() => openApprovalModal(application, 'rejected')}
                                  
                                >
                                  <CircleX size={16} /> Reject
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>

              <section className="content-card">
                <div className="card-heading">
                  <div>
                    <h3>Decision History</h3>
                    <p>Previously approved and rejected leave requests</p>
                  </div>
                  <span className="employee-count">{approvals === null ? 'Loading...' : `${approvals.length} decisions`}</span>
                </div>
                {errors.approvals && (
                  <div className="error-message">
                    <AlertCircle size={18} /> {errors.approvals}
                    <button onClick={loadApprovals}>Retry</button>
                  </div>
                )}
                {approvals === null ? (
                  <p className="empty-state">Loading decision history...</p>
                ) : approvals.length === 0 ? (
                  <p className="empty-state">No approval decisions have been recorded yet.</p>
                ) : (
                  <div className="table-wrapper decision-history-table-wrapper">
                    <table className="decision-history-table">
                      <thead>
                        <tr>
                          <th>REQUEST</th>
                          <th>EMPLOYEE</th>
                          <th>DECISION</th>
                          <th>REVIEWED BY</th>
                          <th>COMMENTS</th>
                          <th>DECIDED AT</th>
                        </tr>
                      </thead>
                      <tbody>
                        {[...approvals].sort((a, b) => b.approval_id - a.approval_id).map((approval) => {
                          const relatedApplication = applications?.find(
                            (item) => item.application_id === approval.application_id
                          )
                          return (
                            <tr key={approval.approval_id}>
                              <td>#{approval.application_id}</td>
                              <td>{relatedApplication ? getEmployeeName(relatedApplication.employee_id) : '—'}</td>
                              <td>
                                <span className={`status-badge ${approval.decision}`}>
                                  <span className="status-dot" />
                                  {capitalize(approval.decision)}
                                </span>
                              </td>
                              <td>{getEmployeeName(approval.approver_id)}</td>
                              <td>{approval.comments || '—'}</td>
                              <td>{approval.decided_at ? new Date(approval.decided_at).toLocaleString('en-MY') : '—'}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}
              </section>
            </>
          )}

          {activePage === 'Leave Calendar' && (
            <div className="leave-calendar-page">
              <section className="content-card calendar-summary-card">
                <div>
                  <span>Approved leave requests this month</span>
                  <strong>{applications === null ? '...' : calendarMonthApplications.length}</strong>
                </div>
                <div>
                  <span>Employees scheduled for leave</span>
                  <strong>{applications === null ? '...' : calendarEmployeeCount}</strong>
                </div>
                <div>
                  <span>Calendar month</span>
                  <strong>{calendarMonth.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' })}</strong>
                </div>
              </section>

              {errors.applications && (
                <div className="error-message">
                  <AlertCircle size={18} /> {errors.applications}
                  <button onClick={loadApplications}>Retry</button>
                </div>
              )}

              <div className="calendar-layout">
                <section className="content-card calendar-main-card">
                  <div className="calendar-toolbar">
                    <div>
                      <h3>Team Leave Schedule</h3>
                      <p>Only approved leave applications are displayed</p>
                    </div>
                    <div className="calendar-month-controls">
                      <button
                        type="button"
                        className="calendar-nav-button"
                        onClick={() => changeCalendarMonth(-1)}
                        aria-label="Previous month"
                      >
                        <ChevronLeft size={19} />
                      </button>
                      <strong>
                        {calendarMonth.toLocaleDateString('en-MY', {
                          month: 'long',
                          year: 'numeric',
                        })}
                      </strong>
                      <button
                        type="button"
                        className="calendar-nav-button"
                        onClick={() => changeCalendarMonth(1)}
                        aria-label="Next month"
                      >
                        <ChevronRight size={19} />
                      </button>
                      <button
                        type="button"
                        className="calendar-today-button"
                        onClick={() => {
                          const today = new Date()
                          setCalendarMonth(new Date(today.getFullYear(), today.getMonth(), 1))
                          setSelectedCalendarDate(toDateKey(today))
                        }}
                      >
                        Today
                      </button>
                    </div>
                  </div>

                  {applications === null ? (
                    <p className="empty-state">Loading approved leave schedule...</p>
                  ) : (
                    <>
                      <div className="calendar-weekdays">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                          <div key={day}>{day}</div>
                        ))}
                      </div>
                      <div className="calendar-grid">
                        {calendarDays.map((day) => (
                          <button
                            type="button"
                            key={day.dateKey}
                            className={[
                              'calendar-day',
                              !day.isCurrentMonth ? 'outside-month' : '',
                              day.isToday ? 'today' : '',
                              selectedCalendarDate === day.dateKey ? 'selected' : '',
                            ].filter(Boolean).join(' ')}
                            onClick={() => setSelectedCalendarDate(day.dateKey)}
                          >
                            <span className="calendar-day-number">{day.date.getDate()}</span>
                            {day.applications.length > 0 && (
                              <span className="calendar-day-events">
                                {day.applications.slice(0, 2).map((application) => (
                                  <span
                                    className="calendar-event-chip"
                                    key={application.application_id}
                                    title={`${getEmployeeName(application.employee_id)} — ${getLeaveTypeName(application.leave_type_id)}`}
                                  >
                                    {getEmployeeName(application.employee_id)}
                                  </span>
                                ))}
                                {day.applications.length > 2 && (
                                  <span className="calendar-more-events">
                                    +{day.applications.length - 2} more
                                  </span>
                                )}
                              </span>
                            )}
                          </button>
                        ))}
                      </div>
                      <div className="calendar-legend">
                        <span><i /> Approved leave</span>
                        <span className="calendar-legend-note">Select a date to view who's away</span>
                      </div>
                    </>
                  )}
                </section>

                <aside className="content-card calendar-day-panel">
                  <div className="calendar-day-panel-heading">
                    <span>SELECTED DATE</span>
                    <h3>
                      {new Date(`${selectedCalendarDate}T00:00:00`).toLocaleDateString(
                        'en-MY',
                        { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
                      )}
                    </h3>
                    <p>
                      {selectedDayApplications.length === 1
                        ? '1 employee on approved leave'
                        : `${selectedDayApplications.length} employees on approved leave`}
                    </p>
                  </div>

                  {applications === null ? (
                    <p className="empty-state">Loading...</p>
                  ) : selectedDayApplications.length === 0 ? (
                    <div className="calendar-no-leave">
                      <CalendarCheck size={28} />
                      <strong>No approved leave</strong>
                      <span>No employees are scheduled for leave on this date.</span>
                    </div>
                  ) : (
                    <div className="calendar-day-list">
                      {selectedDayApplications.map((application) => (
                        <article className="calendar-person-card" key={application.application_id}>
                          <div className="calendar-person-avatar">
                            {getEmployeeName(application.employee_id).charAt(0).toUpperCase()}
                          </div>
                          <div className="calendar-person-details">
                            <strong>{getEmployeeName(application.employee_id)}</strong>
                            <span>{getLeaveTypeName(application.leave_type_id)}</span>
                            <small>
                              {formatDateRange(application.start_date, application.end_date)}
                            </small>
                            <small>Request #{application.application_id} · {application.total_days} days</small>
                          </div>
                        </article>
                      ))}
                    </div>
                  )}
                </aside>
              </div>
            </div>
          )}

          {activePage === 'Audit Logs' && (
            <div className="audit-page">
              <section className="audit-summary-grid">
                <div className="audit-summary-card">
                  <div className="audit-summary-icon blue"><ClipboardList size={20} /></div>
                  <div>
                    <span>Total audit records</span>
                    <strong>{auditLogs === null ? '...' : auditLogs.length}</strong>
                  </div>
                </div>
                <div className="audit-summary-card">
                  <div className="audit-summary-icon green"><CheckCircle2 size={20} /></div>
                  <div>
                    <span>Leave workflow activities</span>
                    <strong>{auditLogs === null ? '...' : auditLeaveActionCount}</strong>
                  </div>
                </div>
                <div className="audit-summary-card">
                  <div className="audit-summary-icon purple"><Users size={20} /></div>
                  <div>
                    <span>People involved</span>
                    <strong>{auditLogs === null ? '...' : auditActorCount}</strong>
                  </div>
                </div>
              </section>

              <section className="content-card audit-content-card">
                <div className="card-heading audit-card-heading">
                  <div>
                    <h3>Activity History</h3>
                    <p>Track who performed an action, what record was affected and when it happened</p>
                  </div>
                  <button
                    type="button"
                    className="secondary-button audit-refresh-button"
                    onClick={loadAuditLogs}
                    disabled={auditRefreshing}
                  >
                    <RefreshCw size={16} className={auditRefreshing ? 'audit-spinning' : ''} />
                    {auditRefreshing ? 'Refreshing...' : 'Refresh'}
                  </button>
                </div>

                {errors.auditLogs && (
                  <div className="error-message">
                    <AlertCircle size={18} /> {errors.auditLogs}
                    <button type="button" onClick={loadAuditLogs}>Retry</button>
                  </div>
                )}

                <div className="audit-toolbar">
                  <div className="employee-search audit-search">
                    <Search size={17} />
                    <input
                      type="text"
                      placeholder="Search employee, action or record ID..."
                      value={auditSearchTerm}
                      onChange={(event) => setAuditSearchTerm(event.target.value)}
                    />
                  </div>
                  <select
                    aria-label="Filter audit logs by action"
                    value={auditActionFilter}
                    onChange={(event) => setAuditActionFilter(event.target.value)}
                  >
                    <option value="all">All activities</option>
                    <option value="leave_application_submitted">Submitted</option>
                    <option value="leave_application_updated">Updated</option>
                    <option value="leave_application_approved">Approved</option>
                    <option value="leave_application_rejected">Rejected</option>
                    <option value="leave_application_cancelled">Cancelled</option>
                    <option value="leave_application_deleted">Deleted</option>
                  </select>
                  <input
                    className="audit-date-filter"
                    type="date"
                    aria-label="Filter audit logs by date"
                    value={auditDateFilter}
                    onChange={(event) => setAuditDateFilter(event.target.value)}
                  />
                  {(auditSearchTerm || auditActionFilter !== 'all' || auditDateFilter) && (
                    <button
                      type="button"
                      className="audit-clear-button"
                      onClick={() => {
                        setAuditSearchTerm('')
                        setAuditActionFilter('all')
                        setAuditDateFilter('')
                      }}
                    >
                      Clear filters
                    </button>
                  )}
                </div>

                <div className="audit-results-line">
                  Showing {auditLogs === null ? '...' : filteredAuditLogs.length} of {auditLogs === null ? '...' : auditLogs.length} records
                </div>

                {auditLogs === null ? (
                  <div className="audit-empty-state">
                    <LoaderCircle size={24} className="audit-spinning" />
                    <strong>Loading activity history...</strong>
                  </div>
                ) : filteredAuditLogs.length === 0 ? (
                  <div className="audit-empty-state">
                    <ClipboardList size={30} />
                    <strong>No audit records found</strong>
                    <span>Try changing your search or filters.</span>
                  </div>
                ) : (
                  <div className="table-wrapper audit-table-wrapper">
                    <table className="audit-table">
                      <thead>
                        <tr>
                          <th>ACTIVITY</th>
                          <th>PERFORMED BY</th>
                          <th>RELATED RECORD</th>
                          <th>DATE &amp; TIME</th>
                        </tr>
                      </thead>
                      <tbody>
                        {paginatedAuditLogs.map((log) => {
                          const actionClass = (log.action || 'unknown').toLowerCase().replace(/[^a-z0-9]+/g, '-')
                          return (
                            <tr key={log.audit_id}>
                              <td>
                                <div className="audit-activity-cell">
                                  <span className={`audit-action-badge ${actionClass}`}>
                                    {formatAuditAction(log.action)}
                                  </span>
                                  <small>Audit #{log.audit_id}</small>
                                </div>
                              </td>
                              <td>
                                <div className="audit-actor-cell">
                                  <span className="audit-actor-avatar">
                                    {getEmployeeName(log.actor_id).charAt(0).toUpperCase()}
                                  </span>
                                  <div>
                                    <strong>{getEmployeeName(log.actor_id)}</strong>
                                    <small>Employee #{log.actor_id}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <strong className="audit-record-id">{capitalize(log.entity_type?.replace(/_/g, ' '))} #{log.entity_id}</strong>
                              </td>
                              <td className="audit-date-cell">{formatAuditDate(log.created_at)}</td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                  </div>
                )}

                {filteredAuditLogs.length > 0 && (
                  <div className="audit-pagination">
                    <span>
                      Showing {(auditPage - 1) * auditPageSize + 1}–{Math.min(auditPage * auditPageSize, filteredAuditLogs.length)} of {filteredAuditLogs.length}
                    </span>
                    <div className="audit-pagination-controls">
                      <button
                        type="button"
                        className="audit-page-button"
                        onClick={() => setAuditPage((page) => Math.max(1, page - 1))}
                        disabled={auditPage === 1}
                        aria-label="Previous audit log page"
                      >
                        <ChevronLeft size={16} /> Previous
                      </button>
                      <span className="audit-page-number">Page {auditPage} of {auditPageCount}</span>
                      <button
                        type="button"
                        className="audit-page-button"
                        onClick={() => setAuditPage((page) => Math.min(auditPageCount, page + 1))}
                        disabled={auditPage === auditPageCount}
                        aria-label="Next audit log page"
                      >
                        Next <ChevronRight size={16} />
                      </button>
                    </div>
                  </div>
                )}
              </section>
            </div>
          )}

          {activePage === 'Departments' && (
            <section className="content-card management-content-card">
              <div className="card-heading management-card-heading">
                <div>
                  <h3>Department Directory</h3>
                  <p>Departments currently registered in your organisation</p>
                </div>
                <span className="employee-count">{departments === null ? 'Loading...' : `${departments.length} departments`}</span>
              </div>
              {errors.departments && <div className="error-message"><AlertCircle size={18} /> {errors.departments} <button onClick={loadDepartments}>Retry</button></div>}
              <div className="management-toolbar">
                <div className="employee-search"><Search size={17} /><input aria-label="Search departments" placeholder="Search departments..." value={managementSearch} onChange={(event) => setManagementSearch(event.target.value)} /></div>
                <span className="management-hint">Connected to GET /departments/</span>
              </div>
              {departments === null ? <div className="empty-state"><LoaderCircle size={22} className="audit-spinning" /> Loading departments...</div> : departments.filter((item) => (item.department_name || '').toLowerCase().includes(managementSearch.toLowerCase())).length === 0 ? (
                <div className="empty-state"><Building2 size={30} /><strong>No departments found</strong><span>{departments.length ? 'Try another search term.' : 'No departments have been added yet.'}</span></div>
              ) : (
                <div className="table-wrapper management-table-wrapper"><table className="management-table"><thead><tr><th>DEPARTMENT ID</th><th>DEPARTMENT NAME</th><th>STATUS</th></tr></thead><tbody>
                  {departments.filter((item) => (item.department_name || '').toLowerCase().includes(managementSearch.toLowerCase())).map((department) => <tr key={department.department_id}><td><span className="management-id">#{department.department_id}</span></td><td><strong>{department.department_name}</strong></td><td><span className="management-status active">Registered</span></td></tr>)}
                </tbody></table></div>
              )}
            </section>
          )}

          {activePage === 'Leave Types' && (
            <section className="content-card management-content-card">
              <div className="card-heading management-card-heading">
                <div><h3>Leave Type Catalogue</h3><p>Leave categories available when employees submit requests</p></div>
                <span className="employee-count">{leaveTypes === null ? 'Loading...' : `${leaveTypes.length} leave types`}</span>
              </div>
              {errors.leaveTypes && <div className="error-message"><AlertCircle size={18} /> {errors.leaveTypes} <button onClick={loadLeaveTypes}>Retry</button></div>}
              <div className="management-toolbar">
                <div className="employee-search"><Search size={17} /><input aria-label="Search leave types" placeholder="Search leave types..." value={managementSearch} onChange={(event) => setManagementSearch(event.target.value)} /></div>
                <span className="management-hint">Connected to GET /leave-types/</span>
              </div>
              {leaveTypes === null ? <div className="empty-state"><LoaderCircle size={22} className="audit-spinning" /> Loading leave types...</div> : leaveTypes.filter((item) => (item.leave_type_name || item.name || '').toLowerCase().includes(managementSearch.toLowerCase())).length === 0 ? (
                <div className="empty-state"><FileText size={30} /><strong>No leave types found</strong><span>{leaveTypes.length ? 'Try another search term.' : 'No leave types have been configured yet.'}</span></div>
              ) : (
                <div className="table-wrapper management-table-wrapper"><table className="management-table"><thead><tr><th>LEAVE TYPE ID</th><th>LEAVE TYPE</th><th>DEFAULT ENTITLEMENT</th><th>STATUS</th></tr></thead><tbody>
                  {leaveTypes.filter((item) => (item.leave_type_name || item.name || '').toLowerCase().includes(managementSearch.toLowerCase())).map((leaveType) => <tr key={leaveType.leave_type_id}><td><span className="management-id">#{leaveType.leave_type_id}</span></td><td><strong>{leaveType.leave_type_name || leaveType.name || 'Unnamed leave type'}</strong></td><td>{leaveType.default_days ?? leaveType.entitlement_days ?? leaveType.days_per_year ?? '—'}</td><td><span className={`management-status ${leaveType.is_active === false ? 'inactive' : 'active'}`}>{leaveType.is_active === false ? 'Inactive' : 'Active'}</span></td></tr>)}
                </tbody></table></div>
              )}
            </section>
          )}

          {activePage === 'Public Holidays' && (
            <section className="content-card management-content-card">
              <div className="card-heading management-card-heading">
                <div><h3>Public Holiday Calendar</h3><p>Public holidays recorded for your organisation and locations</p></div>
                <span className="employee-count">{publicHolidays === null ? 'Loading...' : `${publicHolidays.length} holidays`}</span>
              </div>
              {errors.publicHolidays && <div className="error-message"><AlertCircle size={18} /> {errors.publicHolidays} <button onClick={loadPublicHolidays}>Retry</button></div>}
              <div className="management-toolbar">
                <div className="employee-search"><Search size={17} /><input aria-label="Search public holidays" placeholder="Search holiday or location..." value={managementSearch} onChange={(event) => setManagementSearch(event.target.value)} /></div>
                <span className="management-hint">Connected to GET /public-holidays/</span>
              </div>
              {publicHolidays === null ? <div className="empty-state"><LoaderCircle size={22} className="audit-spinning" /> Loading public holidays...</div> : publicHolidays.filter((item) => `${item.holiday_name || ''} ${item.location || ''}`.toLowerCase().includes(managementSearch.toLowerCase())).length === 0 ? (
                <div className="empty-state"><Calendar size={30} /><strong>No public holidays found</strong><span>{publicHolidays.length ? 'Try another search term.' : 'No public holidays have been added yet.'}</span></div>
              ) : (
                <div className="table-wrapper management-table-wrapper"><table className="management-table"><thead><tr><th>HOLIDAY</th><th>DATE</th><th>LOCATION</th><th>RECORD ID</th></tr></thead><tbody>
                  {[...publicHolidays].sort((a, b) => (a.holiday_date || '').localeCompare(b.holiday_date || '')).filter((item) => `${item.holiday_name || ''} ${item.location || ''}`.toLowerCase().includes(managementSearch.toLowerCase())).map((holiday) => <tr key={holiday.holiday_id}><td><strong>{holiday.holiday_name}</strong></td><td><span className="management-date">{formatDate(holiday.holiday_date)}</span></td><td>{holiday.location || 'All locations'}</td><td><span className="management-id">#{holiday.holiday_id}</span></td></tr>)}
                </tbody></table></div>
              )}
            </section>
          )}

          {activePage !== 'Dashboard' &&
            activePage !== 'Employees' &&
            activePage !== 'Leave Applications' &&
            activePage !== 'Leave History' &&
            activePage !== 'Leave Balances' &&
            activePage !== 'Approvals' &&
            activePage !== 'Leave Calendar' &&
            activePage !== 'Audit Logs' &&
            activePage !== 'Departments' &&
            activePage !== 'Leave Types' &&
            activePage !== 'Public Holidays' && (
              <section className="content-card placeholder-card">
                <div className="placeholder-icon">
                  <ClipboardList size={28} />
                </div>
                <h3>{activePage}</h3>
                <p>
                  This section is part of the LeaveFlow management system.
                  We will connect its functionality to the backend next.
                </p>
              </section>
            )}
        </div>
      </main>

      {applicationModalOpen && (
        <div className="modal-overlay" onClick={closeApplicationModal}>
          <div
            className="employee-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>{editingApplication ? 'Edit Leave Application' : 'Apply for Leave'}</h2>
                <p>
                  {editingApplication
                    ? 'Update this pending leave request'
                    : 'Complete the details to submit a leave request'}
                </p>
              </div>
              <button className="modal-close" onClick={closeApplicationModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveApplication}>
              <div className="form-field">
                <label>Leave Type *</label>
                <select
                  name="leave_type_id"
                  value={applicationForm.leave_type_id}
                  onChange={handleApplicationFormChange}
                  required
                >
                  <option value="">Select leave type</option>
                  {leaveTypes?.filter((item) => item.is_active).map((leaveType) => (
                    <option key={leaveType.leave_type_id} value={leaveType.leave_type_id}>
                      {leaveType.leave_type_name || leaveType.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    name="start_date"
                    value={applicationForm.start_date}
                    onChange={handleApplicationFormChange}
                    required
                  />
                </div>
                <div className="form-field">
                  <label>End Date *</label>
                  <input
                    type="date"
                    name="end_date"
                    value={applicationForm.end_date}
                    min={applicationForm.start_date || undefined}
                    onChange={handleApplicationFormChange}
                    required
                  />
                </div>
              </div>

              <div className="leave-days-preview">
                <span>Estimated leave duration</span>
                <strong>
                  {calculateWeekdays(applicationForm.start_date, applicationForm.end_date)} weekdays
                </strong>
                <small>Weekends are excluded. Public holidays are not excluded in this calculation yet.</small>
              </div>

              <div className="form-field">
                <label>Reason for Leave *</label>
                <textarea
                  name="reason"
                  value={applicationForm.reason}
                  onChange={handleApplicationFormChange}
                  placeholder="Briefly explain the reason for your leave..."
                  rows={4}
                  required
                />
              </div>

              {applicationFormError && (
                <div className="error-message">
                  <AlertCircle size={17} />
                  {applicationFormError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeApplicationModal}
                  disabled={applicationSaving}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="primary-button"
                  disabled={applicationSaving || employees === null || leaveTypes === null}
                >
                  {applicationSaving ? (
                    <><LoaderCircle size={17} /> Saving...</>
                  ) : editingApplication ? 'Save Changes' : 'Submit Application'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {applicationDeleteTarget && (
        <div className="modal-overlay" onClick={() => setApplicationDeleteTarget(null)}>
          <div className="delete-modal" onClick={(event) => event.stopPropagation()}>
            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>
            <h2>Delete Leave Application?</h2>
            <p>
              Are you sure you want to delete application #{applicationDeleteTarget.application_id}?
              This action cannot be undone.
            </p>
            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setApplicationDeleteTarget(null)}
              >
                Cancel
              </button>
              <button className="danger-button" onClick={handleDeleteApplication}>
                Delete Application
              </button>
            </div>
          </div>
        </div>
      )}


      {balanceModalOpen && (
        <div className="modal-overlay" onClick={closeBalanceModal}>
          <div className="employee-modal balance-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>{editingBalance ? 'Edit Leave Balance' : 'Create Leave Balance'}</h2>
                <p>Set an employee's leave entitlement and usage for a year</p>
              </div>
              <button className="modal-close" onClick={closeBalanceModal} disabled={balanceSaving}><X size={20} /></button>
            </div>

            <form onSubmit={handleSaveBalance}>
              <div className="form-field">
                <label>Employee *</label>
                <select name="employee_id" value={balanceForm.employee_id} onChange={handleBalanceFormChange} required>
                  <option value="">Select employee</option>
                  {employees?.map((employee) => (
                    <option key={employee.employee_id} value={employee.employee_id}>{employee.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="form-field">
                <label>Leave Type *</label>
                <select name="leave_type_id" value={balanceForm.leave_type_id} onChange={handleBalanceFormChange} required>
                  <option value="">Select leave type</option>
                  {leaveTypes?.filter((item) => item.is_active).map((leaveType) => (
                    <option key={leaveType.leave_type_id} value={leaveType.leave_type_id}>{leaveType.leave_type_name || leaveType.name}</option>
                  ))}
                </select>
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Entitlement (days) *</label>
                  <input type="number" name="entitlement" min="0" step="1" value={balanceForm.entitlement} onChange={handleBalanceFormChange} placeholder="e.g. 14" required />
                </div>
                <div className="form-field">
                  <label>Used Days *</label>
                  <input type="number" name="used_days" min="0" step="1" value={balanceForm.used_days} onChange={handleBalanceFormChange} required />
                </div>
              </div>

              <div className="form-field">
                <label>Year *</label>
                <input type="number" name="year" min="1" step="1" value={balanceForm.year} onChange={handleBalanceFormChange} required />
              </div>

              {balanceForm.entitlement !== '' && balanceForm.used_days !== '' && Number(balanceForm.entitlement) >= Number(balanceForm.used_days) && (
                <div className="balance-form-preview">
                  <span>Remaining leave</span>
                  <strong>{Number(balanceForm.entitlement) - Number(balanceForm.used_days)} days</strong>
                </div>
              )}

              {balanceFormError && <div className="error-message"><AlertCircle size={17} /> {balanceFormError}</div>}

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeBalanceModal} disabled={balanceSaving}>Cancel</button>
                <button type="submit" className="primary-button" disabled={balanceSaving}>
                  {balanceSaving ? <><LoaderCircle size={17} /> Saving...</> : editingBalance ? 'Save Changes' : 'Create Balance'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {approvalTarget && (
        <div className="modal-overlay" onClick={closeApprovalModal}>
          <div className="employee-modal approval-modal" onClick={(event) => event.stopPropagation()}>
            <div className="modal-heading">
              <div>
                <h2>{approvalDecision === 'approved' ? 'Approve Leave Request' : 'Reject Leave Request'}</h2>
                <p>Review the request details before recording your decision</p>
              </div>
              <button className="modal-close" onClick={closeApprovalModal} disabled={approvalSaving}>
                <X size={20} />
              </button>
            </div>

            <div className="approval-request-summary">
              <div><span>Employee</span><strong>{getEmployeeName(approvalTarget.employee_id)}</strong></div>
              <div><span>Leave type</span><strong>{getLeaveTypeName(approvalTarget.leave_type_id)}</strong></div>
              <div><span>Dates</span><strong>{formatDateRange(approvalTarget.start_date, approvalTarget.end_date)}</strong></div>
              <div><span>Duration</span><strong>{approvalTarget.total_days} days</strong></div>
              <div className="approval-summary-reason"><span>Reason</span><strong>{approvalTarget.reason}</strong></div>
            </div>

            <form onSubmit={handleSubmitApproval}>
              <div className="form-field">
                <label htmlFor="approval-comments">Comments (Optional)</label>
                <textarea
                  id="approval-comments"
                  value={approvalComments}
                  onChange={(event) => setApprovalComments(event.target.value)}
                  placeholder="Add a note about this decision..."
                  rows={3}
                  maxLength={1000}
                />
              </div>

              {approvalError && (
                <div className="error-message"><AlertCircle size={17} /> {approvalError}</div>
              )}

              <div className="modal-actions">
                <button type="button" className="secondary-button" onClick={closeApprovalModal} disabled={approvalSaving}>
                  Cancel
                </button>
                <button
                  type="submit"
                  className={approvalDecision === 'approved' ? 'approval-approve-button' : 'approval-reject-button'}
                  disabled={approvalSaving}
                >
                  {approvalSaving ? <><LoaderCircle size={17} /> Saving...</> : approvalDecision === 'approved' ? <><CircleCheck size={17} /> Confirm Approval</> : <><CircleX size={17} /> Confirm Rejection</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {modalOpen && (
        <div className="modal-overlay" onClick={closeModal}>
          <div
            className="employee-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="modal-heading">
              <div>
                <h2>
                  {editingEmployee ? 'Edit Employee' : 'Add New Employee'}
                </h2>
                <p>
                  {editingEmployee
                    ? 'Update employee information'
                    : 'Enter the details of your new employee'}
                </p>
              </div>

              <button className="modal-close" onClick={closeModal}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleSaveEmployee}>
              <div className="form-field">
                <label>Full Name *</label>
                <input
                  name="full_name"
                  value={formData.full_name}
                  onChange={handleFormChange}
                  placeholder="e.g. Sarah Lim"
                  required
                />
              </div>

              <div className="form-field">
                <label>Email Address *</label>
                <input
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleFormChange}
                  placeholder="e.g. sarah@example.com"
                  required
                />
              </div>

              <div className="form-field">
                <label>
                  Password {editingEmployee ? '(Optional)' : '*'}
                </label>
                <input
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleFormChange}
                  placeholder={
                    editingEmployee
                      ? 'Leave blank to keep current password'
                      : 'Minimum 8 characters'
                  }
                  minLength={8}
                  required={!editingEmployee}
                />
              </div>

              <div className="form-row">
                <div className="form-field">
                  <label>Role *</label>
                  <select
                    name="role"
                    value={formData.role}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="employee">Employee</option>
                    <option value="manager">Manager</option>
                    <option value="hr_admin">HR Admin</option>
                  </select>
                </div>

                <div className="form-field">
                  <label>Department *</label>
                  <select
                    name="department_id"
                    value={formData.department_id}
                    onChange={handleFormChange}
                    required
                  >
                    <option value="">Select department</option>
                    {departments?.map((department) => (
                      <option
                        key={department.department_id}
                        value={department.department_id}
                      >
                        {department.department_name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="form-field">
                <label>Manager ID (Optional)</label>
                <select
                  name="manager_id"
                  value={formData.manager_id}
                  onChange={handleFormChange}
                >
                  <option value="">No manager assigned</option>
                  {employees?.filter(
                    (employee) =>
                      employee.role === 'manager' &&
                      employee.employee_id !== editingEmployee?.employee_id
                  ).map((manager) => (
                    <option
                      key={manager.employee_id}
                      value={manager.employee_id}
                    >
                      {manager.full_name}
                    </option>
                  ))}
                </select>
              </div>

              {formError && (
                <div className="error-message">
                  <AlertCircle size={17} />
                  {formError}
                </div>
              )}

              <div className="modal-actions">
                <button
                  type="button"
                  className="secondary-button"
                  onClick={closeModal}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  className="primary-button"
                  disabled={saving || departments === null}
                >
                  {saving ? (
                    <>
                      <LoaderCircle size={17} />
                      Saving...
                    </>
                  ) : (
                    editingEmployee
                      ? 'Save Changes'
                      : 'Create Employee'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {deleteTarget && (
        <div
          className="modal-overlay"
          onClick={() => setDeleteTarget(null)}
        >
          <div
            className="delete-modal"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="delete-modal-icon">
              <Trash2 size={24} />
            </div>

            <h2>Delete Employee?</h2>
            <p>
              Are you sure you want to delete{' '}
              <strong>{deleteTarget.full_name}</strong>?
              This action cannot be undone.
            </p>

            <div className="modal-actions">
              <button
                className="secondary-button"
                onClick={() => setDeleteTarget(null)}
              >
                Cancel
              </button>

              <button
                className="danger-button"
                onClick={handleDeleteEmployee}
              >
                Delete Employee
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App