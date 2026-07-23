import { getUsersRoles } from "@/app/actions/admin";
import UserRoleSelector from "@/components/UserRoleSelector";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "User Directory | LuxeEstate Admin",
};

export default async function AdminUsersPage() {
  const users = await getUsersRoles();

  return (
    <div className="w-full">
      <header className="w-full pt-8 pb-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-nordic dark:text-white">User Directory</h1>
            <p className="text-nordic/60 dark:text-gray-400 mt-1 text-sm">Manage user access and roles for your properties.</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            <div className="relative group w-full md:w-80">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <span className="material-icons text-nordic/40 group-focus-within:text-primary text-xl">search</span>
              </div>
              <input 
                className="block w-full pl-10 pr-3 py-2.5 border border-transparent dark:border-primary/20 rounded-lg bg-white dark:bg-background-dark text-nordic dark:text-white shadow-soft placeholder-nordic/30 focus:ring-2 focus:ring-primary focus:bg-white transition-all text-sm" 
                placeholder="Search by name, email..." 
                type="text"
              />
            </div>
            <button className="inline-flex items-center justify-center px-4 py-2.5 border border-nordic text-sm font-medium rounded-lg text-nordic dark:border-white dark:text-white bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-nordic transition-colors whitespace-nowrap">
              <span className="material-icons text-lg mr-2">add</span>
              Add User
            </button>
          </div>
        </div>
        
        <div className="mt-8 flex gap-6 border-b border-nordic/10 overflow-x-auto">
          <button className="pb-3 text-sm font-semibold text-primary border-b-2 border-primary">All Users</button>
          <button className="pb-3 text-sm font-medium text-nordic/60 hover:text-nordic transition-colors">Agents</button>
          <button className="pb-3 text-sm font-medium text-nordic/60 hover:text-nordic transition-colors">Brokers</button>
          <button className="pb-3 text-sm font-medium text-nordic/60 hover:text-nordic transition-colors">Admins</button>
        </div>
      </header>

      <main className="w-full pb-12 space-y-4">
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 text-xs font-semibold uppercase tracking-wider text-nordic/50 mb-2">
          <div className="col-span-4">User Details</div>
          <div className="col-span-3">Role & Status</div>
          <div className="col-span-3">Joined At</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {users.length === 0 ? (
          <div className="p-10 text-center text-nordic/50 dark:text-gray-400 bg-white dark:bg-background-dark rounded-xl shadow-sm border border-gray-200 dark:border-primary/20">
            No users found. Ensure the user_roles table is populated.
          </div>
        ) : (
          users.map((user) => (
            <div key={user.id} className="user-card group relative bg-white dark:bg-background-dark rounded-xl p-5 shadow-sm border border-gray-100 dark:border-primary/20 hover:bg-background-light dark:hover:bg-primary/10 flex flex-col md:grid md:grid-cols-12 gap-4 items-center transition-all duration-200">
              <div className="col-span-12 md:col-span-4 flex items-center w-full">
                <div className="relative flex-shrink-0">
                  <div className="h-12 w-12 rounded-full bg-primary/10 border-2 border-white dark:border-primary flex items-center justify-center overflow-hidden">
                    <span className="material-icons text-primary text-2xl">person</span>
                  </div>
                  <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-400 ring-2 ring-white"></span>
                </div>
                <div className="ml-4 overflow-hidden">
                  <div className="text-sm font-bold text-nordic dark:text-white truncate">
                    {user.email.split('@')[0]}
                  </div>
                  <div className="text-xs text-nordic/70 dark:text-gray-300 truncate">{user.email}</div>
                  <div className="mt-1 text-[10px] px-2 py-0.5 inline-block bg-gray-50 dark:bg-white/10 rounded text-nordic/50 dark:text-gray-400 group-hover:bg-white/50 transition-colors">
                    ID: #{user.user_id.substring(0, 8)}
                  </div>
                </div>
              </div>
              
              <div className="col-span-12 md:col-span-3 w-full flex items-center justify-between md:justify-start gap-4">
                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary capitalize">
                  {user.role}
                </span>
                <div className="flex items-center text-xs text-nordic/60 dark:text-gray-400">
                  <span className="material-icons text-[14px] mr-1 text-primary">check_circle</span>
                  Active
                </div>
              </div>
              
              <div className="col-span-12 md:col-span-3 w-full grid grid-cols-2 gap-4">
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-nordic/50">Joined</div>
                  <div className="text-sm font-semibold text-nordic dark:text-white">
                    {new Date(user.created_at).toLocaleDateString()}
                  </div>
                </div>
                <div>
                  <div className="text-[10px] uppercase tracking-wider text-nordic/50">Time</div>
                  <div className="text-sm font-semibold text-nordic dark:text-white">
                    {new Date(user.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
              
              <div className="col-span-12 md:col-span-2 w-full flex justify-end relative">
                <div className="w-full md:w-auto">
                  <UserRoleSelector userId={user.user_id} currentRole={user.role} />
                </div>
              </div>
            </div>
          ))
        )}
      </main>

      <footer className="mt-auto border-t border-nordic/5 bg-background-light dark:bg-background-dark py-6">
        <div className="flex items-center justify-between">
          <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-nordic/60 dark:text-gray-400">
                Showing <span className="font-medium text-nordic dark:text-white">1</span> to <span className="font-medium text-nordic dark:text-white">{users.length}</span> of <span className="font-medium text-nordic dark:text-white">{users.length}</span> users
              </p>
            </div>
            <div>
              <nav aria-label="Pagination" className="relative z-0 inline-flex rounded-md shadow-none -space-x-px">
                <button className="relative inline-flex items-center px-2 py-2 rounded-l-md text-sm font-medium text-nordic/50 hover:text-primary transition-colors cursor-not-allowed opacity-50">
                  <span className="sr-only">Previous</span>
                  <span className="material-icons text-xl">chevron_left</span>
                </button>
                <button aria-current="page" className="z-10 bg-nordic dark:bg-white text-white dark:text-nordic relative inline-flex items-center px-4 py-2 text-sm font-medium rounded-md mx-1 shadow-sm">
                  1
                </button>
                <button className="relative inline-flex items-center px-2 py-2 rounded-r-md text-sm font-medium text-nordic/50 hover:text-primary transition-colors cursor-not-allowed opacity-50">
                  <span className="sr-only">Next</span>
                  <span className="material-icons text-xl">chevron_right</span>
                </button>
              </nav>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
