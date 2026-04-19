import React, { useState, useEffect } from 'react';
import {
  useFloating,
  autoUpdate,
  offset,
  flip,
  shift,
  size,
  useInteractions,
  useRole,
  useClick,
  useDismiss,
  FloatingPortal,
  FloatingFocusManager,
} from '@floating-ui/react';

interface SmartPopoverProps {
  trigger: React.ReactNode;
  content?: React.ReactNode;
  children?: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  placement?: 'top' | 'top-start' | 'top-end' | 'right' | 'right-start' | 'right-end' | 'bottom' | 'bottom-start' | 'bottom-end' | 'left' | 'left-start' | 'left-end';
}

const SmartPopover: React.FC<SmartPopoverProps> = ({
  trigger,
  content,
  children,
  isOpen,
  onClose,
  placement = 'bottom',
}) => {
  const { refs, floatingStyles, context } = useFloating({
    open: isOpen,
    onOpenChange: (open) => {
      if (!open) onClose();
    },
    middleware: [
      offset(8),
      flip({ padding: 16 }),
      shift({ padding: 16, crossAxis: true }),
      size({
        apply({ elements }) {
          Object.assign(elements.floating.style, {
            maxHeight: 'calc(100vh - 32px)',
          });
        },
      }),
    ],
    whileElementsMounted: autoUpdate,
    placement,
  });

  const click = useClick(context);
  const dismiss = useDismiss(context);
  const role = useRole(context);

  const { getReferenceProps, getFloatingProps } = useInteractions([
    click,
    dismiss,
    role,
  ]);

  return (
    <>
      <div ref={refs.setReference} {...getReferenceProps()} className="inline-block">
        {trigger}
      </div>
      {isOpen && (
        <FloatingPortal>
          <FloatingFocusManager context={context} modal={false}>
            <div
              ref={refs.setFloating}
              style={floatingStyles}
              {...getFloatingProps()}
              className="z-[9999] outline-none flex flex-col"
            >
              {content || children}
            </div>
          </FloatingFocusManager>
        </FloatingPortal>
      )}
    </>
  );
};

export default SmartPopover;
