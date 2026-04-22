import { useEffect, useMemo, useState, type ReactNode } from 'react'
import * as XLSX from 'xlsx'
import './App.css'

type View =
  | 'dashboard'
  | 'search'
  | 'organization'
  | 'organization-form'
  | 'contact'
  | 'contact-form'
  | 'pipeline'
  | 'lead'
  | 'quotes'
  | 'quote'
  | 'bulk'
  | 'users'
  | 'notifications'

type LeadState = 'nuevo' | 'contacto' | 'propuesta' | 'cerrado'
type QuoteState = 'borrador' | 'enviada' | 'aceptada' | 'rechazada'
type UserRole = 'Admin' | 'Proyectos' | 'Comunicaciones' | 'Gerencia'
type EntityType = 'organization' | 'contact' | 'lead' | 'quote'

type Organization = {
  id: string
  ruc: string
  nombre: string
  nombreLegal: string
  sector: string
  ubicacion: string
  direccion: string
  estadoComercial: string
  tipo: string
  tamano: string
  alianzas: string
  actividades: string
  linkedin: string
}

type ContactTimelineEntry = {
  id: string
  type: 'Llamada' | 'Reunion' | 'Email' | 'Nota' | 'Estado'
  date: string
  title: string
  result: string
}

type Contact = {
  id: string
  orgId: string
  nombre: string
  apellidos: string
  cargo: string
  email: string
  telefono: string
  estado: 'lead activo' | 'cliente' | 'inactivo'
  notes: string
  timeline: ContactTimelineEntry[]
}

type LeadActivity = {
  id: string
  type: 'Llamada' | 'Reunion' | 'Email' | 'Seguimiento'
  date: string
  notes: string
  result: string
}

type Lead = {
  id: string
  contactoId: string
  orgId: string
  servicio: string
  encargado: string
  estado: LeadState
  nextActivity: string
  closeDate: string
  challenge: string
  historial: string
  activities: LeadActivity[]
}

type Quote = {
  id: string
  leadId: string
  cliente: string
  monto: number
  moneda: string
  estado: QuoteState
  fecha: string
  servicio: string
  documento: string
  contactoId: string
  orgId: string
  updatedAt: string
}

type User = {
  id: string
  nombre: string
  rol: UserRole
  permisos: string[]
  correo: string
}

type NotificationItem = {
  id: string
  title: string
  detail: string
  level: 'alta' | 'media' | 'baja'
  due: string
}

type CRMState = {
  organizations: Organization[]
  contacts: Contact[]
  leads: Lead[]
  quotes: Quote[]
  users: User[]
}

type OrganizationDraft = {
  id: string | null
  ruc: string
  nombre: string
  nombreLegal: string
  sector: string
  ubicacion: string
  direccion: string
  estadoComercial: string
  tipo: string
  tamano: string
  alianzas: string
  actividades: string
  linkedin: string
}

type ContactDraft = {
  id: string | null
  orgQuery: string
  orgId: string
  nombre: string
  apellidos: string
  cargo: string
  email: string
  telefono: string
  estado: Contact['estado']
  notes: string
}

type LeadDraft = {
  contactoId: string
  servicio: string
  encargado: string
  estado: LeadState
  nextActivity: string
  closeDate: string
  challenge: string
}

type QuoteDraft = {
  id: string | null
  leadId: string
  cliente: string
  monto: string
  moneda: string
  estado: QuoteState
  fecha: string
  servicio: string
  documento: string
}

type BulkRow = {
  key: string
  type: EntityType
  name: string
  org: string
  ruc: string
  email: string
  status: string
  match: 'exacto' | 'similar' | 'nuevo'
}

const STORAGE_KEY = 'bioactvia_crm_react_v1'
const todayIso = new Date().toISOString().slice(0, 10)
let entitySequence = 0

function nextId(prefix: string) {
  entitySequence += 1
  return `${prefix}-${entitySequence}`
}

const roles: UserRole[] = ['Admin', 'Proyectos', 'Comunicaciones', 'Gerencia']
const leadColumns: Array<{ key: LeadState; label: string }> = [
  { key: 'nuevo', label: 'Nuevo' },
  { key: 'contacto', label: 'En contacto' },
  { key: 'propuesta', label: 'Propuesta' },
  { key: 'cerrado', label: 'Cerrado' },
]

const sunatDirectory = [
  {
    ruc: '20600011111',
    nombre: 'Altomayo Cooperativa',
    nombreLegal: 'Altomayo Cooperativa Agraria Ltda.',
    sector: 'Agricola',
    ubicacion: 'Tarapoto, San Martin',
    direccion: 'Jr. Comercio 345',
    tipo: 'Cooperativa',
    tamano: 'Mediana',
    alianzas: 'Red de productores aliados',
    actividades: 'Cafe especialidad y exportacion',
    linkedin: 'linkedin.com/company/altomayo',
  },
  {
    ruc: '20600022222',
    nombre: 'Cacao Aroma',
    nombreLegal: 'Cacao Aroma S.A.C.',
    sector: 'Agroindustria',
    ubicacion: 'Piura, Piura',
    direccion: 'Av. Grau 1280',
    tipo: 'S.A.C.',
    tamano: 'Pequena',
    alianzas: 'Asociacion de exportadores',
    actividades: 'Transformacion y comercializacion de cacao',
    linkedin: 'linkedin.com/company/cacao-aroma',
  },
  {
    ruc: '20600033333',
    nombre: 'BioAndina',
    nombreLegal: 'BioAndina Innovacion S.A.C.',
    sector: 'Biotecnologia',
    ubicacion: 'Lima, Lima',
    direccion: 'Av. Arequipa 1810',
    tipo: 'S.A.C.',
    tamano: 'Grande',
    alianzas: 'Universidades y hubs de I+D',
    actividades: 'Desarrollo de insumos biotecnologicos',
    linkedin: 'linkedin.com/company/bioandina',
  },
]

function buildSeedState(): CRMState {
  const organizations: Organization[] = [
    {
      id: 'org-1',
      ruc: '20600011111',
      nombre: 'Altomayo',
      nombreLegal: 'Altomayo Cooperativa Agraria Ltda.',
      sector: 'Agricola',
      ubicacion: 'Tarapoto, San Martin',
      direccion: 'Jr. Comercio 345',
      estadoComercial: 'Lead activo',
      tipo: 'Cooperativa',
      tamano: 'Mediana',
      alianzas: 'Red de productores aliados',
      actividades: 'Cafe especialidad y exportacion',
      linkedin: 'linkedin.com/company/altomayo',
    },
    {
      id: 'org-2',
      ruc: '20600022222',
      nombre: 'Cacao Aroma',
      nombreLegal: 'Cacao Aroma S.A.C.',
      sector: 'Agroindustria',
      ubicacion: 'Piura, Piura',
      direccion: 'Av. Grau 1280',
      estadoComercial: 'Cliente',
      tipo: 'S.A.C.',
      tamano: 'Pequena',
      alianzas: 'Asociacion de exportadores',
      actividades: 'Transformacion y comercializacion de cacao',
      linkedin: 'linkedin.com/company/cacao-aroma',
    },
    {
      id: 'org-3',
      ruc: '20600033333',
      nombre: 'BioAndina',
      nombreLegal: 'BioAndina Innovacion S.A.C.',
      sector: 'Biotecnologia',
      ubicacion: 'Lima, Lima',
      direccion: 'Av. Arequipa 1810',
      estadoComercial: 'Lead activo',
      tipo: 'S.A.C.',
      tamano: 'Grande',
      alianzas: 'Universidades y hubs de I+D',
      actividades: 'Desarrollo de insumos biotecnologicos',
      linkedin: 'linkedin.com/company/bioandina',
    },
  ]

  const contacts: Contact[] = [
    {
      id: 'con-1',
      orgId: 'org-1',
      nombre: 'Ana',
      apellidos: 'Ruiz',
      cargo: 'Gerente Comercial',
      email: 'ana.ruiz@altomayo.pe',
      telefono: '+51 999 111 222',
      estado: 'lead activo',
      notes: 'Solicita apoyo para formulacion de proyecto.',
      timeline: [
        {
          id: 'tl-1',
          type: 'Reunion',
          date: '2026-04-15',
          title: 'Reunion de alcance',
          result: 'Se validaron necesidades y presupuesto estimado.',
        },
        {
          id: 'tl-2',
          type: 'Email',
          date: '2026-04-18',
          title: 'Enviado resumen de propuesta',
          result: 'Pendiente confirmacion de gerencia.',
        },
      ],
    },
    {
      id: 'con-2',
      orgId: 'org-2',
      nombre: 'Luis',
      apellidos: 'Paredes',
      cargo: 'Director General',
      email: 'luis.paredes@cacaoaroma.com',
      telefono: '+51 988 222 333',
      estado: 'cliente',
      notes: 'Satisfecho con la ultima cotizacion.',
      timeline: [
        {
          id: 'tl-3',
          type: 'Llamada',
          date: '2026-04-08',
          title: 'Llamada de seguimiento',
          result: 'Aprobacion verbal del alcance final.',
        },
      ],
    },
    {
      id: 'con-3',
      orgId: 'org-3',
      nombre: 'Marta',
      apellidos: 'Vega',
      cargo: 'Jefa de Innovacion',
      email: 'marta.vega@bioandina.pe',
      telefono: '+51 955 444 555',
      estado: 'lead activo',
      notes: 'Explora proyecto con componente de laboratorio.',
      timeline: [
        {
          id: 'tl-4',
          type: 'Reunion',
          date: '2026-04-20',
          title: 'Workshop de discovery',
          result: 'Se definio interes en fondo de innovacion.',
        },
      ],
    },
  ]

  const leads: Lead[] = [
    {
      id: 'lead-1',
      contactoId: 'con-1',
      orgId: 'org-1',
      servicio: 'Formulacion de proyecto CONCYTEC',
      encargado: 'BioActvia',
      estado: 'contacto',
      nextActivity: '2026-04-24',
      closeDate: '2026-05-05',
      challenge: 'Necesita apoyo para estructurar propuesta y presupuesto.',
      historial: 'Se acordaron entregables y se envio resumen de requerimientos.',
      activities: [
        {
          id: 'act-1',
          type: 'Reunion',
          date: '2026-04-15',
          notes: 'Reunion inicial con gerencia.',
          result: 'Interes alto en avanzar con propuesta.',
        },
      ],
    },
    {
      id: 'lead-2',
      contactoId: 'con-2',
      orgId: 'org-2',
      servicio: 'Actualizacion de propuesta tecnica',
      encargado: 'BioActvia',
      estado: 'propuesta',
      nextActivity: '2026-04-23',
      closeDate: '2026-04-28',
      challenge: 'Ajuste final de alcance para cierre.',
      historial: 'Cliente ya tiene documento en revision final.',
      activities: [
        {
          id: 'act-2',
          type: 'Email',
          date: '2026-04-18',
          notes: 'Envio de version ajustada.',
          result: 'Pendiente aprobacion.',
        },
      ],
    },
    {
      id: 'lead-3',
      contactoId: 'con-3',
      orgId: 'org-3',
      servicio: 'Diagnostico de innovacion',
      encargado: 'BioActvia',
      estado: 'nuevo',
      nextActivity: '2026-04-23',
      closeDate: '',
      challenge: 'Quiere definir madurez de proyecto antes de cotizar.',
      historial: 'Primer contacto hecho en evento de innovacion.',
      activities: [],
    },
  ]

  const quotes: Quote[] = [
    {
      id: 'cot-1',
      leadId: 'lead-1',
      cliente: 'Altomayo',
      monto: 12500,
      moneda: 'PEN',
      estado: 'enviada',
      fecha: '2026-04-19',
      servicio: 'Formulacion de proyecto CONCYTEC',
      documento: 'https://drive.google.com/propuesta-altomayo-2026',
      contactoId: 'con-1',
      orgId: 'org-1',
      updatedAt: '2026-04-19',
    },
    {
      id: 'cot-2',
      leadId: 'lead-2',
      cliente: 'Cacao Aroma',
      monto: 9800,
      moneda: 'PEN',
      estado: 'aceptada',
      fecha: '2026-04-18',
      servicio: 'Actualizacion de propuesta tecnica',
      documento: 'https://drive.google.com/propuesta-cacaoaroma-2026',
      contactoId: 'con-2',
      orgId: 'org-2',
      updatedAt: '2026-04-21',
    },
  ]

  const users: User[] = [
    {
      id: 'usr-1',
      nombre: 'Carla Rojas',
      rol: 'Admin',
      correo: 'carla@bioactvia.pe',
      permisos: ['Ver todo', 'Editar cotizaciones', 'Administrar usuarios'],
    },
    {
      id: 'usr-2',
      nombre: 'Diego Salas',
      rol: 'Proyectos',
      correo: 'diego@bioactvia.pe',
      permisos: ['Crear leads', 'Registrar actividades', 'Editar cotizaciones'],
    },
    {
      id: 'usr-3',
      nombre: 'Micaela Torres',
      rol: 'Comunicaciones',
      correo: 'micaela@bioactvia.pe',
      permisos: ['Cargar contactos', 'Ver organizaciones'],
    },
    {
      id: 'usr-4',
      nombre: 'Jorge Pineda',
      rol: 'Gerencia',
      correo: 'jorge@bioactvia.pe',
      permisos: ['Ver dashboard', 'Aprobar cotizaciones'],
    },
  ]

  return { organizations, contacts, leads, quotes, users }
}

