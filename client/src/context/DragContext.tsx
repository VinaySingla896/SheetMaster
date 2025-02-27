
import React, { createContext, useContext, useState, ReactNode } from 'react';

type DragState = {
  isDragging: boolean;
  startCell: string | null;
  endCell: string | null;
  dragData: any;
};

type DragContextType = {
  dragState: DragState;
  startDrag: (cellRef: string, data: any) => void;
  updateDrag: (cellRef: string) => void;
  endDrag: () => void;
};

const DragContext = createContext<DragContextType | undefined>(undefined);

export function DragProvider({ children }: { children: ReactNode }) {
  const [dragState, setDragState] = useState<DragState>({
    isDragging: false,
    startCell: null,
    endCell: null,
    dragData: null,
  });

  const startDrag = (cellRef: string, data: any) => {
    setDragState({
      isDragging: true,
      startCell: cellRef,
      endCell: cellRef,
      dragData: data,
    });
  };

  const updateDrag = (cellRef: string) => {
    if (dragState.isDragging) {
      setDragState({
        ...dragState,
        endCell: cellRef,
      });
    }
  };

  const endDrag = () => {
    setDragState({
      isDragging: false,
      startCell: null,
      endCell: null,
      dragData: null,
    });
  };

  return (
    <DragContext.Provider value={{ dragState, startDrag, updateDrag, endDrag }}>
      {children}
    </DragContext.Provider>
  );
}

export function useDrag() {
  const context = useContext(DragContext);
  if (context === undefined) {
    throw new Error('useDrag must be used within a DragProvider');
  }
  return context;
}
