'use client';

import { useRef, useEffect, useCallback } from 'react';
import type { TabId } from '@/lib/types';

interface TabBarProps {
  currentTab: TabId;
  onSwitchTab: (tab: TabId) => void;
}

const TABS: { id: TabId; label: string }[] = [
  { id: 'translation', label: '译文对比 & 技巧' },
  { id: 'grammar', label: '语法句式剖析' },
  { id: 'vocabulary', label: '重点词汇 & 拓展' },
];

export default function TabBar({ currentTab, onSwitchTab }: TabBarProps) {
  const barRef = useRef<HTMLDivElement>(null);
  const indicatorRef = useRef<HTMLDivElement>(null);

  const updateIndicator = useCallback(() => {
    if (!barRef.current || !indicatorRef.current) return;
    const activeBtn = barRef.current.querySelector(`[data-tab="${currentTab}"]`) as HTMLElement;
    if (!activeBtn) return;
    const barRect = barRef.current.getBoundingClientRect();
    const btnRect = activeBtn.getBoundingClientRect();
    indicatorRef.current.style.left = (btnRect.left - barRect.left) + 'px';
    indicatorRef.current.style.width = btnRect.width + 'px';
  }, [currentTab]);

  useEffect(() => {
    updateIndicator();
    window.addEventListener('resize', updateIndicator);
    return () => window.removeEventListener('resize', updateIndicator);
  }, [updateIndicator]);

  return (
    <div className="relative" style={{ borderBottom: '1px solid #d9d3cb' }}>
      <div className="flex" ref={barRef}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            data-tab={tab.id}
            onClick={() => onSwitchTab(tab.id)}
            className="py-3 px-5 text-sm font-semibold transition-all"
            style={{
              color: tab.id === currentTab ? '#1d4ed8' : '#6e6a63',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div ref={indicatorRef} className="tab-indicator-bar" />
    </div>
  );
}
