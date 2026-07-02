import React from 'react';

export const ProductCardSkeleton = () => {
  return (
    <div className="flex flex-col gap-3 animate-pulse">
      <div className="aspect-[4/5] w-full rounded-sm bg-surface-100" />
      <div className="space-y-2">
        <div className="h-3 w-3/4 rounded bg-surface-100" />
        <div className="h-4 w-1/2 rounded bg-surface-100" />
      </div>
    </div>
  );
};

export const DashboardTableSkeleton = () => {
  return (
    <div className="overflow-hidden rounded-2xl border border-white/10 bg-surface-50/40 shadow-soft backdrop-blur-md animate-pulse">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-surface-100 bg-surface-50/30 text-[10px] font-bold uppercase tracking-wider text-app-text/45">
              <th className="px-6 py-4">Image</th>
              <th className="px-6 py-4">Title</th>
              <th className="px-6 py-4">Category</th>
              <th className="px-6 py-4">Original Price</th>
              <th className="px-6 py-4">Discount Price</th>
              <th className="px-6 py-4 text-center">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-surface-100/40">
            {[...Array(5)].map((_, index) => (
              <tr key={index}>
                <td className="px-6 py-4">
                  <div className="h-10 w-10 rounded-xl bg-surface-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-36 rounded-lg bg-surface-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-24 rounded-lg bg-surface-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-16 rounded-lg bg-surface-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="h-4 w-16 rounded-lg bg-surface-100" />
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-8 w-8 rounded-xl bg-surface-100" />
                    <div className="h-8 w-8 rounded-xl bg-surface-100" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
