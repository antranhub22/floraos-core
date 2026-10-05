import { Check } from "lucide-react"
import { coordinatorProgress } from "@/modules/greeting-card/domain/coordinator-progress"

/** Dải bước xưởng: ✓ bước đã xong, chấm đậm bước đang làm. */
export function CoordinatorProgressStrip(props: { status: string; productionStatus: string; deliveryStatus: string }) {
  const steps = coordinatorProgress(props)
  return (
    <ol className="grid grid-cols-4 gap-1" aria-label="Tiến độ xưởng">
      {steps.map((s) => (
        <li key={s.key} className="flex flex-col items-center gap-1 text-center">
          <span
            className={`flex h-6 w-6 items-center justify-center rounded-full border text-caption font-bold ${
              s.state === "done"
                ? "border-success bg-success text-surface"
                : s.state === "current"
                  ? "border-primary bg-primary/10 text-primary"
                  : "border-border text-text-muted"
            }`}
          >
            {s.state === "done" ? <Check size={14} aria-hidden="true" /> : null}
          </span>
          <span className={`text-caption ${s.state === "pending" ? "text-text-muted" : "font-semibold text-foreground"}`}>
            {s.label}
            <span className="sr-only">{s.state === "done" ? " (đã xong)" : s.state === "current" ? " (đang làm)" : " (chưa tới)"}</span>
          </span>
        </li>
      ))}
    </ol>
  )
}
