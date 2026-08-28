import Image from "next/image";
import Link from "next/link";
import { getAdminProperties } from "@/app/actions/properties";
import DeletePropertyButton from "@/components/admin/DeletePropertyButton";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Property Management | LuxeEstate Admin",
};

export default async function AdminPropertiesPage() {
  const { data: properties, error } = await getAdminProperties();

  return (
    <div className="w-full py-10">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-nordic dark:text-white tracking-tight">
            My Properties
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Manage your portfolio and track performance.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="bg-white dark:bg-[#152e2a] border border-gray-200 dark:border-primary/30 text-nordic dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-primary/10 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors shadow-sm inline-flex items-center gap-2">
            <span className="material-icons text-base">filter_list</span>{" "}
            Filter
          </button>
          <Link
            href="/admin/properties/new"
            className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-medium shadow-md shadow-primary/20 transition-all transform hover:-translate-y-0.5 inline-flex items-center gap-2"
          >
            <span className="material-icons text-base">add</span> Add New
            Property
          </Link>
        </div>
      </div>

      {error && (
        <div className="mb-6 rounded-lg border border-red-200 bg-red-50 px-5 py-3 text-sm font-medium text-red-700">
          Could not load properties from Supabase: {error}
        </div>
      )}

      {/* Property List Container */}
      <div className="bg-white dark:bg-[#152e2a] rounded-xl shadow-sm border border-gray-200 dark:border-primary/20 overflow-hidden">
        {/* Table Header */}
        <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-4 bg-gray-50/50 dark:bg-primary/5 border-b border-gray-100 dark:border-primary/10 text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
          <div className="col-span-6">Property Details</div>
          <div className="col-span-2">Price</div>
          <div className="col-span-2">Status</div>
          <div className="col-span-2 text-right">Actions</div>
        </div>

        {properties.length === 0 ? (
          <div className="p-10 text-center text-nordic/50 dark:text-gray-400 bg-white dark:bg-[#152e2a]">
            No properties found.{" "}
            <Link
              href="/admin/properties/new"
              className="text-primary underline hover:no-underline"
            >
              Add your first property.
            </Link>
          </div>
        ) : (
          properties.map((property) => (
            <div
              key={property.id}
              className="group grid grid-cols-1 md:grid-cols-12 gap-4 px-6 py-5 border-b border-gray-100 dark:border-primary/10 hover:bg-background-light dark:hover:bg-primary/5 transition-colors items-center"
            >
              {/* Property Details */}
              <div className="col-span-12 md:col-span-6 flex gap-4 items-center">
                <div className="relative h-20 w-28 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200 dark:bg-gray-800">
                  <Image
                    src={property.images?.[0] || "/images/placeholder.jpg"}
                    alt={property.title}
                    fill
                    className="object-cover transition-transform duration-500 group-hover:scale-105"
                  />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-nordic dark:text-white group-hover:text-primary transition-colors">
                    {property.title}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {property.location}
                  </p>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-gray-400 dark:text-gray-500">
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">bed</span>{" "}
                      {property.beds} Beds
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span className="flex items-center gap-1">
                      <span className="material-icons text-[14px]">
                        bathtub
                      </span>{" "}
                      {property.baths} Baths
                    </span>
                    <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                    <span>{property.listing_type || "Sale"}</span>
                  </div>
                </div>
              </div>

              {/* Price */}
              <div className="col-span-6 md:col-span-2">
                <div className="text-base font-semibold text-nordic dark:text-gray-200">
                  {property.price_display}
                </div>
                <div className="text-xs text-gray-400">
                  Created:{" "}
                  {new Date(property.created_at).toLocaleDateString()}
                </div>
              </div>

              {/* Status */}
              <div className="col-span-6 md:col-span-2">
                <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-hint-green text-primary border border-primary/10">
                  <span className="w-1.5 h-1.5 rounded-full bg-primary mr-1.5"></span>
                  Active
                </span>
              </div>

              {/* Actions */}
              <div className="col-span-12 md:col-span-2 flex items-center justify-end gap-2">
                <Link
                  href={`/admin/properties/${property.id}/edit`}
                  className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-hint-green/30 transition-all"
                  title="Edit Property"
                >
                  <span className="material-icons text-xl">edit</span>
                </Link>
                <DeletePropertyButton
                  propertyId={property.id}
                  propertyTitle={property.title}
                />
              </div>
            </div>
          ))
        )}

        {/* Pagination */}
        <div className="px-6 py-4 flex items-center justify-between bg-gray-50/50 dark:bg-primary/5">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing{" "}
            <span className="font-medium text-nordic dark:text-white">1</span>{" "}
            to{" "}
            <span className="font-medium text-nordic dark:text-white">
              {properties.length}
            </span>{" "}
            of{" "}
            <span className="font-medium text-nordic dark:text-white">
              {properties.length}
            </span>{" "}
            results
          </div>
          <div className="flex gap-2">
            <button
              className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-primary/20 disabled:opacity-50"
              disabled
            >
              Previous
            </button>
            <button
              className="px-3 py-1 text-sm border border-gray-200 dark:border-primary/30 rounded-md text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-primary/20"
              disabled
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
