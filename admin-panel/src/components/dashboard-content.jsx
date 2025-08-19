import StatsCard from "./stats-card"
import ChartCard from "./chart-card"

const DashboardContent = () => {
    const statsData = [
        { title: "CDN usage", value: "8.25 KB", change: "+12%", trend: "up" },
        { title: "Data transfer", value: "8.25 KB", change: "+8%", trend: "up" },
        { title: "Unique visits", value: "1642", change: "-3%", trend: "down" },
        { title: "Resource Usage", value: "76%", change: "+15%", trend: "up" },
    ]

    const siteData = [
        { name: "UI KIT", url: "www.uikit.to", visits: "199,452,201" },
        { name: "UI Design", url: "www.uidesign.to", visits: "908,400,35" },
        { name: "Bexon", url: "www.bexon.agency", visits: "152,824,001" },
    ]

    const siteColumns = [
        { key: "name", header: "Name" },
        { key: "url", header: "URL" },
        { key: "visits", header: "Visits" },
    ]

    return (
        <div className="min-h-screen bg-slate-900 p-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {statsData.map((stat, index) => (
                    <StatsCard key={index} {...stat} />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="CDN usage" subtitle="Last 28 days" />
                <div className="space-y-6">
                    <div className="bg-slate-800 rounded-xl p-6 border border-slate-700">
                        <div className="flex items-center justify-between mb-4">
                            <h3 className="text-white text-lg font-semibold">Your Sites</h3>
                            <button className="text-slate-400 hover:text-white text-sm font-medium">View all</button>
                        </div>
                        <div className="space-y-3">
                            {siteData.map((site, index) => (
                                <div key={index} className="flex items-center justify-between py-2">
                                    <div>
                                        <p className="text-white font-medium">{site.name}</p>
                                        <p className="text-slate-400 text-sm">{site.url}</p>
                                    </div>
                                    <p className="text-slate-300 text-sm">{site.visits}</p>
                                </div>
                            ))}
                        </div>
                    </div>

                    <ChartCard title="Resource Usage" subtitle="Last 28 days" />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <ChartCard title="Data transfer" subtitle="Last 7 days" />
                <ChartCard title="Unique visits" subtitle="Last 7 days" />
            </div>
        </div>
    )
}

export default DashboardContent