function cloneSeedState(): CRMState {
  return JSON.parse(JSON.stringify(buildSeedState())) as CRMState
}

function createOrganizationDraft(org?: Organization): OrganizationDraft {
  return {
    id: org?.id ?? null,
    ruc: org?.ruc ?? '',
    nombre: org?.nombre ?? '',
    nombreLegal: org?.nombreLegal ?? '',
    sector: org?.sector ?? '',
    ubicacion: org?.ubicacion ?? '',
    direccion: org?.direccion ?? '',
    estadoComercial: org?.estadoComercial ?? 'Lead activo',
    tipo: org?.tipo ?? '',
    tamano: org?.tamano ?? '',
    alianzas: org?.alianzas ?? '',
    actividades: org?.actividades ?? '',
    linkedin: org?.linkedin ?? '',
  }
}

function createContactDraft(contact?: Contact): ContactDraft {
  const org = contact ? buildSeedState().organizations.find((item) => item.id === contact.orgId) : null
  return {
    id: contact?.id ?? null,
    orgQuery: org ? `${org.nombre} - ${org.ruc}` : '',
    orgId: contact?.orgId ?? '',
    nombre: contact?.nombre ?? '',
    apellidos: contact?.apellidos ?? '',
    cargo: contact?.cargo ?? '',
    email: contact?.email ?? '',
    telefono: contact?.telefono ?? '',
    estado: contact?.estado ?? 'lead activo',
    notes: contact?.notes ?? '',
  }
}

function createLeadDraft(lead?: Lead): LeadDraft {
  return {
    contactoId: lead?.contactoId ?? '',
    servicio: lead?.servicio ?? '',
    encargado: lead?.encargado ?? 'BioActvia',
    estado: lead?.estado ?? 'nuevo',
    nextActivity: lead?.nextActivity ?? '',
    closeDate: lead?.closeDate ?? '',
    challenge: lead?.challenge ?? '',
  }
}

function createQuoteDraft(quote?: Quote): QuoteDraft {
  return {
    id: quote?.id ?? null,
    leadId: quote?.leadId ?? '',
    cliente: quote?.cliente ?? '',
    monto: quote ? String(quote.monto) : '',
    moneda: quote?.moneda ?? 'PEN',
    estado: quote?.estado ?? 'borrador',
    fecha: quote?.fecha ?? todayIso,
    servicio: quote?.servicio ?? '',
    documento: quote?.documento ?? '',
  }
}

