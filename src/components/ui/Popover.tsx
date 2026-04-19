import React from 'react';
import * as RadixPopover from '@radix-ui/react-popover';

interface PopoverProps {
  trigger: React.ReactNode;
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  align?: 'start' | 'center' | 'end';
  side?: 'top' | 'right' | 'bottom' | 'left';
  sideOffset?: number;
}

const Popover: React.FC<PopoverProps> = ({ 
  trigger, 
  children, 
  open, 
  onOpenChange,
  align = 'center',
  side = 'bottom',
  sideOffset = 5
}) => {
  return (
    <RadixPopover.Root open={open} onOpenChange={onOpenChange}>
      <RadixPopover.Trigger asChild>
        {trigger}
      </RadixPopover.Trigger>
      <RadixPopover.Portal>
        <RadixPopover.Content 
          align={align}
          side={side}
          sideOffset={sideOffset}
          className="z-[9999] animate-in fade-in zoom-in-95 duration-200"
        >
          {children}
        </RadixPopover.Content>
      </RadixPopover.Portal>
    </RadixPopover.Root>
  );
};

export default Popover;
