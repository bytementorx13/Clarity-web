import React, { useEffect, useMemo, useState } from 'react'
import { AlertTriangle, ArrowRight, Bell, BriefcaseBusiness, CalendarDays, Check, ChevronDown, ChevronRight, CircleHelp, Code2, ExternalLink, FileText, FolderKanban, LayoutDashboard, Menu, MoreHorizontal, Pencil, Plus, Search, Settings, UsersRound, WalletCards, X } from 'lucide-react'
import { createRoot } from 'react-dom/client'
import './styles.css'

const types = ['Display Only', 'Portfolio — Basic Contact Form', 'Portfolio — WhatsApp Lead Integration', 'Management System — Backend + DB']
const blank = {name:'',category:types[0],description:'',cost:'',design:'',code:'',people:['Sumit','Shree'],status:'Open',due:''}
const API_BASE = import.meta.env.DEV ? '' : (import.meta.env.VITE_API_URL || 'https://clarity-server-rtvb.onrender.com').replace(/\/$/, '')
const getGreeting = () => {
  const hour = new Date().getHours()
  if (hour < 12) return 'Good morning'
  if (hour < 18) return 'Good afternoon'
  return 'Good evening'
}
const money = n => new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:0}).format(n || 0)
const date = d => d ? new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short',year:'numeric'}).format(new Date(`${d}T12:00:00`)) : 'Not set'
const days = (d) => {
  if (!d) return null
  const dueDate = new Date(`${d}T12:00:00`)
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  dueDate.setHours(0, 0, 0, 0)
  return Math.ceil((dueDate - today) / 86400000)
}
const normalizeClient = (item) => ({
  ...item,
  id: String(item.id ?? item._id ?? item.id),
  color: item.color || ['violet', 'orange', 'pink', 'blue', 'green'][Math.abs(String(item.id).length) % 5],
  design: item.designUrl || item.design || '',
  code: item.codeUrl || item.code || '',
  due: item.due || '',
  people: item.people || ['Sumit', 'Shree'],
  category: item.category || types[0],
  status: item.status || 'Open',
})

function Avatar({name,small=false}) { return <span className={`avatar ${small?'small':''} ${name.toLowerCase()}`}>{name[0]}</span> }
function Status({value}) { return <span className={`status ${value.toLowerCase().replace(' ','-')}`}><i/>{value}</span> }
function Deadline({client}) {
  const n = days(client.due)
  if (client.status === 'Completed') return <span className="deadline done">Completed</span>

  const state = n < 0 ? 'overdue' : n === 0 ? 'today' : n <= 2 ? 'urgent' : n <= 7 ? 'soon' : ''
  const label = n < 0 ? `${Math.abs(n)}d overdue` : n === 0 ? 'Due today' : `${n}d left`

  return <span className={`deadline ${state}`}><CalendarDays size={13}/>{label}</span>
}
function Field({label,value,onChange,select,options,textarea,type='text',placeholder,required}) { return <label className="field"><span>{label}</span>{select?<select value={value} onChange={e=>onChange(e.target.value)}>{options.map(x=><option key={x}>{x}</option>)}</select>:textarea?<textarea value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}/>:<input type={type} value={value} onChange={e=>onChange(e.target.value)} placeholder={placeholder} required={required}/>}</label> }

