import { useRef, useState, useEffect } from "react";

interface ResizableAsideProps {
  children: React.ReactNode;
  minWidth?: number;
  maxWidth?: number;
  defaultWidth?: number;
  className?: string;
}

export function ResizableAside({
  children,
  minWidth = 200,
  maxWidth = 600,
  defaultWidth = 280,
  className = "",
}: ResizableAsideProps) {
  const [width, setWidth] = useState(defaultWidth);
  const isResizing = useRef(false);

  const handleMouseDown = () => {
    isResizing.current = true;
  };

  const handleMouseMove = (e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = e.clientX;
    if (newWidth >= minWidth && newWidth <= maxWidth) {
      setWidth(newWidth);
    }
  };

  const handleMouseUp = () => {
    isResizing.current = false;
  };

  // Nasłuchiwacze na cały dokument
  useEffect(() => {
    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, []);

  return (
    <aside
      className={`p-4 relative h-screen overflow-auto bg-gray-50 ${className}`}
      style={{ width }}
    >
      {children}

      {/* Handle do przeciągania */}
      <div
        className="absolute top-0 right-0 h-full w-1 cursor-ew-resize bg-gray-300"
        onMouseDown={handleMouseDown}
      />
    </aside>
  );
}
