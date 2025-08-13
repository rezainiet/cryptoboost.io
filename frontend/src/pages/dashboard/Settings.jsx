const Settings = () => {
    return (
        <div className="space-y-6">
            {/* Profile Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Paramètres du Profil</h2>
                <div className="space-y-4">
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-2">Nom d'utilisateur</label>
                        <input
                            type="text"
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-lime-400 focus:outline-none"
                            placeholder="Votre nom d'utilisateur"
                        />
                    </div>
                    <div>
                        <label className="block text-gray-400 text-sm font-medium mb-2">Email</label>
                        <input
                            type="email"
                            className="w-full bg-slate-700/50 border border-slate-600 rounded-lg px-4 py-3 text-white focus:border-lime-400 focus:outline-none"
                            placeholder="votre@email.com"
                        />
                    </div>
                </div>
            </div>

            {/* Security Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Sécurité</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div>
                            <h3 className="text-white font-medium">Authentification à deux facteurs</h3>
                            <p className="text-gray-400 text-sm">Sécurisez votre compte avec 2FA</p>
                        </div>
                        <button className="bg-lime-400 text-slate-900 px-4 py-2 rounded-lg font-medium hover:bg-lime-300 transition-colors">
                            Activer
                        </button>
                    </div>
                    <div className="flex items-center justify-between p-4 bg-slate-700/30 rounded-lg">
                        <div>
                            <h3 className="text-white font-medium">Changer le mot de passe</h3>
                            <p className="text-gray-400 text-sm">Mettre à jour votre mot de passe</p>
                        </div>
                        <button className="bg-teal-500 text-white px-4 py-2 rounded-lg font-medium hover:bg-teal-400 transition-colors">
                            Modifier
                        </button>
                    </div>
                </div>
            </div>

            {/* Notification Settings */}
            <div className="bg-slate-800/50 backdrop-blur-xl border border-teal-500/20 rounded-xl p-6">
                <h2 className="text-xl font-bold text-white mb-6">Notifications</h2>
                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-white font-medium">Notifications par email</h3>
                            <p className="text-gray-400 text-sm">Recevoir des mises à jour par email</p>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" className="sr-only peer" defaultChecked />
                            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-lime-400"></div>
                        </label>
                    </div>
                </div>
            </div>
        </div>
    )
}

export default Settings