function formatDate(value: string) {
  if (!value) return 'Sin fecha'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return new Intl.DateTimeFormat('es-PE', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

function formatMoney(value: number, currency = 'PEN') {
  return new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(value)
}

function normalize(value: string) {
  return value.trim().toLowerCase()
}

function parseCsv(text: string) {
  return text
    .trim()
    .split(/\r?\n/)
    .filter(Boolean)
    .map((line) =>
      line
        .split(',')
        .map((cell) => cell.trim().replace(/^"|"$/g, '').replace(/""/g, '"')),
    )
}

function isNearMatch(source: string, target: string) {
  const a = normalize(source)
  const b = normalize(target)
  if (!a || !b) return false
  return a.includes(b) || b.includes(a)
}

function App() {
  const [state, setState] = useState<CRMState>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      if (!raw) return cloneSeedState()
      const parsed = JSON.parse(raw) as Partial<CRMState>
      return {
        organizations: Array.isArray(parsed.organizations) ? parsed.organizations : [],
        contacts: Array.isArray(parsed.contacts) ? parsed.contacts : [],
        leads: Array.isArray(parsed.leads) ? parsed.leads : [],
        quotes: Array.isArray(parsed.quotes) ? parsed.quotes : [],
        users: Array.isArray(parsed.users) ? parsed.users : buildSeedState().users,
      }
    } catch {
      return cloneSeedState()
    }
  })
  const [view, setView] = useState<View>('dashboard')
  const [menuOpen, setMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedOrganizationId, setSelectedOrganizationId] = useState<string>('')
  const [selectedContactId, setSelectedContactId] = useState<string>('')
  const [selectedLeadId, setSelectedLeadId] = useState<string>('')
  const [selectedQuoteId, setSelectedQuoteId] = useState<string>('')
  const [organizationDraft, setOrganizationDraft] = useState<OrganizationDraft>(() => createOrganizationDraft())
  const [contactDraft, setContactDraft] = useState<ContactDraft>(() => createContactDraft())
  const [leadDraft, setLeadDraft] = useState<LeadDraft>(() => createLeadDraft())
  const [, setQuoteDraft] = useState<QuoteDraft>(() => createQuoteDraft())
  const [leadActivityType, setLeadActivityType] = useState<LeadActivity['type']>('Llamada')
  const [leadActivityNotes, setLeadActivityNotes] = useState('')
  const [leadActivityResult, setLeadActivityResult] = useState('')
  const [leadActivityDate, setLeadActivityDate] = useState(todayIso)
  const [contactTimelineType, setContactTimelineType] = useState<ContactTimelineEntry['type']>('Llamada')
  const [contactTimelineTitle, setContactTimelineTitle] = useState('')
  const [contactTimelineResult, setContactTimelineResult] = useState('')
  const [contactTimelineDate, setContactTimelineDate] = useState(todayIso)
  const [bulkRows, setBulkRows] = useState<BulkRow[]>([])
  const [bulkFeedback, setBulkFeedback] = useState('Sube un archivo CSV o XLSX para ver el preview y resolver duplicados.')
  const [bulkMode, setBulkMode] = useState<'crear' | 'actualizar' | 'ignorar'>('crear')
  const [orgTab, setOrgTab] = useState<'contactos' | 'leads' | 'cotizaciones'>('contactos')
  const [quoteFilter, setQuoteFilter] = useState<'todas' | QuoteState>('todas')

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
    } catch {
      // Ignorar errores de almacenamiento.
    }
  }, [state])

  useEffect(() => {
    document.title = 'BioActvia | CRM Comercial'
  }, [])

  const activeOrganizationId = selectedOrganizationId || state.organizations[0]?.id || ''
  const activeContactId = selectedContactId || state.contacts[0]?.id || ''
  const activeLeadId = selectedLeadId || state.leads[0]?.id || ''
  const activeQuoteId = selectedQuoteId || state.quotes[0]?.id || ''

  const selectedOrganization = state.organizations.find((item) => item.id === activeOrganizationId) ?? null
  const selectedContact = state.contacts.find((item) => item.id === activeContactId) ?? null
  const selectedLead = state.leads.find((item) => item.id === activeLeadId) ?? null
  const selectedQuote = state.quotes.find((item) => item.id === activeQuoteId) ?? null

  const lookup = normalize(searchQuery)

  const pipelineCounts = useMemo(() => {
    const counts = { nuevo: 0, contacto: 0, propuesta: 0, cerrado: 0 }
    state.leads.forEach((lead) => {
      counts[lead.estado] += 1
    })
    return counts
  }, [state.leads])

  const activeQuoteAmount = useMemo(
    () =>
      state.quotes
        .filter((quote) => quote.estado !== 'rechazada')
        .reduce((sum, quote) => sum + quote.monto, 0),
    [state.quotes],
  )

  const upcomingLeads = useMemo(() => {
    const today = new Date(`${todayIso}T00:00:00`)
    const limit = new Date(today)
    limit.setDate(limit.getDate() + 7)

    return state.leads
      .filter((lead) => lead.estado !== 'cerrado' && lead.nextActivity)
      .filter((lead) => {
        const due = new Date(`${lead.nextActivity}T00:00:00`)
        return !Number.isNaN(due.getTime()) && due <= limit
      })
      .sort((left, right) => left.nextActivity.localeCompare(right.nextActivity))
  }, [state.leads])

  const dashboardAlerts = useMemo(() => {
    const staleLeads = state.leads.filter((lead) => lead.estado !== 'cerrado' && !lead.nextActivity)
    const staleQuotes = state.quotes.filter((quote) => {
      const updated = new Date(`${quote.updatedAt || quote.fecha}T00:00:00`)
      if (Number.isNaN(updated.getTime())) return false
      const diffDays = (Date.parse(`${todayIso}T00:00:00`) - updated.getTime()) / (1000 * 60 * 60 * 24)
      return diffDays > 14 && quote.estado !== 'aceptada'
    })

    return {
      staleLeads,
      staleQuotes,
    }
  }, [state.leads, state.quotes])

  const notifications = useMemo<NotificationItem[]>(() => {
    const items: NotificationItem[] = []

    if (dashboardAlerts.staleLeads.length > 0) {
      items.push({
        id: 'n-1',
        title: `${dashboardAlerts.staleLeads.length} leads sin seguimiento`,
        detail: 'Revisa leads sin próxima actividad o sin actualización reciente.',
        level: 'alta',
        due: 'Hoy',
      })
    }

    if (dashboardAlerts.staleQuotes.length > 0) {
      items.push({
        id: 'n-2',
        title: `${dashboardAlerts.staleQuotes.length} cotizaciones sin actualizar`,
        detail: 'Hay propuestas que superaron 14 días sin movimiento.',
        level: 'media',
        due: 'Esta semana',
      })
    }

    const todayTasks = upcomingLeads.filter((lead) => lead.nextActivity === todayIso).length
    if (todayTasks > 0) {
      items.push({
        id: 'n-3',
        title: `${todayTasks} tareas para hoy`,
        detail: 'Llamadas, reuniones o envios que vencen hoy.',
        level: 'alta',
        due: 'Hoy',
      })
    }

    return items
  }, [dashboardAlerts.staleLeads.length, dashboardAlerts.staleQuotes.length, upcomingLeads])

  const searchResults = useMemo(() => {
    if (!lookup) {
      return {
        organizations: state.organizations,
        contacts: state.contacts,
        leads: state.leads,
        quotes: state.quotes,
      }
    }

    const organizations = state.organizations.filter((org) => {
      const haystack = [org.nombre, org.nombreLegal, org.ruc, org.sector, org.ubicacion, org.direccion].join(' ')
      return normalize(haystack).includes(lookup)
    })

    const contacts = state.contacts.filter((contact) => {
      const org = state.organizations.find((item) => item.id === contact.orgId)
      const haystack = [contact.nombre, contact.apellidos, contact.cargo, contact.email, contact.telefono, org?.nombre ?? '', org?.ruc ?? ''].join(' ')
      return normalize(haystack).includes(lookup)
    })

    const leads = state.leads.filter((lead) => {
      const contact = state.contacts.find((item) => item.id === lead.contactoId)
      const org = state.organizations.find((item) => item.id === lead.orgId)
      const haystack = [lead.servicio, lead.encargado, lead.historial, lead.challenge, lead.nextActivity, contact?.nombre ?? '', contact?.apellidos ?? '', org?.nombre ?? ''].join(' ')
      return normalize(haystack).includes(lookup)
    })

    const quotes = state.quotes.filter((quote) => {
      const lead = state.leads.find((item) => item.id === quote.leadId)
      const org = state.organizations.find((item) => item.id === quote.orgId)
      const haystack = [quote.cliente, quote.servicio, quote.estado, quote.documento, lead?.id ?? '', org?.nombre ?? ''].join(' ')
      return normalize(haystack).includes(lookup)
    })

    return { organizations, contacts, leads, quotes }
  }, [lookup, state.contacts, state.leads, state.organizations, state.quotes])

  const orgContacts = useMemo(
    () => state.contacts.filter((contact) => contact.orgId === selectedOrganization?.id),
    [selectedOrganization?.id, state.contacts],
  )
  const orgLeads = useMemo(
    () => state.leads.filter((lead) => lead.orgId === selectedOrganization?.id),
    [selectedOrganization?.id, state.leads],
  )
  const orgQuotes = useMemo(
    () => state.quotes.filter((quote) => quote.orgId === selectedOrganization?.id),
    [selectedOrganization?.id, state.quotes],
  )

  const selectedLeadContact = selectedLead ? state.contacts.find((item) => item.id === selectedLead.contactoId) ?? null : null
  const selectedLeadOrg = selectedLead ? state.organizations.find((item) => item.id === selectedLead.orgId) ?? null : null
  const selectedQuoteLead = selectedQuote ? state.leads.find((item) => item.id === selectedQuote.leadId) ?? null : null
  const selectedQuoteContact = selectedQuote ? state.contacts.find((item) => item.id === selectedQuote.contactoId) ?? null : null
  const selectedQuoteOrg = selectedQuote ? state.organizations.find((item) => item.id === selectedQuote.orgId) ?? null : null

  function navigate(nextView: View) {
    setView(nextView)
    setMenuOpen(false)
  }

  function resetOrganizationDraft(org?: Organization) {
    setOrganizationDraft(createOrganizationDraft(org))
  }

  function resetQuoteDraft(quote?: Quote) {
    setQuoteDraft(createQuoteDraft(quote))
  }

  function openOrganizationDetail(id: string) {
    setSelectedOrganizationId(id)
    setView('organization')
  }

  function openContactDetail(id: string) {
    setSelectedContactId(id)
    setView('contact')
  }

  function openLeadDetail(id: string) {
    setSelectedLeadId(id)
    setView('lead')
  }

  function openQuoteDetail(id: string) {
    setSelectedQuoteId(id)
    setView('quote')
  }

  function fillOrganizationFromRuc(ruc: string) {
    const match = sunatDirectory.find((item) => item.ruc === ruc.trim())
    if (!match) return

    setOrganizationDraft((current) => ({
      ...current,
      ruc: match.ruc,
      nombre: match.nombre,
      nombreLegal: match.nombreLegal,
      sector: match.sector,
      ubicacion: match.ubicacion,
      direccion: match.direccion,
      tipo: match.tipo,
      tamano: match.tamano,
      alianzas: match.alianzas,
      actividades: match.actividades,
      linkedin: match.linkedin,
      estadoComercial: current.estadoComercial || 'Lead activo',
    }))
  }

  function openOrganizationForm(org?: Organization) {
    resetOrganizationDraft(org)
    navigate('organization-form')
  }

  function openContactForm(contact?: Contact, orgHintId?: string) {
    const nextDraft = createContactDraft(contact)
    if (!contact && orgHintId) {
      const org = state.organizations.find((item) => item.id === orgHintId)
      if (org) {
        nextDraft.orgId = org.id
        nextDraft.orgQuery = `${org.nombre} - ${org.ruc}`
      }
    }
    setContactDraft(nextDraft)
    navigate('contact-form')
  }

  function openLeadForm(contactId?: string, orgId?: string) {
    const nextDraft = createLeadDraft()
    if (contactId) nextDraft.contactoId = contactId
    if (orgId && !contactId) {
      const contact = state.contacts.find((item) => item.orgId === orgId)
      if (contact) nextDraft.contactoId = contact.id
    }
    setLeadDraft(nextDraft)
    navigate('pipeline')
  }

  function createQuoteFromLead(lead: Lead) {
    const nextQuote: Quote = {
      id: nextId('cot'),
      leadId: lead.id,
      cliente: selectedLeadOrg?.nombre ?? '',
      monto: 0,
      moneda: 'PEN',
      estado: 'borrador',
      fecha: todayIso,
      servicio: lead.servicio,
      documento: '',
      contactoId: lead.contactoId,
      orgId: lead.orgId,
      updatedAt: todayIso,
    }

    setState((current) => ({
      ...current,
      quotes: [nextQuote, ...current.quotes],
    }))
    setSelectedQuoteId(nextQuote.id)
    resetQuoteDraft(nextQuote)
    navigate('quote')
  }

  function saveOrganization() {
    if (!organizationDraft.ruc || !organizationDraft.nombre || !organizationDraft.nombreLegal) return

    const payload: Organization = {
      id: organizationDraft.id ?? nextId('org'),
      ruc: organizationDraft.ruc,
      nombre: organizationDraft.nombre,
      nombreLegal: organizationDraft.nombreLegal,
      sector: organizationDraft.sector,
      ubicacion: organizationDraft.ubicacion,
      direccion: organizationDraft.direccion,
      estadoComercial: organizationDraft.estadoComercial,
      tipo: organizationDraft.tipo,
      tamano: organizationDraft.tamano,
      alianzas: organizationDraft.alianzas,
      actividades: organizationDraft.actividades,
      linkedin: organizationDraft.linkedin,
    }

    setState((current) => {
      const exists = current.organizations.some((item) => item.id === payload.id)
      return {
        ...current,
        organizations: exists
          ? current.organizations.map((item) => (item.id === payload.id ? payload : item))
          : [payload, ...current.organizations],
      }
    })
    setSelectedOrganizationId(payload.id)
    navigate('organization')
  }

  function saveContact() {
    const org = state.organizations.find((item) => item.id === contactDraft.orgId)
    if (!org) return
    if (!contactDraft.nombre || !contactDraft.apellidos || !contactDraft.email) return

    const payload: Contact = {
      id: contactDraft.id ?? nextId('con'),
      orgId: org.id,
      nombre: contactDraft.nombre,
      apellidos: contactDraft.apellidos,
      cargo: contactDraft.cargo,
      email: contactDraft.email,
      telefono: contactDraft.telefono,
      estado: contactDraft.estado,
      notes: contactDraft.notes,
      timeline: contactDraft.id
        ? state.contacts.find((item) => item.id === contactDraft.id)?.timeline ?? []
        : [
            {
              id: nextId('tl'),
              type: 'Nota',
              date: todayIso,
              title: 'Contacto creado',
              result: 'Registro inicial en BioActvia.',
            },
          ],
    }

    setState((current) => {
      const exists = current.contacts.some((item) => item.id === payload.id)
      return {
        ...current,
        contacts: exists ? current.contacts.map((item) => (item.id === payload.id ? payload : item)) : [payload, ...current.contacts],
      }
    })

    setSelectedContactId(payload.id)
    setSelectedOrganizationId(org.id)
    navigate('contact')
  }

  function saveLead() {
    const contact = state.contacts.find((item) => item.id === leadDraft.contactoId)
    if (!contact) return

    const org = state.organizations.find((item) => item.id === contact.orgId)
    if (!org) return

    const payload: Lead = {
      id: nextId('lead'),
      contactoId: contact.id,
      orgId: org.id,
      servicio: leadDraft.servicio || 'Servicio pendiente',
      encargado: leadDraft.encargado || 'BioActvia',
      estado: leadDraft.estado,
      nextActivity: leadDraft.nextActivity,
      closeDate: leadDraft.closeDate,
      challenge: leadDraft.challenge,
      historial: 'Lead creado desde la app en React.',
      activities: [],
    }

    setState((current) => ({
      ...current,
      leads: [payload, ...current.leads],
    }))
    setSelectedLeadId(payload.id)
    navigate('lead')
  }

  function updateLeadField(id: string, field: keyof Lead, value: string) {
    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) => (lead.id === id ? { ...lead, [field]: value } : lead)),
    }))
  }

  function addLeadActivity() {
    if (!selectedLead) return
    if (!leadActivityNotes.trim() && !leadActivityResult.trim()) return

    const entry: LeadActivity = {
      id: nextId('act'),
      type: leadActivityType,
      date: leadActivityDate,
      notes: leadActivityNotes.trim(),
      result: leadActivityResult.trim(),
    }

    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) =>
        lead.id === selectedLead.id
          ? {
              ...lead,
              activities: [entry, ...lead.activities],
              historial: [lead.historial, entry.notes, entry.result].filter(Boolean).join(' | '),
              nextActivity: lead.nextActivity || entry.date,
            }
          : lead,
      ),
    }))
    setLeadActivityNotes('')
    setLeadActivityResult('')
    setLeadActivityType('Llamada')
    setLeadActivityDate(todayIso)
  }

  function addContactTimeline() {
    if (!selectedContact) return
    if (!contactTimelineTitle.trim() && !contactTimelineResult.trim()) return

    const entry: ContactTimelineEntry = {
      id: nextId('tl'),
      type: contactTimelineType,
      date: contactTimelineDate,
      title: contactTimelineTitle.trim() || 'Interaccion registrada',
      result: contactTimelineResult.trim(),
    }

    setState((current) => ({
      ...current,
      contacts: current.contacts.map((contact) =>
        contact.id === selectedContact.id
          ? {
              ...contact,
              timeline: [entry, ...contact.timeline],
              notes: [contact.notes, entry.result].filter(Boolean).join(' | '),
            }
          : contact,
      ),
    }))
    setContactTimelineType('Llamada')
    setContactTimelineTitle('')
    setContactTimelineResult('')
    setContactTimelineDate(todayIso)
  }

  function updateQuoteField(field: keyof Quote, value: string) {
    if (!selectedQuote) return

    setState((current) => ({
      ...current,
      quotes: current.quotes.map((quote) =>
        quote.id === selectedQuote.id
          ? {
              ...quote,
              [field]: field === 'monto' ? Number(value || 0) : value,
              updatedAt: todayIso,
            }
          : quote,
      ),
    }))
  }

  async function handleBulkUpload(file?: File) {
    if (!file) return

    const name = file.name.toLowerCase()
    let rows: string[][] = []

    if (name.endsWith('.xlsx') || name.endsWith('.xls')) {
      const buffer = await file.arrayBuffer()
      const workbook = XLSX.read(buffer, { type: 'array' })
      const sheet = workbook.Sheets[workbook.SheetNames[0]]
      const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' })
      rows = json.map((record) => Object.values(record).map((value) => String(value ?? '')))
    } else {
      const text = await file.text()
      rows = parseCsv(text)
    }

    if (rows.length === 0) {
      setBulkRows([])
      setBulkFeedback('El archivo no contiene filas interpretables.')
      return
    }

    const headers = rows[0].map((item) => normalize(item))
    const dataRows = rows.slice(1)
    const parsed: BulkRow[] = dataRows.map((row, index) => {
      const cells = Object.fromEntries(headers.map((header, cellIndex) => [header, row[cellIndex] ?? '']))
      const ruc = String(cells.ruc ?? cells.documento ?? '').trim()
      const email = String(cells.email ?? cells.correo ?? '').trim()
      const nombre = String(cells.nombre ?? cells.contacto ?? cells.cliente ?? '').trim()
      const org = String(cells.organizacion ?? cells.empresa ?? cells.razonsocial ?? '').trim()
      const status = String(cells.estado ?? cells.status ?? '').trim()

      const orgExact = state.organizations.find((item) => normalize(item.ruc) === normalize(ruc) || normalize(item.nombreLegal) === normalize(org) || normalize(item.nombre) === normalize(org))
      const contactExact = state.contacts.find((item) => normalize(item.email) === normalize(email) || normalize(`${item.nombre} ${item.apellidos}`) === normalize(nombre))

      return {
        key: `${file.name}-${index}`,
        type: ruc || org ? 'organization' : email ? 'contact' : 'lead',
        name: nombre || org || 'Sin nombre',
        org,
        ruc,
        email,
        status,
        match: orgExact || contactExact ? 'exacto' : isNearMatch(nombre || org, selectedOrganization?.nombre ?? '') ? 'similar' : 'nuevo',
      }
    })

    setBulkRows(parsed)
    setBulkFeedback(`Se detectaron ${parsed.length} filas. Puedes decidir si crear, actualizar o ignorar duplicados.`)
  }

  function applyBulkImport() {
    if (bulkRows.length === 0) return

    setState((current) => {
      const nextState = JSON.parse(JSON.stringify(current)) as CRMState

      bulkRows.forEach((row) => {
        if (row.type === 'organization') {
          const match = nextState.organizations.find((item) => normalize(item.ruc) === normalize(row.ruc) || normalize(item.nombre) === normalize(row.name) || normalize(item.nombreLegal) === normalize(row.org))
          if (match && bulkMode === 'actualizar') {
            match.estadoComercial = row.status || match.estadoComercial
          } else if (!match && bulkMode !== 'ignorar') {
            nextState.organizations.unshift({
              id: nextId('org'),
              ruc: row.ruc || `20${String(nextState.organizations.length + 1).padStart(9, '0')}`.slice(0, 11),
              nombre: row.name,
              nombreLegal: row.org || row.name,
              sector: 'Pendiente',
              ubicacion: 'Pendiente',
              direccion: 'Pendiente',
              estadoComercial: row.status || 'Lead activo',
              tipo: 'Sin clasificar',
              tamano: 'Pendiente',
              alianzas: '',
              actividades: '',
              linkedin: '',
            })
          }
        }

        if (row.type === 'contact') {
          const match = nextState.contacts.find((item) => normalize(item.email) === normalize(row.email) || normalize(`${item.nombre} ${item.apellidos}`) === normalize(row.name))
          if (match && bulkMode === 'actualizar') {
            match.estado = row.status === 'cliente' ? 'cliente' : match.estado
          } else if (!match && bulkMode !== 'ignorar') {
            const org = nextState.organizations[0]
            if (org) {
              nextState.contacts.unshift({
                id: nextId('con'),
                orgId: org.id,
                nombre: row.name.split(' ')[0] || 'Contacto',
                apellidos: row.name.split(' ').slice(1).join(' ') || 'Importado',
                cargo: 'Importado',
                email: row.email || `importado-${nextId('mail')}@bioactvia.pe`,
                telefono: '',
                estado: 'lead activo',
                notes: 'Importado desde carga masiva.',
                timeline: [
                  {
                    id: nextId('tl'),
                    type: 'Nota',
                    date: todayIso,
                    title: 'Importado',
                    result: 'Registro creado desde archivo.',
                  },
                ],
              })
            }
          }
        }
      })

      return nextState
    })

    setBulkFeedback('Carga procesada. Los duplicados exactos quedaron listos para actualización según el modo elegido.')
    navigate('organization')
  }

  function changeLeadStatus(leadId: string, nextStatus: LeadState) {
    setState((current) => ({
      ...current,
      leads: current.leads.map((lead) => (lead.id === leadId ? { ...lead, estado: nextStatus } : lead)),
    }))
  }

  function changeQuoteStatus(nextStatus: QuoteState) {
    if (!selectedQuote) return
    setState((current) => ({
      ...current,
      quotes: current.quotes.map((quote) =>
        quote.id === selectedQuote.id ? { ...quote, estado: nextStatus, updatedAt: todayIso } : quote,
      ),
    }))
  }

  function renderNavButton(section: View, label: string, detail: string) {
    return (
      <button
        type="button"
        className={`side-btn ${view === section ? 'active' : ''}`}
        onClick={() => navigate(section)}
      >
        <span className="side-ico">{label.slice(0, 1)}</span>
        <span>
          <strong>{label}</strong>
          <small>{detail}</small>
        </span>
      </button>
    )
  }

  function renderSectionTitle(title: string, subtitle: string, action?: ReactNode) {
    return (
      <div className="section-head">
        <div>
          <p className="eyebrow">BioActvia</p>
          <h1>{title}</h1>
          <p className="lead-copy">{subtitle}</p>
        </div>
        {action ? <div className="section-head-action">{action}</div> : null}
      </div>
    )
  }

  function renderDashboard() {
    const leadActivityMap = {
      nuevo: pipelineCounts.nuevo,
      contacto: pipelineCounts.contacto,
      propuesta: pipelineCounts.propuesta,
      cerrado: pipelineCounts.cerrado,
    }

    return (
      <section className="view-grid">
        {renderSectionTitle(
          'Dashboard comercial',
          'Visibilidad inmediata del pipeline, las tareas cercanas y las alertas operativas sin depender de tablas manuales.',
          <button type="button" className="primary-btn" onClick={() => navigate('search')}>
            Buscar en todo BioActvia
          </button>,
        )}

        <div className="kpi-grid">
          <article className="glass-card kpi-card">
            <span>Leads activos</span>
            <strong>{state.leads.filter((lead) => lead.estado !== 'cerrado').length}</strong>
            <small>Pipeline abierto</small>
          </article>
          <article className="glass-card kpi-card">
            <span>Cotizaciones activas</span>
            <strong>{formatMoney(activeQuoteAmount)}</strong>
            <small>Incluye enviadas y aceptadas</small>
          </article>
          <article className="glass-card kpi-card">
            <span>Actividades hoy</span>
            <strong>{upcomingLeads.filter((lead) => lead.nextActivity === todayIso).length}</strong>
            <small>Seguimientos inmediatos</small>
          </article>
          <article className="glass-card kpi-card">
            <span>Alertas</span>
            <strong>{dashboardAlerts.staleLeads.length + dashboardAlerts.staleQuotes.length}</strong>
            <small>Sin seguimiento o sin actualización</small>
          </article>
        </div>

        <div className="dashboard-grid">
          <article className="glass-card panel-card">
            <div className="card-head">
              <div>
                <h2>Pipeline resumido</h2>
                <p>Estado comercial por etapa.</p>
              </div>
            </div>
            <div className="bar-chart">
              {leadColumns.map((column) => {
                const count = leadActivityMap[column.key]
                const max = Math.max(...Object.values(leadActivityMap), 1)
                const height = Math.max(18, (count / max) * 100)
                return (
                  <button
                    key={column.key}
                    type="button"
                    className="bar-item"
                    onClick={() => {
                      navigate('pipeline')
                    }}
                  >
                    <span className="bar-track">
                      <span className="bar-fill" style={{ height: `${height}%` }} />
                    </span>
                    <strong>{count}</strong>
                    <small>{column.label}</small>
                  </button>
                )
              })}
            </div>
          </article>

          <article className="glass-card panel-card">
            <div className="card-head">
              <div>
                <h2>Actividades próximas</h2>
                <p>Hoy y esta semana.</p>
              </div>
            </div>
            <div className="agenda-list">
              {upcomingLeads.length > 0 ? (
                upcomingLeads.slice(0, 5).map((lead) => {
                  const contact = state.contacts.find((item) => item.id === lead.contactoId)
                  const org = state.organizations.find((item) => item.id === lead.orgId)
                  return (
                    <button key={lead.id} type="button" className="agenda-item" onClick={() => openLeadDetail(lead.id)}>
                      <strong>{contact ? `${contact.nombre} ${contact.apellidos}` : 'Sin contacto'}</strong>
                      <span>{org?.nombre ?? 'Sin organizacion'} · {lead.servicio}</span>
                      <small>{formatDate(lead.nextActivity)}</small>
                    </button>
                  )
                })
              ) : (
                <div className="empty-state">No hay actividades pendientes para los proximos 7 dias.</div>
              )}
            </div>
          </article>

          <article className="glass-card panel-card">
            <div className="card-head">
              <div>
                <h2>Alertas operativas</h2>
                <p>Leads sin seguimiento y cotizaciones sin actualizar.</p>
              </div>
            </div>
            <div className="stack-list">
              {notifications.length > 0 ? (
                notifications.map((item) => (
                  <div key={item.id} className={`notice notice-${item.level}`}>
                    <strong>{item.title}</strong>
                    <span>{item.detail}</span>
                    <small>{item.due}</small>
                  </div>
                ))
              ) : (
                <div className="empty-state">No hay alertas activas ahora mismo.</div>
              )}
            </div>
          </article>
        </div>
      </section>
    )
  }

  function renderSearchView() {
    return (
      <section className="view-grid">
        {renderSectionTitle('Buscador global', 'Spotlight central para encontrar organizaciones, contactos, leads y cotizaciones sin saltar entre hojas.')}

        <article className="glass-card spotlight-card">
          <label className="search-label" htmlFor="global-search">Buscar por nombre, RUC o correo</label>
          <input
            id="global-search"
            className="spotlight-input"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Escribe para buscar en toda la base de BioActvia"
          />
          <div className="search-hints">
            <span>Nombre</span>
            <span>RUC</span>
            <span>Correo</span>
            <span>Acceso directo al detalle</span>
          </div>
        </article>

        <div className="result-grid">
          <article className="glass-card result-card">
            <div className="card-head">
              <div>
                <h2>Organizaciones</h2>
                <p>{searchResults.organizations.length} resultados</p>
              </div>
            </div>
            <div className="result-list">
              {searchResults.organizations.map((org) => (
                <button key={org.id} type="button" className="result-item" onClick={() => openOrganizationDetail(org.id)}>
                  <strong>{org.nombre}</strong>
                  <span>{org.ruc} · {org.sector}</span>
                  <small>{org.ubicacion}</small>
                </button>
              ))}
            </div>
          </article>

          <article className="glass-card result-card">
            <div className="card-head">
              <div>
                <h2>Contactos</h2>
                <p>{searchResults.contacts.length} resultados</p>
              </div>
            </div>
            <div className="result-list">
              {searchResults.contacts.map((contact) => {
                const org = state.organizations.find((item) => item.id === contact.orgId)
                return (
                  <button key={contact.id} type="button" className="result-item" onClick={() => openContactDetail(contact.id)}>
                    <strong>{contact.nombre} {contact.apellidos}</strong>
                    <span>{contact.email}</span>
                    <small>{org?.nombre ?? 'Sin organizacion'} · {contact.cargo}</small>
                  </button>
                )
              })}
            </div>
          </article>

          <article className="glass-card result-card">
            <div className="card-head">
              <div>
                <h2>Leads</h2>
                <p>{searchResults.leads.length} resultados</p>
              </div>
            </div>
            <div className="result-list">
              {searchResults.leads.map((lead) => {
                const contact = state.contacts.find((item) => item.id === lead.contactoId)
                const org = state.organizations.find((item) => item.id === lead.orgId)
                return (
                  <button key={lead.id} type="button" className="result-item" onClick={() => openLeadDetail(lead.id)}>
                    <strong>{contact ? `${contact.nombre} ${contact.apellidos}` : lead.id}</strong>
                    <span>{org?.nombre ?? 'Sin organizacion'} · {lead.servicio}</span>
                    <small>{formatDate(lead.nextActivity)}</small>
                  </button>
                )
              })}
            </div>
          </article>

          <article className="glass-card result-card">
            <div className="card-head">
              <div>
                <h2>Cotizaciones</h2>
                <p>{searchResults.quotes.length} resultados</p>
              </div>
            </div>
            <div className="result-list">
              {searchResults.quotes.map((quote) => (
                <button key={quote.id} type="button" className="result-item" onClick={() => openQuoteDetail(quote.id)}>
                  <strong>{quote.cliente}</strong>
                  <span>{formatMoney(quote.monto, quote.moneda)} · {quote.estado}</span>
                  <small>{formatDate(quote.fecha)}</small>
                </button>
              ))}
            </div>
          </article>
        </div>
      </section>
    )
  }

  function renderOrganizationDetail() {
    if (!selectedOrganization) {
      return (
        <section className="view-grid">
          {renderSectionTitle('Vista de organización', 'Selecciona una empresa para centralizar contactos, leads y cotizaciones.')}
          <div className="empty-state">No hay una organizacion seleccionada.</div>
        </section>
      )
    }

    return (
      <section className="view-grid">
        {renderSectionTitle(
          'Detalle de organización',
          'Toda la relación comercial gira alrededor del RUC y la identidad de la empresa.',
          <div className="button-row">
            <button type="button" className="secondary-btn" onClick={() => openContactForm(undefined, selectedOrganization.id)}>
              Crear contacto
            </button>
            <button type="button" className="primary-btn" onClick={() => openLeadForm(undefined, selectedOrganization.id)}>
              Crear lead
            </button>
            <button type="button" className="ghost-btn" onClick={() => openOrganizationForm(selectedOrganization)}>
              Editar organización
            </button>
          </div>,
        )}

        <div className="detail-hero glass-card">
          <div>
            <p className="eyebrow">RUC {selectedOrganization.ruc}</p>
            <h2>{selectedOrganization.nombre}</h2>
            <p>{selectedOrganization.nombreLegal}</p>
          </div>
          <div className="meta-grid">
            <div>
              <span>Sector</span>
              <strong>{selectedOrganization.sector}</strong>
            </div>
            <div>
              <span>Ubicacion</span>
              <strong>{selectedOrganization.ubicacion}</strong>
            </div>
            <div>
              <span>Estado comercial</span>
              <strong>{selectedOrganization.estadoComercial}</strong>
            </div>
            <div>
              <span>Tamano</span>
              <strong>{selectedOrganization.tamano}</strong>
            </div>
          </div>
        </div>

        <div className="tab-row">
          {(['contactos', 'leads', 'cotizaciones'] as const).map((tab) => (
            <button key={tab} type="button" className={`tab-btn ${orgTab === tab ? 'active' : ''}`} onClick={() => setOrgTab(tab)}>
              {tab}
            </button>
          ))}
        </div>

        {orgTab === 'contactos' ? (
          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Contactos asociados</h2>
              <p>{orgContacts.length} registros</p>
            </div>
            <div className="stack-list">
              {orgContacts.map((contact) => (
                <button key={contact.id} type="button" className="list-row" onClick={() => openContactDetail(contact.id)}>
                  <strong>{contact.nombre} {contact.apellidos}</strong>
                  <span>{contact.cargo}</span>
                  <small>{contact.email}</small>
                </button>
              ))}
            </div>
          </article>
        ) : null}

        {orgTab === 'leads' ? (
          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Leads vinculados</h2>
              <p>{orgLeads.length} registros</p>
            </div>
            <div className="stack-list">
              {orgLeads.map((lead) => {
                const contact = state.contacts.find((item) => item.id === lead.contactoId)
                return (
                  <button key={lead.id} type="button" className="list-row" onClick={() => openLeadDetail(lead.id)}>
                    <strong>{contact ? `${contact.nombre} ${contact.apellidos}` : lead.id}</strong>
                    <span>{lead.servicio}</span>
                    <small>{lead.estado} · {formatDate(lead.nextActivity)}</small>
                  </button>
                )
              })}
            </div>
          </article>
        ) : null}

        {orgTab === 'cotizaciones' ? (
          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Cotizaciones generadas</h2>
              <p>{orgQuotes.length} registros</p>
            </div>
            <div className="stack-list">
              {orgQuotes.map((quote) => (
                <button key={quote.id} type="button" className="list-row" onClick={() => openQuoteDetail(quote.id)}>
                  <strong>{formatMoney(quote.monto, quote.moneda)}</strong>
                  <span>{quote.estado}</span>
                  <small>{formatDate(quote.fecha)}</small>
                </button>
              ))}
            </div>
          </article>
        ) : null}
      </section>
    )
  }

  function renderContactDetail() {
    if (!selectedContact) {
      return (
        <section className="view-grid">
          {renderSectionTitle('Detalle de contacto', 'Selecciona un contacto para ver su timeline estructurado.')}
          <div className="empty-state">No hay un contacto seleccionado.</div>
        </section>
      )
    }

    const org = state.organizations.find((item) => item.id === selectedContact.orgId)

    return (
      <section className="view-grid">
        {renderSectionTitle(
          'Detalle de contacto',
          'El historial narrativo se convierte en una linea de tiempo filtrable y accionable.',
          <div className="button-row">
            <button type="button" className="secondary-btn" onClick={() => openLeadForm(selectedContact.id)}>
              Crear lead
            </button>
            <button type="button" className="primary-btn" onClick={() => openContactForm(selectedContact)}>
              Editar contacto
            </button>
          </div>,
        )}

        <div className="detail-hero glass-card">
          <div>
            <p className="eyebrow">{selectedContact.estado}</p>
            <h2>{selectedContact.nombre} {selectedContact.apellidos}</h2>
            <p>{selectedContact.cargo} · {org?.nombre ?? 'Sin organizacion'}</p>
          </div>
          <div className="meta-grid">
            <div>
              <span>Correo</span>
              <strong>{selectedContact.email}</strong>
            </div>
            <div>
              <span>Telefono</span>
              <strong>{selectedContact.telefono || 'Sin telefono'}</strong>
            </div>
            <div>
              <span>Organizacion</span>
              <strong>{org?.nombre ?? 'Sin organizacion'}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{selectedContact.estado}</strong>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Timeline</h2>
              <p>Actividades, cambios de estado y notas.</p>
            </div>
            <div className="timeline">
              {selectedContact.timeline.length > 0 ? (
                selectedContact.timeline.map((entry) => (
                  <div key={entry.id} className="timeline-item">
                    <span className="timeline-dot" />
                    <div>
                      <strong>{entry.type} · {entry.title}</strong>
                      <p>{entry.result}</p>
                      <small>{formatDate(entry.date)}</small>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">Todavia no hay movimientos registrados.</div>
              )}
            </div>
          </article>

          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Registrar interaccion</h2>
              <p>La bitacora queda estructurada, no en texto libre suelto.</p>
            </div>
            <div className="form-stack compact">
              <label>
                Tipo de actividad
                <select value={contactTimelineType} onChange={(event) => setContactTimelineType(event.target.value as ContactTimelineEntry['type'])}>
                  <option value="Llamada">Llamada</option>
                  <option value="Reunion">Reunion</option>
                  <option value="Email">Email</option>
                  <option value="Nota">Nota</option>
                  <option value="Estado">Estado</option>
                </select>
              </label>
              <label>
                Fecha
                <input type="date" value={contactTimelineDate} onChange={(event) => setContactTimelineDate(event.target.value)} />
              </label>
              <label>
                Titulo
                <input value={contactTimelineTitle} onChange={(event) => setContactTimelineTitle(event.target.value)} placeholder="Ej. Llamada de seguimiento" />
              </label>
              <label>
                Resultado
                <textarea value={contactTimelineResult} onChange={(event) => setContactTimelineResult(event.target.value)} placeholder="Que ocurrio y cual es el siguiente paso" />
              </label>
              <button type="button" className="primary-btn" onClick={addContactTimeline}>
                Registrar interaccion
              </button>
            </div>
          </article>
        </div>
      </section>
    )
  }

  function renderContactForm() {
    const matchingOrg = state.organizations.find(
      (org) => normalize(org.nombre) === normalize(contactDraft.orgQuery) || normalize(org.ruc) === normalize(contactDraft.orgQuery) || org.id === contactDraft.orgId,
    )
    const duplicateEmail = state.contacts.find((item) => item.email.toLowerCase() === contactDraft.email.toLowerCase() && item.id !== contactDraft.id)
    const similarName = state.contacts.find((item) => {
      if (item.id === contactDraft.id) return false
      return isNearMatch(`${item.nombre} ${item.apellidos}`, `${contactDraft.nombre} ${contactDraft.apellidos}`)
    })

    return (
      <section className="view-grid">
        {renderSectionTitle('Crear o editar contacto', 'Autocompletado por organizacion, deteccion de duplicados en vivo y guardado directo en la base maestra.')}

        <article className="glass-card form-card">
          <div className="form-grid two-cols">
            <label>
              Nombre
              <input value={contactDraft.nombre} onChange={(event) => setContactDraft((current) => ({ ...current, nombre: event.target.value }))} />
            </label>
            <label>
              Apellidos
              <input value={contactDraft.apellidos} onChange={(event) => setContactDraft((current) => ({ ...current, apellidos: event.target.value }))} />
            </label>
            <label>
              Email
              <input value={contactDraft.email} onChange={(event) => setContactDraft((current) => ({ ...current, email: event.target.value }))} />
            </label>
            <label>
              Cargo
              <input value={contactDraft.cargo} onChange={(event) => setContactDraft((current) => ({ ...current, cargo: event.target.value }))} />
            </label>
            <label>
              Telefono
              <input value={contactDraft.telefono} onChange={(event) => setContactDraft((current) => ({ ...current, telefono: event.target.value }))} />
            </label>
            <label>
              Estado
              <select value={contactDraft.estado} onChange={(event) => setContactDraft((current) => ({ ...current, estado: event.target.value as Contact['estado'] }))}>
                <option value="lead activo">Lead activo</option>
                <option value="cliente">Cliente</option>
                <option value="inactivo">Inactivo</option>
              </select>
            </label>
          </div>

          <label>
            Organizacion por RUC o nombre
            <input
              list="org-options"
              value={contactDraft.orgQuery}
              onChange={(event) => {
                const value = event.target.value
                const match = state.organizations.find((org) => normalize(org.ruc) === normalize(value) || normalize(org.nombre) === normalize(value) || normalize(org.nombreLegal) === normalize(value))
                setContactDraft((current) => ({
                  ...current,
                  orgQuery: value,
                  orgId: match?.id ?? '',
                }))
              }}
              placeholder="Escribe el RUC o el nombre de la organizacion"
            />
            <datalist id="org-options">
              {state.organizations.map((org) => (
                <option key={org.id} value={`${org.nombre} - ${org.ruc}`} />
              ))}
            </datalist>
          </label>

          <label>
            Notas
            <textarea value={contactDraft.notes} onChange={(event) => setContactDraft((current) => ({ ...current, notes: event.target.value }))} />
          </label>

          <div className="inline-notice">
            {duplicateEmail ? <span>Este correo ya existe en {duplicateEmail.nombre} {duplicateEmail.apellidos}.</span> : <span>Correo disponible.</span>}
            {similarName ? <span>Este nombre es similar a {similarName.nombre} {similarName.apellidos}.</span> : <span>No se detectaron coincidencias similares.</span>}
            {matchingOrg ? <span>Organizacion detectada: {matchingOrg.nombre}.</span> : <span>Selecciona una organizacion existente.</span>}
          </div>

          <div className="button-row">
            <button type="button" className="ghost-btn" onClick={() => navigate('contact')}>
              Volver al detalle
            </button>
            <button type="button" className="primary-btn" onClick={saveContact} disabled={!matchingOrg}>
              Guardar contacto
            </button>
          </div>
        </article>
      </section>
    )
  }

  function renderOrganizationForm() {
    const duplicateRuc = state.organizations.find((item) => normalize(item.ruc) === normalize(organizationDraft.ruc) && item.id !== organizationDraft.id)

    return (
      <section className="view-grid">
        {renderSectionTitle('Crear organización', 'El RUC es la llave maestra. La app simula un autofill tipo SUNAT para reducir fricción manual.')}

        <article className="glass-card form-card">
          <div className="form-grid two-cols">
            <label>
              RUC
              <input
                value={organizationDraft.ruc}
                onChange={(event) => {
                  const value = event.target.value.replace(/\D/g, '').slice(0, 11)
                  setOrganizationDraft((current) => ({ ...current, ruc: value }))
                  if (value.length === 11) fillOrganizationFromRuc(value)
                }}
                placeholder="20600011111"
              />
            </label>
            <label>
              Estado comercial
              <select value={organizationDraft.estadoComercial} onChange={(event) => setOrganizationDraft((current) => ({ ...current, estadoComercial: event.target.value }))}>
                <option value="Lead activo">Lead activo</option>
                <option value="Cliente">Cliente</option>
                <option value="Inactivo">Inactivo</option>
              </select>
            </label>
            <label>
              Nombre comercial
              <input value={organizationDraft.nombre} onChange={(event) => setOrganizationDraft((current) => ({ ...current, nombre: event.target.value }))} />
            </label>
            <label>
              Razon social
              <input value={organizationDraft.nombreLegal} onChange={(event) => setOrganizationDraft((current) => ({ ...current, nombreLegal: event.target.value }))} />
            </label>
            <label>
              Tipo
              <input value={organizationDraft.tipo} onChange={(event) => setOrganizationDraft((current) => ({ ...current, tipo: event.target.value }))} />
            </label>
            <label>
              Tamano
              <input value={organizationDraft.tamano} onChange={(event) => setOrganizationDraft((current) => ({ ...current, tamano: event.target.value }))} />
            </label>
            <label>
              Sector
              <input value={organizationDraft.sector} onChange={(event) => setOrganizationDraft((current) => ({ ...current, sector: event.target.value }))} />
            </label>
            <label>
              Ubicacion
              <input value={organizationDraft.ubicacion} onChange={(event) => setOrganizationDraft((current) => ({ ...current, ubicacion: event.target.value }))} />
            </label>
          </div>

          <div className="form-grid two-cols">
            <label>
              Direccion
              <input value={organizationDraft.direccion} onChange={(event) => setOrganizationDraft((current) => ({ ...current, direccion: event.target.value }))} />
            </label>
            <label>
              LinkedIn
              <input value={organizationDraft.linkedin} onChange={(event) => setOrganizationDraft((current) => ({ ...current, linkedin: event.target.value }))} />
            </label>
          </div>

          <label>
            Alianzas
            <textarea value={organizationDraft.alianzas} onChange={(event) => setOrganizationDraft((current) => ({ ...current, alianzas: event.target.value }))} />
          </label>

          <label>
            Actividades
            <textarea value={organizationDraft.actividades} onChange={(event) => setOrganizationDraft((current) => ({ ...current, actividades: event.target.value }))} />
          </label>

          <div className="inline-notice">
            {duplicateRuc ? <span>Este RUC ya existe en {duplicateRuc.nombre}.</span> : <span>RUC disponible.</span>}
            <span>Al escribir 11 digitos, la app intenta completar los datos desde una tabla SUNAT simulada.</span>
          </div>

          <div className="button-row">
            <button type="button" className="ghost-btn" onClick={() => navigate('organization')}>
              Volver al detalle
            </button>
            <button type="button" className="primary-btn" onClick={saveOrganization} disabled={!!duplicateRuc && organizationDraft.id === null}>
              Guardar organizacion
            </button>
          </div>
        </article>
      </section>
    )
  }

  function renderPipeline() {
    const leadByContact = state.contacts.find((item) => item.id === leadDraft.contactoId)
    const leadByOrg = leadByContact ? state.organizations.find((item) => item.id === leadByContact.orgId) : null

    const columns = leadColumns.map((column) => ({
      ...column,
      items: state.leads.filter((lead) => lead.estado === column.key),
    }))

    return (
      <section className="view-grid">
        {renderSectionTitle('Pipeline comercial', 'Kanban con arrastre para hacer visible el flujo de leads y evitar la hoja oculta de siempre.')}

        <article className="glass-card form-card compact-form">
          <div className="card-head">
            <h2>Nuevo lead</h2>
            <p>Se crea desde un contacto existente y entra directo al pipeline.</p>
          </div>
          <div className="form-grid two-cols">
            <label>
              Contacto
              <select value={leadDraft.contactoId} onChange={(event) => setLeadDraft((current) => ({ ...current, contactoId: event.target.value }))}>
                <option value="">Selecciona un contacto</option>
                {state.contacts.map((contact) => (
                  <option key={contact.id} value={contact.id}>
                    {contact.nombre} {contact.apellidos}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Encargado
              <input value={leadDraft.encargado} onChange={(event) => setLeadDraft((current) => ({ ...current, encargado: event.target.value }))} />
            </label>
            <label>
              Servicio de interes
              <input value={leadDraft.servicio} onChange={(event) => setLeadDraft((current) => ({ ...current, servicio: event.target.value }))} />
            </label>
            <label>
              Estado
              <select value={leadDraft.estado} onChange={(event) => setLeadDraft((current) => ({ ...current, estado: event.target.value as LeadState }))}>
                <option value="nuevo">Nuevo</option>
                <option value="contacto">En contacto</option>
                <option value="propuesta">Propuesta</option>
                <option value="cerrado">Cerrado</option>
              </select>
            </label>
            <label>
              Proxima actividad
              <input type="date" value={leadDraft.nextActivity} onChange={(event) => setLeadDraft((current) => ({ ...current, nextActivity: event.target.value }))} />
            </label>
            <label>
              Fecha estimada de cierre
              <input type="date" value={leadDraft.closeDate} onChange={(event) => setLeadDraft((current) => ({ ...current, closeDate: event.target.value }))} />
            </label>
          </div>
          <label>
            Desafio u oportunidad
            <textarea value={leadDraft.challenge} onChange={(event) => setLeadDraft((current) => ({ ...current, challenge: event.target.value }))} />
          </label>
          <div className="inline-notice">
            <span>{leadByContact ? `Contacto vinculado: ${leadByContact.nombre} ${leadByContact.apellidos}.` : 'Elige un contacto para crear el lead.'}</span>
            <span>{leadByOrg ? `Organizacion: ${leadByOrg.nombre}.` : 'La organizacion se resuelve automaticamente desde el contacto.'}</span>
          </div>
          <button type="button" className="primary-btn" onClick={saveLead} disabled={!leadDraft.contactoId}>
            Crear lead
          </button>
        </article>

        <div className="kanban-grid">
          {columns.map((column) => (
            <div
              key={column.key}
              className="kanban-column"
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                const leadId = event.dataTransfer.getData('text/plain')
                if (leadId) changeLeadStatus(leadId, column.key)
              }}
            >
              <div className="card-head">
                <h2>{column.label}</h2>
                <p>{column.items.length}</p>
              </div>
              <div className="kanban-list">
                {column.items.map((lead) => {
                  const contact = state.contacts.find((item) => item.id === lead.contactoId)
                  const org = state.organizations.find((item) => item.id === lead.orgId)
                  return (
                    <button
                      key={lead.id}
                      type="button"
                      className="lead-card"
                      draggable
                      onDragStart={(event) => event.dataTransfer.setData('text/plain', lead.id)}
                      onClick={() => openLeadDetail(lead.id)}
                    >
                      <strong>{contact ? `${contact.nombre} ${contact.apellidos}` : 'Sin contacto'}</strong>
                      <span>{org?.nombre ?? 'Sin organizacion'}</span>
                      <small>{lead.servicio}</small>
                      <div className="chip-row">
                        <span className="chip">{formatDate(lead.nextActivity)}</span>
                        <span className="chip">{lead.estado}</span>
                      </div>
                    </button>
                  )
                })}
                {column.items.length === 0 ? <div className="empty-state">Arrastra una tarjeta aqui.</div> : null}
              </div>
            </div>
          ))}
        </div>
      </section>
    )
  }

  function renderLeadDetail() {
    if (!selectedLead) {
      return (
        <section className="view-grid">
          {renderSectionTitle('Detalle de lead', 'Selecciona un lead del pipeline para centralizar seguimiento y cotizacion.')}
          <div className="empty-state">No hay un lead seleccionado.</div>
        </section>
      )
    }

    return (
      <section className="view-grid">
        {renderSectionTitle(
          'Detalle de lead',
          'Aqui vive el trabajo diario: estado, proxima actividad, cierre y trazabilidad.',
          <div className="button-row">
            <button type="button" className="secondary-btn" onClick={() => createQuoteFromLead(selectedLead)}>
              Crear cotizacion
            </button>
            <button type="button" className="ghost-btn" onClick={() => openContactDetail(selectedLead.contactoId)}>
              Ver contacto
            </button>
          </div>,
        )}

        <div className="detail-hero glass-card">
          <div>
            <p className="eyebrow">Lead {selectedLead.estado}</p>
            <h2>{selectedLeadContact ? `${selectedLeadContact.nombre} ${selectedLeadContact.apellidos}` : 'Sin contacto'}</h2>
            <p>{selectedLeadOrg?.nombre ?? 'Sin organizacion'} · {selectedLead.servicio}</p>
          </div>
          <div className="meta-grid">
            <div>
              <span>Encargado</span>
              <strong>{selectedLead.encargado}</strong>
            </div>
            <div>
              <span>Proxima actividad</span>
              <strong>{formatDate(selectedLead.nextActivity)}</strong>
            </div>
            <div>
              <span>Cierre estimado</span>
              <strong>{selectedLead.closeDate ? formatDate(selectedLead.closeDate) : 'Sin definir'}</strong>
            </div>
            <div>
              <span>Servicio</span>
              <strong>{selectedLead.servicio}</strong>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Campos editables</h2>
              <p>Actualizacion inmediata del pipeline.</p>
            </div>
            <div className="form-stack compact">
              <label>
                Estado
                <select value={selectedLead.estado} onChange={(event) => changeLeadStatus(selectedLead.id, event.target.value as LeadState)}>
                  <option value="nuevo">Nuevo</option>
                  <option value="contacto">En contacto</option>
                  <option value="propuesta">Propuesta</option>
                  <option value="cerrado">Cerrado</option>
                </select>
              </label>
              <label>
                Proxima actividad
                <input type="date" value={selectedLead.nextActivity} onChange={(event) => updateLeadField(selectedLead.id, 'nextActivity', event.target.value)} />
              </label>
              <label>
                Fecha estimada de cierre
                <input type="date" value={selectedLead.closeDate} onChange={(event) => updateLeadField(selectedLead.id, 'closeDate', event.target.value)} />
              </label>
              <label>
                Desafio u oportunidad
                <textarea value={selectedLead.challenge} onChange={(event) => updateLeadField(selectedLead.id, 'challenge', event.target.value)} />
              </label>
              <label>
                Historial
                <textarea value={selectedLead.historial} onChange={(event) => updateLeadField(selectedLead.id, 'historial', event.target.value)} />
              </label>
            </div>
          </article>

          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Registrar actividad</h2>
              <p>Nuevo modelo estructurado para el historial.</p>
            </div>
            <div className="form-stack compact">
              <label>
                Tipo
                <select value={leadActivityType} onChange={(event) => setLeadActivityType(event.target.value as LeadActivity['type'])}>
                  <option value="Llamada">Llamada</option>
                  <option value="Reunion">Reunion</option>
                  <option value="Email">Email</option>
                  <option value="Seguimiento">Seguimiento</option>
                </select>
              </label>
              <label>
                Fecha
                <input type="date" value={leadActivityDate} onChange={(event) => setLeadActivityDate(event.target.value)} />
              </label>
              <label>
                Notas
                <textarea value={leadActivityNotes} onChange={(event) => setLeadActivityNotes(event.target.value)} />
              </label>
              <label>
                Resultado
                <textarea value={leadActivityResult} onChange={(event) => setLeadActivityResult(event.target.value)} />
              </label>
              <button type="button" className="primary-btn" onClick={addLeadActivity}>
                Registrar actividad
              </button>
            </div>
          </article>
        </div>

        <article className="glass-card list-card">
          <div className="card-head">
            <h2>Timeline del lead</h2>
            <p>Actividades realizadas.</p>
          </div>
          <div className="stack-list">
            {selectedLead.activities.length > 0 ? (
              selectedLead.activities.map((activity) => (
                <div key={activity.id} className="activity-card">
                  <strong>{activity.type}</strong>
                  <span>{activity.notes}</span>
                  <small>{activity.result}</small>
                  <em>{formatDate(activity.date)}</em>
                </div>
              ))
            ) : (
              <div className="empty-state">Todavia no hay actividades registradas.</div>
            )}
          </div>
        </article>
      </section>
    )
  }

  function renderQuotes() {
    const visibleQuotes = state.quotes.filter((quote) => quoteFilter === 'todas' || quote.estado === quoteFilter)

    return (
      <section className="view-grid">
        {renderSectionTitle('Cotizaciones', 'Tabla visible de propuestas para controlar estado, monto y trazabilidad.')}

        <article className="glass-card list-card">
          <div className="toolbar-row">
            <div className="button-row">
              <button type="button" className={`tab-btn ${quoteFilter === 'todas' ? 'active' : ''}`} onClick={() => setQuoteFilter('todas')}>Todas</button>
              <button type="button" className={`tab-btn ${quoteFilter === 'enviada' ? 'active' : ''}`} onClick={() => setQuoteFilter('enviada')}>Enviada</button>
              <button type="button" className={`tab-btn ${quoteFilter === 'aceptada' ? 'active' : ''}`} onClick={() => setQuoteFilter('aceptada')}>Aceptada</button>
              <button type="button" className={`tab-btn ${quoteFilter === 'rechazada' ? 'active' : ''}`} onClick={() => setQuoteFilter('rechazada')}>Rechazada</button>
            </div>
          </div>

          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha</th>
                </tr>
              </thead>
              <tbody>
                {visibleQuotes.map((quote) => (
                  <tr key={quote.id} onClick={() => openQuoteDetail(quote.id)}>
                    <td>{quote.cliente}</td>
                    <td>{formatMoney(quote.monto, quote.moneda)}</td>
                    <td><span className={`chip state-${quote.estado}`}>{quote.estado}</span></td>
                    <td>{formatDate(quote.fecha)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    )
  }

  function renderQuoteDetail() {
    if (!selectedQuote) {
      return (
        <section className="view-grid">
          {renderSectionTitle('Detalle de cotizacion', 'Selecciona una propuesta para ver el monto, estado y relacion comercial.')}
          <div className="empty-state">No hay una cotizacion seleccionada.</div>
        </section>
      )
    }

    return (
      <section className="view-grid">
        {renderSectionTitle(
          'Detalle de cotizacion',
          'Trazabilidad de propuestas con edicion directa y vinculacion al lead, contacto y organizacion.',
          <div className="button-row">
            <button type="button" className="ghost-btn" onClick={() => openLeadDetail(selectedQuote.leadId)}>
              Ver lead
            </button>
            <button type="button" className="primary-btn" onClick={() => updateQuoteField('estado', 'enviada')}>
              Marcar enviada
            </button>
          </div>,
        )}

        <div className="detail-hero glass-card">
          <div>
            <p className="eyebrow">Cotizacion {selectedQuote.estado}</p>
            <h2>{selectedQuote.cliente}</h2>
            <p>{selectedQuote.servicio}</p>
          </div>
          <div className="meta-grid">
            <div>
              <span>Monto</span>
              <strong>{formatMoney(selectedQuote.monto, selectedQuote.moneda)}</strong>
            </div>
            <div>
              <span>Estado</span>
              <strong>{selectedQuote.estado}</strong>
            </div>
            <div>
              <span>Fecha</span>
              <strong>{formatDate(selectedQuote.fecha)}</strong>
            </div>
            <div>
              <span>Actualizado</span>
              <strong>{formatDate(selectedQuote.updatedAt)}</strong>
            </div>
          </div>
        </div>

        <div className="detail-grid">
          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Relacion comercial</h2>
              <p>Lead, contacto y organizacion relacionados.</p>
            </div>
            <div className="stack-list relationship-list">
              <button type="button" className="list-row" onClick={() => openLeadDetail(selectedQuote.leadId)}>
                <strong>Lead asociado</strong>
                <span>{selectedQuoteLead?.servicio ?? 'Sin lead'}</span>
                <small>{selectedQuoteLead?.estado ?? 'Sin estado'}</small>
              </button>
              <button type="button" className="list-row" onClick={() => openContactDetail(selectedQuote.contactoId)}>
                <strong>Contacto</strong>
                <span>{selectedQuoteContact ? `${selectedQuoteContact.nombre} ${selectedQuoteContact.apellidos}` : 'Sin contacto'}</span>
                <small>{selectedQuoteContact?.email ?? ''}</small>
              </button>
              <button type="button" className="list-row" onClick={() => openOrganizationDetail(selectedQuote.orgId)}>
                <strong>Organizacion</strong>
                <span>{selectedQuoteOrg?.nombre ?? 'Sin organizacion'}</span>
                <small>{selectedQuoteOrg?.ruc ?? ''}</small>
              </button>
            </div>
          </article>

          <article className="glass-card list-card">
            <div className="card-head">
              <h2>Edicion rapida</h2>
              <p>Cambiar estado y datos clave.</p>
            </div>
            <div className="form-stack compact">
              <label>
                Cliente
                <input value={selectedQuote.cliente} onChange={(event) => updateQuoteField('cliente', event.target.value)} />
              </label>
              <label>
                Monto
                <input type="number" value={selectedQuote.monto} onChange={(event) => updateQuoteField('monto', event.target.value)} />
              </label>
              <label>
                Moneda
                <input value={selectedQuote.moneda} onChange={(event) => updateQuoteField('moneda', event.target.value)} />
              </label>
              <label>
                Fecha
                <input type="date" value={selectedQuote.fecha} onChange={(event) => updateQuoteField('fecha', event.target.value)} />
              </label>
              <label>
                Documento
                <input value={selectedQuote.documento} onChange={(event) => updateQuoteField('documento', event.target.value)} />
              </label>
              <label>
                Estado
                <select value={selectedQuote.estado} onChange={(event) => changeQuoteStatus(event.target.value as QuoteState)}>
                  <option value="borrador">Borrador</option>
                  <option value="enviada">Enviada</option>
                  <option value="aceptada">Aceptada</option>
                  <option value="rechazada">Rechazada</option>
                </select>
              </label>
            </div>
          </article>
        </div>
      </section>
    )
  }

  function renderBulkView() {
    return (
      <section className="view-grid">
        {renderSectionTitle('Carga masiva', 'Upload de Excel o CSV con preview, deteccion de duplicados y estrategias de importacion.')}

        <article className="glass-card form-card">
          <label>
            Archivo
            <input
              type="file"
              accept=".csv,.xlsx,.xls"
              onChange={(event) => handleBulkUpload(event.target.files?.[0])}
            />
          </label>
          <div className="button-row">
            <button type="button" className={`tab-btn ${bulkMode === 'crear' ? 'active' : ''}`} onClick={() => setBulkMode('crear')}>
              Crear nuevo
            </button>
            <button type="button" className={`tab-btn ${bulkMode === 'actualizar' ? 'active' : ''}`} onClick={() => setBulkMode('actualizar')}>
              Actualizar existente
            </button>
            <button type="button" className={`tab-btn ${bulkMode === 'ignorar' ? 'active' : ''}`} onClick={() => setBulkMode('ignorar')}>
              Ignorar duplicados
            </button>
          </div>
          <div className="inline-notice">
            <span>{bulkFeedback}</span>
          </div>
          <button type="button" className="primary-btn" onClick={applyBulkImport} disabled={bulkRows.length === 0}>
            Procesar importacion
          </button>
        </article>

        <article className="glass-card list-card">
          <div className="card-head">
            <h2>Preview de datos</h2>
            <p>{bulkRows.length} filas</p>
          </div>
          <div className="table-shell">
            <table>
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Nombre</th>
                  <th>RUC / Org</th>
                  <th>Correo</th>
                  <th>Coincidencia</th>
                </tr>
              </thead>
              <tbody>
                {bulkRows.map((row) => (
                  <tr key={row.key}>
                    <td>{row.type}</td>
                    <td>{row.name}</td>
                    <td>{row.ruc || row.org || '-'}</td>
                    <td>{row.email || '-'}</td>
                    <td><span className={`chip state-${row.match}`}>{row.match}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </article>
      </section>
    )
  }

  function renderUsers() {
    return (
      <section className="view-grid">
        {renderSectionTitle('Usuarios y roles', 'Controla acceso sensible para cotizaciones, leads y carga de contactos.')}

        <div className="result-grid">
          {roles.map((role) => (
            <article key={role} className="glass-card panel-card">
              <div className="card-head">
                <h2>{role}</h2>
                <p>Permisos resumidos</p>
              </div>
              <div className="stack-list">
                {state.users.filter((user) => user.rol === role).map((user) => (
                  <div key={user.id} className="role-card">
                    <strong>{user.nombre}</strong>
                    <span>{user.correo}</span>
                    <small>{user.permisos.join(' · ')}</small>
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>
    )
  }

  function renderNotifications() {
    return (
      <section className="view-grid">
        {renderSectionTitle('Notificaciones y recordatorios', 'Alertas visibles para que el seguimiento no dependa de memoria manual.')}

        <div className="result-grid">
          <article className="glass-card panel-card">
            <div className="card-head">
              <h2>Alertas activas</h2>
              <p>Resumen operativo</p>
            </div>
            <div className="stack-list">
              {notifications.map((item) => (
                <div key={item.id} className={`notice notice-${item.level}`}>
                  <strong>{item.title}</strong>
                  <span>{item.detail}</span>
                  <small>{item.due}</small>
                </div>
              ))}
              {notifications.length === 0 ? <div className="empty-state">No hay recordatorios activos.</div> : null}
            </div>
          </article>

          <article className="glass-card panel-card">
            <div className="card-head">
              <h2>Configuracion sugerida</h2>
              <p>El MVP puede crecer desde aqui.</p>
            </div>
            <div className="stack-list">
              <div className="role-card">
                <strong>Hoy</strong>
                <span>Seguimiento de leads vencidos.</span>
              </div>
              <div className="role-card">
                <strong>Esta semana</strong>
                <span>Revisar cotizaciones pendientes y aprobaciones.</span>
              </div>
              <div className="role-card">
                <strong>Mensual</strong>
                <span>Depurar duplicados y consolidar actividades.</span>
              </div>
            </div>
          </article>
        </div>
      </section>
    )
  }

  function renderView() {
    switch (view) {
      case 'search':
        return renderSearchView()
      case 'organization':
        return renderOrganizationDetail()
      case 'organization-form':
        return renderOrganizationForm()
      case 'contact':
        return renderContactDetail()
      case 'contact-form':
        return renderContactForm()
      case 'pipeline':
        return renderPipeline()
      case 'lead':
        return renderLeadDetail()
      case 'quotes':
        return renderQuotes()
      case 'quote':
        return renderQuoteDetail()
      case 'bulk':
        return renderBulkView()
      case 'users':
        return renderUsers()
      case 'notifications':
        return renderNotifications()
      case 'dashboard':
      default:
        return renderDashboard()
    }
  }

  return (
    <div className={`app-shell ${menuOpen ? 'menu-open' : ''}`}>
      <header className="topbar glass-card">
        <button type="button" className="menu-toggle" onClick={() => setMenuOpen((current) => !current)} aria-expanded={menuOpen}>
          Menu
        </button>
        <div>
          <p className="eyebrow">BioActvia CRM</p>
          <strong>Gestión comercial y seguimiento de proyectos</strong>
        </div>
        <button type="button" className="ghost-btn" onClick={() => navigate('search')}>
          Buscar
        </button>
      </header>

      <div className="layout-shell">
        <aside className="sidebar glass-card">
          <div className="brand-block">
            <span className="brand-mark">B</span>
            <div>
              <strong>BioActvia</strong>
              <p>CRM comercial en español</p>
            </div>
          </div>

          <nav className="nav-stack">
            {renderNavButton('dashboard', 'Dashboard', 'Pipeline y alertas')}
            {renderNavButton('search', 'Busqueda', 'Lookup unificado')}
            {renderNavButton('organization', 'Organizacion', 'Detalle por RUC')}
            {renderNavButton('organization-form', 'Crear organizacion', 'Autofill SUNAT')}
            {renderNavButton('contact', 'Contacto', 'Timeline estructurado')}
            {renderNavButton('contact-form', 'Crear contacto', 'Duplicados en vivo')}
            {renderNavButton('pipeline', 'Pipeline', 'Kanban de leads')}
            {renderNavButton('lead', 'Lead', 'Seguimiento comercial')}
            {renderNavButton('quotes', 'Cotizaciones', 'Tabla y filtros')}
            {renderNavButton('quote', 'Detalle cotizacion', 'Trazabilidad')}
            {renderNavButton('bulk', 'Carga masiva', 'Excel / CSV')}
            {renderNavButton('users', 'Usuarios', 'Roles y permisos')}
            {renderNavButton('notifications', 'Alertas', 'Recordatorios')}
          </nav>

          <div className="sidebar-stats">
            <div className="stat-card">
              <span>Organizaciones</span>
              <strong>{state.organizations.length}</strong>
            </div>
            <div className="stat-card">
              <span>Contactos</span>
              <strong>{state.contacts.length}</strong>
            </div>
            <div className="stat-card">
              <span>Leads activos</span>
              <strong>{state.leads.filter((lead) => lead.estado !== 'cerrado').length}</strong>
            </div>
            <div className="stat-card">
              <span>Cotizaciones</span>
              <strong>{state.quotes.length}</strong>
            </div>
          </div>
        </aside>

        <main className="main-shell">{renderView()}</main>
      </div>

      {menuOpen ? <button type="button" className="backdrop-layer" onClick={() => setMenuOpen(false)} aria-label="Cerrar menu" /> : null}

      <datalist id="org-options-global">
        {state.organizations.map((org) => (
          <option key={org.id} value={`${org.nombre} - ${org.ruc}`} />
        ))}
      </datalist>
    </div>
  )
}

export default App
