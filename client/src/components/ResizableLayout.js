import React, { useState, useCallback, useRef, useEffect } from 'react';

const ResizableLayout = ({ 
  leftPanel, 
  middlePanel, 
  rightPanel, 
  showMiddle = false 
}) => {
  // Default widths: 2-panel mode (50/50), 3-panel mode (33/33/33)
  const [leftWidth, setLeftWidth] = useState(50);
  const [middleWidth, setMiddleWidth] = useState(33);
  
  const containerRef = useRef(null);
  const isDraggingRef = useRef(null);
  const startXRef = useRef(0);
  const startWidthsRef = useRef({ left: 0, middle: 0 });
  const [isDragging, setIsDragging] = useState(false);

  // Reset widths when middle panel visibility changes
  useEffect(() => {
    if (showMiddle) {
      setLeftWidth(33);
      setMiddleWidth(33);
    } else {
      setLeftWidth(50);
    }
  }, [showMiddle]);

  const handleMouseDown = useCallback((divider, e) => {
    e.preventDefault();
    e.stopPropagation();
    isDraggingRef.current = divider;
    startXRef.current = e.clientX;
    startWidthsRef.current = {
      left: leftWidth,
      middle: middleWidth
    };
    
    setIsDragging(true);
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';
  }, [leftWidth, middleWidth]);

  const handleMouseMove = useCallback((e) => {
    if (!isDraggingRef.current || !containerRef.current) return;

    const container = containerRef.current;
    const containerWidth = container.getBoundingClientRect().width;
    const deltaX = e.clientX - startXRef.current;
    const deltaPercent = (deltaX / containerWidth) * 100;

    if (isDraggingRef.current === 'left') {
      // Dragging between left (Code) and middle (PDF Preview)
      const newLeftWidth = startWidthsRef.current.left + deltaPercent;
      
      if (showMiddle) {
        // In 3-panel mode: adjust both left and middle to keep right panel fixed
        const totalLeftMiddle = startWidthsRef.current.left + startWidthsRef.current.middle;
        const newMiddleWidth = totalLeftMiddle - newLeftWidth;
        
        // Constrain so both panels have minimum 20%
        if (newLeftWidth >= 20 && newMiddleWidth >= 20) {
          setLeftWidth(newLeftWidth);
          setMiddleWidth(newMiddleWidth);
        }
      } else {
        // In 2-panel mode: just adjust left panel
        const constrainedLeftWidth = Math.max(20, Math.min(80, newLeftWidth));
        setLeftWidth(constrainedLeftWidth);
      }
      
    } else if (isDraggingRef.current === 'middle' && showMiddle) {
      // Dragging between middle (PDF Preview) and right (Chat)
      const newMiddleWidth = startWidthsRef.current.middle + deltaPercent;
      
      // Calculate max middle width (total - left - minimum right)
      const maxMiddleWidth = 100 - leftWidth - 20;
      const constrainedMiddleWidth = Math.max(20, Math.min(maxMiddleWidth, newMiddleWidth));
      
      setMiddleWidth(constrainedMiddleWidth);
    }
  }, [leftWidth, showMiddle]);

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = null;
    setIsDragging(false);
    document.body.style.cursor = '';
    document.body.style.userSelect = '';
  }, []);

  // Always listen for mouse events
  useEffect(() => {
    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleMouseMove, handleMouseUp]);

  // Calculate right panel width
  const rightWidth = showMiddle 
    ? Math.max(20, 100 - leftWidth - middleWidth) 
    : Math.max(20, 100 - leftWidth);

  return (
    <div ref={containerRef} className="flex h-full w-full overflow-hidden relative">
      {/* Overlay to prevent iframe from capturing mouse events while dragging */}
      {isDragging && (
        <div 
          className="absolute inset-0 z-50 cursor-col-resize"
          style={{ pointerEvents: 'all' }}
        />
      )}

      {/* Left Panel - Code Editor */}
      <div 
        className="border-r border-gray-300 bg-white flex flex-col overflow-hidden"
        style={{ width: `${leftWidth}%`, flexShrink: 0 }}
      >
        {leftPanel}
      </div>

      {/* Left Divider */}
      <div
        className="w-1 bg-gray-300 hover:bg-primary-500 cursor-col-resize transition-colors flex-shrink-0 select-none"
        onMouseDown={(e) => handleMouseDown('left', e)}
        style={{ minWidth: '4px' }}
      />

      {/* Middle Panel - PDF Preview */}
      <div 
        className="bg-gray-100 flex flex-col overflow-hidden"
        style={{ 
          width: showMiddle ? `${middleWidth}%` : `${rightWidth}%`,
          flexShrink: 0,
          borderRight: showMiddle ? '1px solid #d1d5db' : 'none'
        }}
      >
        {middlePanel}
      </div>

      {/* Middle Divider (only show when chat is open) */}
      {showMiddle && (
        <>
          <div
            className="w-1 bg-gray-300 hover:bg-primary-500 cursor-col-resize transition-colors flex-shrink-0 select-none"
            onMouseDown={(e) => handleMouseDown('middle', e)}
            style={{ minWidth: '4px' }}
          />

          {/* Right Panel - Chat */}
          <div 
            className="bg-[#1a1a1a] flex flex-col overflow-hidden"
            style={{ width: `${rightWidth}%`, flexShrink: 0 }}
          >
            {rightPanel}
          </div>
        </>
      )}
    </div>
  );
};

export default ResizableLayout;