async function apiFetch(url, options = {}) {
  const target = url.startsWith('http') ? url : `${API_BASE}${url}`
  const response = await fetch(target, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  if (response.status === 204) return null

  const data = await response.json().catch(() => null)
  if (!response.ok) {
    const message = data?.detail || data?.message || 'Request failed'
    throw new Error(message)
  }
  return data
}

function App(){
 const [clients,setClients]=useState([]),[selected,setSelected]=useState(null),[modal,setModal]=useState(null),[page,setPage]=useState('Clients'),[query,setQuery]=useState(''),[filter,setFilter]=useState('All projects'),[form,setForm]=useState(blank),[notices,setNotices]=useState(false),[toast,setToast]=useState(null),[loading,setLoading]=useState(true)

 useEffect(() => {
   const loadClients = async () => {
     try {
       const data = await apiFetch('/api/v1/clients')
       setClients((data || []).map(normalizeClient))
     } catch (error) {
       setToast(error.message || 'Unable to load clients')
     } finally {
       setLoading(false)
     }
   }
   loadClients()
 }, [])

 const active=clients.filter(c=>c.status!=='Completed'),done=clients.filter(c=>c.status==='Completed'),value=clients.reduce((a,c)=>a+c.cost,0),risks=active.filter(c=>days(c.due)<=3).sort((a,b)=>days(a.due)-days(b.due))
 const shown=useMemo(()=>clients.filter(c=>(filter==='All projects'||c.status===filter)&&`${c.name} ${c.category}`.toLowerCase().includes(query.toLowerCase())),[clients,filter,query])
 const share=(c,n)=>c.people.length===2?(n==='Sumit'?80:20):(n==='Sumit'?70:(n==='Shree'?15:15))
 const team=['Sumit','Shree','Abhishek'].map(name=>{const work=clients.filter(c=>c.people.includes(name));return {name,projects:work.length,completed:work.filter(c=>c.status==='Completed').length,earned:work.filter(c=>c.status==='Completed').reduce((a,c)=>a+c.cost*(share(c,name)/100),0),pending:work.filter(c=>c.status!=='Completed').reduce((a,c)=>a+c.cost*(share(c,name)/100),0)}})
 const field=(key,value)=>setForm(x=>({...x,[key]:value})); const toggle=n=>setForm(x=>({...x,people:x.people.includes(n)?x.people.filter(p=>p!==n):[...x.people,n]}))
 const notify=message=>setToast(message); useEffect(()=>{if(!toast)return;const timer=setTimeout(()=>setToast(null),3200);return()=>clearTimeout(timer)},[toast]); useEffect(()=>{if(notices&&risks[0]){setSelected(risks[0]);setNotices(false)}},[notices,risks])

 const save = async (e) => {
   e.preventDefault();
   const editing = modal === 'edit';
   const payload = {
     name: form.name,
     category: form.category,
     description: form.description,
     cost: Number(form.cost),
     status: form.status,
     due: form.due,
     designUrl: form.design,
     codeUrl: form.code,
     people: form.people,
   }

   try {
     const result = editing
       ? await apiFetch(`/api/v1/clients/${selected.id}`, { method: 'PATCH', body: JSON.stringify(payload) })
       : await apiFetch('/api/v1/clients', { method: 'POST', body: JSON.stringify(payload) })

     const next = normalizeClient(result)
     setClients((items) => editing ? items.map((item) => item.id === next.id ? next : item) : [next, ...items])
     setSelected(next)
     setModal(null)
     setForm(blank)
     notify(editing ? 'Project changes saved' : 'Project added successfully')
   } catch (error) {
     notify(error.message || 'Failed to save project')
   }
 }

 const complete = async () => {
   if (!selected) return
   try {
     const result = await apiFetch(`/api/v1/clients/${selected.id}/complete`, { method: 'POST' })
     const updated = normalizeClient({ ...selected, status: 'Completed', completedAt: result.completedAt, payouts: result.payouts })
     setClients((items) => items.map((item) => item.id === updated.id ? updated : item))
     setSelected(updated)
     setModal(null)
     notify(`${selected.name} marked as complete`)
   } catch (error) {
     notify(error.message || 'Could not mark project complete')
   }
 }

 const editProject=()=>{setForm({...selected,design:selected.design,code:selected.code});setModal('edit')};
 const removeProject = async () => {
   if (!selected) return
   try {
     await apiFetch(`/api/v1/clients/${selected.id}`, { method: 'DELETE' })
     const name = selected.name
     setClients((items) => items.filter((item) => item.id !== selected.id))
     setSelected(null)
     setModal(null)
     notify(`${name} removed from projects`)
   } catch (error) {
     notify(error.message || 'Failed to delete project')
   }
 }

 if (loading) return <div className="app-shell"><main><div className="content"><p className="subtitle">Loading clients...</p></div></main></div>

 return <div className={`app-shell ${selected&&page==='Clients'?'details-open':''}`}><Sidebar page={page} setPage={setPage} risks={risks} choose={c=>{setSelected(c);setPage('Clients')}}/><main><header><div className="mobile-brand"><Menu size={20}/><b>Clarity</b></div><p className="desktop-context">Studio workspace <span>·</span> Project overview</p></header>{page==='Team'?<Team team={team} clients={clients}/>:<Clients clients={clients} shown={shown} selected={selected} setSelected={setSelected} risks={risks} active={active} done={done} value={value} query={query} setQuery={setQuery} filter={filter} setFilter={setFilter} openAdd={()=>{setForm(blank);setModal('add')}} openNotices={()=>setNotices(true)}/>}</main>{selected&&page==='Clients'&&<Details client={selected} setSelected={setSelected} complete={()=>setModal('complete')} edit={editProject} remove={()=>setModal('delete')}/>} {modal&&<Modal modal={modal} form={form} field={field} toggle={toggle} selected={selected} setModal={setModal} save={save} complete={complete} remove={removeProject}/>} {toast&&<Toast message={toast} dismiss={()=>setToast(null)}/>}</div>
}
function Sidebar({page,setPage,risks,choose}){return <aside className="sidebar"><div className="brand"><span className="brand-mark"><i/><i/><i/></span><span>Clarity</span></div><div className="workspace"><div className="workspace-icon">S</div><div><b>Sumit's workspace</b><small>Studio workspace</small></div><ChevronDown size={15}/></div><nav><button onClick={()=>setPage('Clients')} className={page==='Clients'?'nav-item active':'nav-item'}><LayoutDashboard size={19}/><span>Overview</span></button><button onClick={()=>setPage('Team')} className={page==='Team'?'nav-item active':'nav-item'}><BriefcaseBusiness size={19}/><span>Team</span></button></nav><div className="side-alerts"><div className="side-alert-title"><span><Bell size={14}/> Notifications</span><b>{risks.length}</b></div>{risks.length?<div>{risks.map(c=><button onClick={()=>choose(c)} key={c.id}><span className="side-alert-icon"><AlertTriangle size={13}/></span><span><b>{c.name}</b><small>{days(c.due)===0?'Due today':`${days(c.due)} days left`}</small></span></button>)}</div>:<p>Nothing needs attention.</p>}</div><div className="sidebar-bottom"><div className="help-card"><CircleHelp size={19}/><div><b>Need a hand?</b><p>Check our help center</p></div><ArrowRight size={16}/></div><div className="sidebar-owner"><Avatar name="Sumit"/><div><b>Sumit Raj</b><small>Owner</small></div></div></div></aside>}
function Clients({clients,shown,selected,setSelected,risks,active,done,value,query,setQuery,filter,setFilter,openAdd,openNotices}){
  const greeting = getGreeting()
  return <div className="content"><section className="hero"><div><p className="eyebrow">CLIENT MANAGEMENT</p><h1>{greeting}, Sumit <span>✦</span></h1><p className="subtitle">A focused view of your studio’s work, deadlines and payouts.</p></div><button className="primary" onClick={openAdd}><Plus size={18}/> Add client</button></section><section className="stats"><Stat label="ACTIVE PROJECTS" icon={FolderKanban} tone="blue" value={active.length} detail={`${risks.length} nearing deadline`}/><Stat label="TOTAL CLIENTS" icon={UsersRound} tone="purple" value={clients.length} detail="Across your workspace"/><Stat label="PROJECT VALUE" icon={WalletCards} tone="gold" value={money(value)} detail="All project value"/><Stat label="COMPLETED" icon={Check} tone="green" value={done.length} detail="Projects delivered"/></section>{risks.length>0&&<section className="deadline-banner"><div className="deadline-banner-icon"><AlertTriangle size={18}/></div><div><b>Deadline attention needed</b><p>{risks.map(c=>`${c.name} (${days(c.due)===0?'due today':`${days(c.due)}d left`})`).join(' · ')}</p></div><button onClick={openNotices}>View alerts <ArrowRight size={15}/></button></section>}<section className="clients-section"><div className="section-heading"><div><h2>Projects in motion</h2><p>Manage clients, delivery dates and project details.</p></div><button className="text-button">All projects <ArrowRight size={16}/></button></div><div className="toolbar"><div className="search"><Search size={18}/><input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Search clients or projects..."/></div><div className="filters">{['All projects','Open','In progress','Review','Completed'].map(x=><button onClick={()=>setFilter(x)} className={filter===x?'filter selected':'filter'} key={x}>{x}{x==='All projects'&&<ChevronDown size={15}/>}</button>)}</div></div><div className="client-table"><div className="table-header"><span>CLIENT / PROJECT</span><span>STATUS</span><span>DEADLINE</span><span>TEAM</span><span>PROJECT VALUE</span><span/></div>{shown.map(c=><button className={`client-row ${selected?.id===c.id?'selected-row':''}`} key={c.id} onClick={()=>setSelected(c)}><div className="client-name"><div className={`client-logo ${c.color}`}>{c.name[0]}</div><div><b>{c.name}</b><small>{c.category}</small></div></div><Status value={c.status}/><Deadline client={c}/><div className="team">{c.people.map(p=><Avatar key={p} name={p} small/>)}</div><b>{money(c.cost)}</b><ChevronRight size={18}/></button>)}</div></section></div>}
function Stat({label,icon:Icon,tone,value,detail}){return <div className="stat"><div className="stat-top"><span>{label}</span><span className={`stat-icon ${tone}`}><Icon size={17}/></span></div><strong>{value}</strong><small>{detail}</small></div>}
function Toast({message,dismiss}){return <div className="toast"><span><Check size={16}/></span><div><b>All set</b><small>{message}</small></div><button onClick={dismiss}><X size={15}/></button></div>}
function Notifications({risks,choose}){return <div className="notification-popover"><div className="pop-head"><b>Deadline alerts</b><small>{risks.length} need attention</small></div>{risks.map(c=><button key={c.id} onClick={()=>choose(c)}><span className="notice-icon"><AlertTriangle size={15}/></span><span><b>{c.name}</b><small>{days(c.due)===0?'Due today':`Due in ${days(c.due)} days`} · {date(c.due)}</small></span><ChevronRight size={15}/></button>)}{!risks.length&&<p className="empty-notice">No upcoming deadline risks.</p>}</div>}
function Details({client,setSelected,complete,edit,remove}){const [menu,setMenu]=useState(false);const payout=client.people.length===2?[['Sumit',80],['Shree',20]]:[['Sumit',70],['Shree',15],['Abhishek',15]];return <aside className="detail-panel"><div className="panel-head"><button onClick={()=>setSelected(null)} className="plain-close"><X size={20}/></button><div className="project-actions"><button onClick={()=>setMenu(!menu)} className="plain-close"><MoreHorizontal size={20}/></button>{menu&&<div className="project-menu"><button onClick={edit}><Pencil size={15}/> Edit project</button><button className="delete-action" onClick={remove}><X size={15}/> Delete project</button></div>}</div></div><div className={`detail-logo ${client.color}`}>{client.name[0]}</div><h2>{client.name}</h2><p className="project-title">{client.category}</p><Status value={client.status}/><div className="panel-rule"/><div className="info-block"><label>PROJECT DESCRIPTION</label><p>{client.description}</p></div><div className="detail-grid"><div><label>PROJECT VALUE</label><b>{money(client.cost)}</b></div><div><label>DEADLINE</label><b className={days(client.due)<=3&&client.status!=='Completed'?'due-risk':''}>{date(client.due)}</b></div></div><div className="info-block"><label>PEOPLE INVOLVED</label><div className="people-list">{client.people.map(p=><div key={p}><Avatar name={p} small/><span>{p}</span>{p==='Sumit'&&<small>Lead</small>}</div>)}</div></div><div className="info-block"><label>QUICK LINKS</label><a href={client.design} target="_blank"><FileText size={16}/> Design files <ExternalLink size={14}/></a><a href={client.code} target="_blank"><Code2 size={16}/> Code repository <ExternalLink size={14}/></a></div>{client.status!=='Completed'?<button className="complete-button" onClick={complete}><Check size={17}/> Mark as complete</button>:<div className="payout-card"><label>PAYOUT SPLIT</label>{payout.map(([n,p])=><div className="share" key={n}><span>{n}</span><b>{p}% · {money(client.cost*p/100)}</b></div>)}</div>}</aside>}
function Team({team,clients}){const earned=team.reduce((a,m)=>a+m.earned,0),pending=team.reduce((a,m)=>a+m.pending,0);return <div className="content team-page"><section className="hero"><div><p className="eyebrow">STUDIO PEOPLE</p><h1>Team & payouts <span>✦</span></h1><p className="subtitle">See contribution, delivered value and upcoming earnings at a glance.</p></div></section><section className="team-overview"><div><span>TEAM MEMBERS</span><b>{team.length}</b><small>Active collaborators</small></div><div><span>AMOUNT EARNED</span><b>{money(earned)}</b><small>From completed projects</small></div><div><span>AMOUNT PENDING</span><b>{money(pending)}</b><small>From {clients.filter(c=>c.status!=='Completed').length} active projects</small></div></section><section className="team-section"><div className="section-heading"><div><h2>Team members</h2><p>Amounts are calculated from each project’s payout split.</p></div></div><div className="member-grid">{team.map((m,i)=><article className="member-card" key={m.name}><div className="member-head"><Avatar name={m.name}/><div><h3>{m.name}</h3><p>{m.name==='Sumit'?'Founder & lead':'Core team member'}</p></div><span className={`member-index i${i+1}`}>{m.completed} delivered</span></div><div className="member-projects"><span><b>{m.projects}</b> projects worked</span><span><b>{m.completed}</b> completed</span></div><div className="member-money"><div><label>AMOUNT EARNED</label><b>{money(m.earned)}</b><small>Delivered projects</small></div><div><label>AMOUNT PENDING</label><b>{money(m.pending)}</b><small>Active & review</small></div></div><div className="member-bar"><i style={{width:`${m.earned+m.pending?m.earned/(m.earned+m.pending)*100:0}%`}}/></div><p className="bar-caption">{m.earned+m.pending?Math.round(m.earned/(m.earned+m.pending)*100):0}% of current allocation delivered</p></article>)}</div></section></div>}
function Modal({modal,form,field,toggle,selected,setModal,save,complete,remove}){const edit=modal==='add'||modal==='edit';const review=()=>{Object.entries(selected).forEach(([k,v])=>field(k,v));setModal('edit')};
  if (modal === 'delete') {
    return <div className="modal-backdrop"><div className="modal confirm-modal"><div className="confirm-icon"><X size={24}/></div><h2>Delete this project?</h2><p>This will permanently remove <b>{selected?.name}</b> from your workspace.</p><div className="confirm-cost"><span>Project value</span><b>{money(selected?.cost || 0)}</b><small>{selected?.people?.length===2?'Sumit 80% · Shree 20%':'Sumit 70% · Shree 15% · Abhishek 15%'}</small></div><div className="modal-actions stacked"><button className="primary" onClick={remove}>Delete project <X size={17}/></button><button className="secondary" onClick={()=>setModal(null)}>Cancel</button></div></div></div>
  }

  return <div className="modal-backdrop"><div className={edit?'modal form-modal':'modal confirm-modal'}>{edit?<form onSubmit={save}><div className="modal-head"><div><p className="eyebrow">{modal==='edit'?'REVIEW PROJECT':'NEW PROJECT'}</p><h2>{modal==='edit'?'Update project details':'Add a client'}</h2><p>Keep the project record clear from day one.</p></div><button type="button" className="plain-close" onClick={()=>setModal(null)}><X/></button></div><div className="form-grid"><Field label="Client name" value={form.name} onChange={v=>field('name',v)} placeholder="e.g. Acme Studio" required/><Field label="Project category" value={form.category} onChange={v=>field('category',v)} select options={types}/><div className="full"><Field label="Project description" value={form.description} onChange={v=>field('description',v)} textarea placeholder="What are you creating together?" required/></div><Field label="Estimated cost (₹)" value={form.cost} onChange={v=>field('cost',v)} type="number" placeholder="45000" required/><Field label="Deadline" value={form.due} onChange={v=>field('due',v)} type="date" required/><Field label="Project status" value={form.status} onChange={v=>field('status',v)} select options={['Open','In progress','Review','Completed']}/><Field label="Design link" value={form.design} onChange={v=>field('design',v)} placeholder="https://figma.com/..."/><Field label="Code base link" value={form.code} onChange={v=>field('code',v)} placeholder="https://github.com/..."/></div><div className="team-choice"><label>PEOPLE INVOLVED</label><p>Sumit and Shree are always included. Add Abhishek for the three-way split.</p><div>{['Sumit','Shree','Abhishek'].map(n=><button type="button" className={form.people.includes(n)?'person-check checked':'person-check'} onClick={()=>n==='Abhishek'&&toggle(n)} key={n}><span>{form.people.includes(n)&&<Check size={12}/>}</span><Avatar name={n} small/> {n}</button>)}</div></div><div className="modal-actions"><button type="button" className="secondary" onClick={()=>setModal(null)}>Cancel</button><button className="primary">{modal==='edit'?'Save changes':'Add client'} <ArrowRight size={17}/></button></div></form>:<><div className="confirm-icon"><Check size={24}/></div><h2>Ready to complete this project?</h2><p>Before closing <b>{selected.name}</b>, would you like to review or update any project details?</p><div className="confirm-cost"><span>Project value</span><b>{money(selected.cost)}</b><small>{selected.people.length===2?'Sumit 80% · Shree 20%':'Sumit 70% · Shree 15% · Abhishek 15%'}</small></div><div className="modal-actions stacked"><button className="primary" onClick={complete}>Yes, mark as complete <Check size={17}/></button><button className="secondary" onClick={review}><Pencil size={16}/> Review project details first</button><button className="text-cancel" onClick={()=>setModal(null)}>Not yet</button></div></>}</div></div>}
createRoot(document.getElementById('root')).render(<App/>)
