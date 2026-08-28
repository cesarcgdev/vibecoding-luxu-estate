"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { deleteProperty } from "@/app/actions/properties";

interface DeleteButtonProps {
  propertyId: string;
  propertyTitle: string;
}

export default function DeletePropertyButton({
  propertyId,
  propertyTitle,
}: DeleteButtonProps) {
  const [isPending, startTransition] = useTransition();
  const [showConfirm, setShowConfirm] = useState(false);
  const router = useRouter();

  const handleDelete = () => {
    startTransition(async () => {
      const result = await deleteProperty(propertyId);
      if (result.success) {
        router.refresh();
      } else {
        alert(`Failed to delete: ${result.error}`);
      }
      setShowConfirm(false);
    });
  };

  if (showConfirm) {
    return (
      <div className="flex items-center gap-1">
        <span className="text-xs text-red-600 font-medium font-sf-pro whitespace-nowrap">
          Delete?
        </span>
        <button
          onClick={handleDelete}
          disabled={isPending}
          className="p-1.5 rounded-md text-white bg-red-500 hover:bg-red-600 transition-all text-xs font-medium font-sf-pro disabled:opacity-50"
          title="Confirm delete"
        >
          {isPending ? "…" : "Yes"}
        </button>
        <button
          onClick={() => setShowConfirm(false)}
          className="p-1.5 rounded-md text-gray-600 bg-gray-100 hover:bg-gray-200 transition-all text-xs font-medium font-sf-pro"
          title="Cancel"
        >
          No
        </button>
      </div>
    );
  }

  return (
    <button
      onClick={() => setShowConfirm(true)}
      className="p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
      title="Delete Property"
    >
      <span className="material-icons text-xl">delete_outline</span>
    </button>
  );
}
