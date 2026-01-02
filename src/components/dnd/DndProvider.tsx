import React from 'react';
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  useSensor,
  useSensors,
  closestCorners,
} from '@dnd-kit/core';
import type { DragEndEvent, DragStartEvent } from '@dnd-kit/core';
import { SortableContext, rectSortingStrategy } from '@dnd-kit/sortable';

interface DndProviderProps {
  children: React.ReactNode;
  items: string[];
  onDragEnd: (event: DragEndEvent) => void;
  onDragStart?: (event: DragStartEvent) => void;
  activeId?: string | null;
  overlay?: React.ReactNode;
}

export const DndProvider: React.FC<DndProviderProps> = ({
  children,
  items,
  onDragEnd,
  onDragStart,
  overlay,
}) => {
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        // Lower threshold so the drag starts with a small movement
        distance: 2,
      },
    })
  );

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
    >
      <SortableContext items={items} strategy={rectSortingStrategy}>
        {children}
      </SortableContext>
      <DragOverlay>
        {overlay}
      </DragOverlay>
    </DndContext>
  );
};
