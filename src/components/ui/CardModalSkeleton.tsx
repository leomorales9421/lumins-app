import React from 'react';

const CardModalSkeleton: React.FC = () => {
  return (
    <div className="flex flex-col h-full animate-pulse">
      {/* Scrollable Content Area - Replicating the internal padding and layout */}
      <div className="flex-1 overflow-y-auto p-8 pt-6">
        
        {/* Card Title Skeleton */}
        <div className="mb-8">
          <div className="w-3/4 h-10 bg-[#F4F5F7] rounded-xl mb-3" />
          <div className="w-1/2 h-10 bg-[#F4F5F7] rounded-xl" />
        </div>

        {/* Labels & Members Display Skeleton */}
        <div className="flex flex-wrap items-center gap-8 mb-8">
          {/* Labels Section */}
          <div className="flex flex-col gap-2">
            <div className="w-20 h-3 bg-[#F4F5F7] rounded-full mb-1" />
            <div className="flex gap-2">
              <div className="w-16 h-7 bg-[#F4F5F7] rounded-lg" />
              <div className="w-20 h-7 bg-[#F4F5F7] rounded-lg" />
            </div>
          </div>

          {/* Members Section */}
          <div className="flex flex-col gap-2">
            <div className="w-24 h-3 bg-[#F4F5F7] rounded-full mb-1" />
            <div className="flex -space-x-2">
              <div className="w-8 h-8 rounded-full bg-[#F4F5F7] border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-[#F4F5F7] border-2 border-white" />
              <div className="w-8 h-8 rounded-full bg-slate-100 border-2 border-white" />
            </div>
          </div>

          {/* Dates Section */}
          <div className="flex flex-col gap-2">
            <div className="w-16 h-3 bg-[#F4F5F7] rounded-full mb-1" />
            <div className="w-32 h-7 bg-[#F4F5F7] rounded-lg" />
          </div>
        </div>

        {/* Grid Layout (2 columns) */}
        <div className="grid grid-cols-1 md:grid-cols-[2fr_1fr] gap-12">
          
          {/* LEFT COLUMN: Main Content */}
          <div className="space-y-10">
            
            {/* Quick Actions Bar Skeleton */}
            <div className="flex flex-wrap gap-3">
              <div className="w-28 h-10 bg-[#F4F5F7] rounded-[12px]" />
              <div className="w-32 h-10 bg-[#F4F5F7] rounded-[12px]" />
              <div className="w-32 h-10 bg-[#F4F5F7] rounded-[12px]" />
            </div>

            {/* Description Section Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#F4F5F7] rounded-md" />
                <div className="w-32 h-6 bg-[#F4F5F7] rounded-lg" />
              </div>
              <div className="w-full h-40 bg-[#F4F5F7] rounded-2xl" />
            </div>

            {/* Checklist Section Skeleton */}
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#F4F5F7] rounded-md" />
                <div className="w-40 h-6 bg-[#F4F5F7] rounded-lg" />
              </div>
              <div className="space-y-3 pl-9">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-5 h-5 bg-[#F4F5F7] rounded" />
                    <div className="flex-1 h-5 bg-[#F4F5F7] rounded-lg" />
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: Activity & Sidebar Buttons */}
          <div className="space-y-8">
            {/* Lateral Buttons Set 1: Add to card */}
            <div className="space-y-2">
              <div className="w-20 h-4 bg-[#F4F5F7] rounded-full mb-3" />
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="w-full h-9 bg-[#F4F5F7] rounded-xl" />
              ))}
            </div>

            {/* Lateral Buttons Set 2: Actions */}
            <div className="space-y-2">
              <div className="w-20 h-4 bg-[#F4F5F7] rounded-full mb-3" />
              {[1, 2, 3].map((i) => (
                <div key={i} className="w-full h-9 bg-[#F4F5F7] rounded-xl" />
              ))}
            </div>

            {/* Activity Feed Skeleton */}
            <div className="space-y-6 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 bg-[#F4F5F7] rounded-md" />
                <div className="w-28 h-6 bg-[#F4F5F7] rounded-lg" />
              </div>
              
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex gap-3">
                    <div className="w-9 h-9 rounded-full bg-[#F4F5F7] flex-shrink-0" />
                    <div className="flex-1 space-y-2">
                      <div className="w-1/2 h-3 bg-[#F4F5F7] rounded-full" />
                      <div className="w-full h-12 bg-[#F4F5F7] rounded-xl" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardModalSkeleton;
