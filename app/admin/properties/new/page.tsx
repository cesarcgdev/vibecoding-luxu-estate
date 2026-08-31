import Link from "next/link";
import PropertyForm from "@/components/admin/PropertyForm";
import { getLandlordOptions } from "@/lib/landlords";

export const metadata = {
  title: "Add New Property | LuxeEstate Admin",
  description: "Create a new property listing in the LuxeEstate admin panel.",
};

export default async function NewPropertyPage() {
  const landlords = await getLandlordOptions();

  return (
    <div className="w-full py-10">
      {/* Header */}
      <header className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-gray-200 pb-8">
        <div className="space-y-4">
          <nav aria-label="Breadcrumb" className="flex">
            <ol className="flex items-center space-x-2 text-sm text-gray-500 font-medium font-sf-pro">
              <li>
                <Link
                  href="/admin/properties"
                  className="hover:text-mosque transition-colors"
                >
                  Properties
                </Link>
              </li>
              <li>
                <span className="material-icons text-xs text-gray-400">
                  chevron_right
                </span>
              </li>
              <li aria-current="page" className="text-nordic">
                Add New
              </li>
            </ol>
          </nav>
          <div>
            <h1 className="text-3xl md:text-4xl font-bold text-nordic tracking-tight mb-2">
              Add New Property
            </h1>
            <p className="text-base text-gray-500 max-w-2xl font-normal font-sf-pro">
              Fill in the details below to create a new listing. Fields marked
              with * are mandatory.
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Link
            href="/admin/properties"
            className="px-5 py-2.5 rounded-lg border border-gray-300 bg-white text-nordic hover:bg-gray-50 transition-colors font-medium font-sf-pro text-sm"
          >
            Cancel
          </Link>
          <button
            type="submit"
            form="property-form"
            className="px-5 py-2.5 rounded-lg bg-mosque hover:bg-nordic text-white font-medium shadow-md hover:shadow-lg transition-all duration-200 flex items-center gap-2 font-sf-pro text-sm"
          >
            <span className="material-icons text-sm">save</span>
            Save Property
          </button>
        </div>
      </header>

      <PropertyForm landlords={landlords} />
    </div>
  );
}
