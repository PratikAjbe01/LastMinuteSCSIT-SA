// src/features/smart-attendance/components/SessionTimer.jsx
import { useEffect, useState } from "react";
import { Clock } from "lucide-react";

const SessionTimer = ({ startTime }) => {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const tick = () => {
      setElapsed(Math.floor((Date.now() - new Date(startTime).getTime()) / 1000));
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [startTime]);

  const hrs  = Math.floor(elapsed / 3600);
  const mins = Math.floor((elapsed % 3600) / 60);
  const secs = elapsed % 60;
  const pad  = (n) => String(n).padStart(2, "0");

  // Color shifts as session gets longer
  const color =
    elapsed < 3600  ? "text-emerald-600" :
    elapsed < 7200  ? "text-amber-600"   : "text-red-600";

  return (
    <div className="flex items-center gap-2">
      <Clock className={`w-4 h-4 ${color} flex-shrink-0`} />
      <span className={`font-mono text-sm font-bold tabular-nums ${color}`}>
        {hrs > 0 && `${pad(hrs)}:`}
        {pad(mins)}:{pad(secs)}
      </span>
    </div>
  );
};

export default SessionTimer;