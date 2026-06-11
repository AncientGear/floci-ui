import {type ElementType, type KeyboardEvent, useEffect, useId, useRef, useState} from 'react'
import {NavLink, Outlet, useLocation} from 'react-router-dom'
import {
    Database,
    Boxes,
    KeyRound,
    ChevronDown,
    LayoutDashboard,
    MessageSquare,
    Moon,
    Network,
    Search,
    Server,
    Sun,
    Table2,
    Zap,
} from 'lucide-react'
import flociWhite from '@/assets/floci-white.svg'
import flociBlack from '@/assets/floci-black.svg'
import {useTheme} from '@/lib/useTheme'
import {useQuery} from '@tanstack/react-query'
import {getCloudStatus} from '@/api/cloudProxyClient'
import {AccountSwitcher} from '@/components/AccountSwitcher'

function NavItem({to, icon, label, className}: { to: string; icon: ElementType; label: string; className?: string }) {
    const Icon = icon
    return (
        <NavLink className={({isActive}) => navLinkClassName(className, isActive)} to={to}>
            <Icon size={14}/>
            <span>{label}</span>
        </NavLink>
    )
}

const CLOUD_SERVICE_ICONS = {
    storage: Database,
    k8s: Boxes,
    secretsmanager: KeyRound,
    queue: MessageSquare,
    function: Zap,
    database: Table2,
    compute: Server,
    networking: Network,
    serverless: Zap,
} satisfies Record<string, ElementType>

type CloudSidebarService = keyof typeof CLOUD_SERVICE_ICONS

const CLOUD_SERVICE_ITEMS: Array<{name: CloudSidebarService; label: string; route?: string}> = [
    {name: 'storage', label: 'Storage', route: 'storage'},
    {name: 'k8s', label: 'k8s Engine', route: 'k8s'},
    {name: 'compute', label: 'Compute', route: 'compute'},
    {name: 'networking', label: 'Networking', route: 'networking'},
    {name: 'secretsmanager', label: 'Secrets Manager', route: '/secretsmanager'},
    {name: 'serverless', label: 'Serverless', route: 'serverless'},
    {name: 'queue', label: 'Queue'},
    {name: 'function', label: 'Function'},
]

function CloudServiceNav() {
    const location = useLocation()
    const cloud = activeCloudFromPath(location.pathname)
    const cloudLabel = cloud.toUpperCase()
    const showDatabaseGroup = cloud === 'aws'
    const showDatabaseLink = cloud === 'azure'

    return (
        <div className="nav-section cloud-service-nav">
            <span className="nav-label">Cloud Services · {cloudLabel}</span>
            {CLOUD_SERVICE_ITEMS.map((service) => {
                const Icon = CLOUD_SERVICE_ICONS[service.name]
                const available = service.name === 'storage'
                    || (service.name === 'secretsmanager' && cloud === 'aws')
                    || (service.name === 'database' && (cloud === 'aws' || cloud === 'azure'))
                    || ((service.name === 'k8s' || service.name === 'compute' || service.name === 'networking' || service.name === 'serverless') && cloud === 'aws')
                if (service.route && available) {
                    const target = service.route.startsWith('/') ? service.route : `/cloud-explorer/${cloud}/${service.route}`
                    return <NavItem key={service.name} to={target} icon={Icon} label={service.label}/>
                }

                return (
                    <div key={service.name} className="nav-link disabled">
                        <Icon size={14}/>
                        <span>{service.label}</span>
                        <span className="nav-soon">Soon</span>
                    </div>
                )
            })}
            {showDatabaseGroup
                ? <DatabaseGroupNav cloud={cloud}/>
                : showDatabaseLink
                    ? <NavItem to={`/cloud-explorer/${cloud}/database`} icon={Table2} label="Database"/>
                    : (
                        <div className="nav-link disabled">
                            <Table2 size={14}/>
                            <span>Database</span>
                            <span className="nav-soon">Soon</span>
                        </div>
                    )}
        </div>
    )
}

