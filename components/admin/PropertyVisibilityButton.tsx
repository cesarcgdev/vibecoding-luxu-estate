"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import { setPropertyActive } from "@/app/actions/properties";

interface VisibilityButtonProps {
  propertyId: string;
  propertyTitle: string;
  isActive: boolean;
}

export default function PropertyVisibilityButton({
  propertyId,
  propertyTitle,
  isActive,
}: VisibilityButtonProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  // No confirmation step: hiding is reversible from the Hidden tab
  const handleToggle = () => {
    startTransition(async () => {
      const result = await setPropertyActive(propertyId, !isActive);
      if (result.success) {
        router.refresh();
      } else {
        alert(
          `Failed to ${isActive ? "hide" : "publish"} the property: ${result.error}`
        );
      }
    });
  };

  return (
    <button
      onClick={handleToggle}
      disabled={isPending}
      className="p-2 rounded-lg text-gray-400 hover:text-primary hover:bg-hint-green/30 transition-all disabled:opacity-50"
      title={
        isActive
          ? `Hide "${propertyTitle}" from the public site`
          : `Publish "${propertyTitle}"`
      }
    >
      <span className="material-icons text-xl">
        {isActive ? "visibility_off" : "visibility"}
      </span>
    </button>
  );
}
