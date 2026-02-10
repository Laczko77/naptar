import Sidebar from '@/components/Sidebar'
import Header from '@/components/Header'

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <div style={{ display: 'flex', minHeight: '100vh' }}>
            <Sidebar />
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                <Header />
                <main
                    style={{
                        flex: 1,
                        padding: '24px',
                        overflowY: 'auto',
                        background: 'var(--color-bg)',
                    }}
                >
                    {children}
                </main>
            </div>
        </div>
    )
}
