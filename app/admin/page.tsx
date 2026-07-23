export const metadata = {
  title: "Admin Dashboard | Lux Estate",
};

export default function AdminPage() {
  return (
    <div className="space-y-6">
      <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
        Dashboard Overview
      </h1>
      <p className="text-gray-600 dark:text-gray-400">
        Welcome to the administration panel. Use the sidebar to manage your application.
      </p>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mt-8">
        {/* Simple Stats Cards */}
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Total Properties
          </h3>
          <p className="text-4xl font-bold mt-4 text-blue-600 dark:text-blue-400">
            --
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-6 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-700 dark:text-gray-300">
            Registered Users
          </h3>
          <p className="text-4xl font-bold mt-4 text-blue-600 dark:text-blue-400">
            --
          </p>
        </div>
      </div>
    </div>
  );
}
