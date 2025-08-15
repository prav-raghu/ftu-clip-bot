interface MascotProps {
  readonly onDoubleClick?: () => void;
}

export default function Mascot({ onDoubleClick }: MascotProps) {
  return (
    <div className="mascot" onDoubleClick={onDoubleClick}>
      <div className="sprite" title="FTU Clip Bot Mascot" />
    </div>
  );
}
