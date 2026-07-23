"use client";

import { useTransition } from "react";
import { updateUserRole } from "@/app/actions/admin";

export default function UserRoleSelector({
  userId,
  currentRole,
}: {
  userId: string;
  currentRole: string;
}) {
  const [isPending, startTransition] = useTransition();

  const handleRoleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newRole = e.target.value;
    startTransition(async () => {
      const result = await updateUserRole(userId, newRole);
      if (!result.success) {
        alert("Failed to update role: " + result.error);
      }
    });
  };

  return (
    <select
      value={currentRole}
      onChange={handleRoleChange}
      disabled={isPending}
      className="bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white text-sm rounded-lg focus:ring-blue-500 focus:border-blue-500 block w-full p-2.5 disabled:opacity-50"
    >
      <option value="user">User</option>
      <option value="admin">Admin</option>
    </select>
  );
}