function DatabaseGroupNav({cloud}: {cloud: 'aws'}) {
    const location = useLocation()
    const groupId = useId()
    const databaseLinkRef = useRef<HTMLAnchorElement | null>(null)
    const isActive = location.pathname === `/cloud-explorer/${cloud}/database`
        || location.pathname === `/cloud-explorer/${cloud}/dynamodb`
    const [isOpen, setIsOpen] = useState(isActive)
    const [focusFirstChild, setFocusFirstChild] = useState(false)

    useEffect(() => {
        if (isActive) {
            setIsOpen(true)
        }
    }, [isActive])

    useEffect(() => {
        if (isOpen && focusFirstChild) {
            databaseLinkRef.current?.focus()
            setFocusFirstChild(false)
        }
    }, [focusFirstChild, isOpen])

    const openAndFocusFirstChild = () => {
        setIsOpen(true)
        setFocusFirstChild(true)
    }

    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>) => {
        if (event.key === 'Enter' || event.key === ' ' || event.key === 'ArrowDown') {
            event.preventDefault()
            openAndFocusFirstChild()
        }
    }

    return (
        <div className={isActive ? 'nav-group active' : 'nav-group'}>
            <button
                aria-controls={groupId}
                aria-expanded={isOpen}
                className={navGroupTriggerClassName(isActive)}
                type="button"
                onClick={() => setIsOpen((open) => !open)}
                onKeyDown={handleKeyDown}
            >
                <Table2 size={14}/>
                <span>Database</span>
                <ChevronDown className={isOpen ? 'nav-group-chevron open' : 'nav-group-chevron'} size={14}/>
            </button>
            <div className={isOpen ? 'nav-group-children open' : 'nav-group-children'} id={groupId}>
                <NavLink className={({isActive: linkActive}) => navLinkClassName('nav-sublink', linkActive)} ref={databaseLinkRef} to={`/cloud-explorer/${cloud}/database`}>
                    <span>Database</span>
                </NavLink>
                <NavLink className={({isActive: linkActive}) => navLinkClassName('nav-sublink', linkActive)} to={`/cloud-explorer/${cloud}/dynamodb`}>
                    <span>DynamoDB</span>
                </NavLink>
            </div>
        </div>
    )
}

export function Layout() {
    const location = useLocation()
    const activeCloud = activeCloudFromPath(location.pathname)
    const {theme, toggle} = useTheme()
    const {data, isError} = useQuery({
        queryKey: ['cloud-status', activeCloud],
        queryFn: ({signal}) => getCloudStatus(activeCloud, signal),
        refetchInterval: 5000
    })
    const status = isError ? 'unavailable' : data?.runtime ?? 'unknown'
    const isConnected = status === 'reachable'
    const connectionLabel = isConnected ? 'Connected' : 'Not connected'
    const connectionTarget = data?.endpoint ?? activeCloud

    return (
        <div className="app">
            <aside className="sidebar">
                <div className="brand">
                    <img className="brand-logo" src={theme === 'dark' ? flociWhite : flociBlack} alt="Floci"/>
                    <p>Local Cloud</p>
                </div>

                <nav className="nav">
                    <div className="nav-section">
                        <span className="nav-label">General</span>
                        <NavItem to={`/console/${activeCloud}`} icon={LayoutDashboard} label="Console Home"/>
                    </div>
                    <CloudServiceNav/>
                </nav>

                <div className="sidebar-footer">Floci DevTools · Local</div>
            </aside>

            <div className="shell">
                <header className="topbar">
                    <div className="search">
                        <Search size={14}/>
                        <input placeholder="Search services, features, docs, and more"/>
                        <span className="kbd">/</span>
                    </div>
                    <button className="icon-btn" onClick={toggle} title="Toggle theme">
                        {theme === 'dark' ? <Sun size={14}/> : <Moon size={14}/>}
                    </button>
                    <AccountSwitcher/>
                    <div className={`connection ${isConnected ? 'connected' : 'disconnected'}`}>
                        <span className={`dot ${status}`}/>
                        <span className="connection-state">{connectionLabel}</span>
                        <span className="connection-target">{connectionTarget}</span>
                    </div>
                </header>
                <main className="main">
                    <Outlet/>
                </main>
            </div>
        </div>
    )
}

function activeCloudFromPath(pathname: string): 'aws' | 'azure' | 'gcp' {
    const match = pathname.match(/^\/(?:cloud-explorer|console)\/(aws|azure|gcp)(?:\/|$)/)
    return (match?.[1] ?? 'aws') as 'aws' | 'azure' | 'gcp'
}

function navLinkClassName(className: string | undefined, isActive: boolean): string {
    return [className ?? 'nav-link', isActive ? 'active' : ''].filter(Boolean).join(' ')
}

function navGroupTriggerClassName(isActive: boolean): string {
    return ['nav-link', 'nav-group-trigger', isActive ? 'active' : ''].filter(Boolean).join(' ')
}
