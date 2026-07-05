import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import InsightsDashboard from '../components/insights/InsightsDashboard';

export default function InsightsPage() {
  const { workspaceId } = useParams();
  
  return (
    <div className="flex-1 flex flex-col h-full bg-[#F4F6F9] dark:bg-[#13151A] text-zinc-900 dark:text-zinc-100 overflow-hidden">
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <InsightsDashboard workspaceId={workspaceId} />
      </div>
    </div>
  );
}
