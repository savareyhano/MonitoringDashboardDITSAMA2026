// Kartu kemajuan: persentase + uraian kegiatan terakhir yang sudah terlaksana.
import { useState } from "react";
import {
  activityStatus, attendance, fmtDate, fmtDateLong, fmtRelative, phaseLabel, programLabel, progressLabel,
} from "../lib/format.js";
import { ActivityDetail } from "./Activities.jsx";
import { Icon } from "./Icon.jsx";
import { InfoTip } from "./InfoTip.jsx";
import { Bar, StatusBadge } from "./ui.jsx";

// kegiatan terakhir yang sudah terlaksana (tanggal hari ini atau sebelumnya, paling baru)
export function lastPerformed(activities) {
  const today = new Date(); today.setHours(23, 59, 59, 999);
  return activities
    .filter((a) => a.date && new Date(a.date) <= today)
    .sort((a, b) => new Date(b.date) - new Date(a.date) || new Date(b.createdAt) - new Date(a.createdAt))[0] || null;
}

// kalimat ringkas dari data kegiatan: kapan, di mana, kehadiran, nilai, isu
function describe(a) {
  const att = attendance(a.participants);
  const parts = [`Dilaksanakan ${fmtDateLong(a.date)}${a.location ? ` di ${a.location}` : ""}${a.phase ? ` (${phaseLabel(a.phase)})` : ""}.`];
  if (att.reg) parts.push(`Dihadiri ${att.pres.toLocaleString("id-ID")} dari ${att.reg.toLocaleString("id-ID")} peserta terdaftar (${att.pct}%).`);
  const scores = [a.achievementValue != null && `nilai capaian ${a.achievementValue}`, a.feedback != null && `umpan balik ${a.feedback}`].filter(Boolean);
  if (scores.length) parts.push(scores.join(" dan ").replace(/^./, (c) => c.toUpperCase()) + ".");
  if (a.progress) parts.push(`Keberjalanan: ${progressLabel(a.progress)}.`);
  if (a.issues?.length) parts.push(`${a.issues.length} isu tercatat.`);
  return parts.join(" ");
}

/**
 * last: kegiatan lengkap (rincian bisa dibuka) atau ringkasan kalender (tanpa peserta/nilai).
 * info: kunci keterangan (lib/kpi.js); kpi: jumlah kegiatan per status, ditampilkan di keterangan.
 * value/unit/note opsional: angka besar (mis. "3/10") + satuannya + keterangan di bawah bar; default `${progress}%`.
 */
export function ProgressSummary({ label, info, progress, value, unit, note, kpi, last, showProgram }) {
  const [open, setOpen] = useState(false);
  const full = !!last?.participants;
  const name = showProgram ? `${programLabel(last?.program)} — ${last?.name}` : last?.name;
  return (
    <section className="card progress-card">
      <div className="pc-progress">
        <span className="kpi-lab"><Icon name="trend" size={15} />{label}<InfoTip k={info} now={kpi && `Saat ini: ${kpi.totalDone} selesai dari ${kpi.totalActivities} aktivitas (${kpi.totalOngoing} berlangsung, ${kpi.totalUpcoming} akan datang).`} /></span>
        <div className="pc-valrow"><b className="pc-val">{value ?? progress + "%"}</b>{unit && <span className="pc-unit">{unit}</span>}</div>
        <Bar value={progress} tone={progress >= 80 ? "ok" : progress >= 50 ? "" : "warn"} />
        {note && <span className="pc-note">{note}</span>}
      </div>
      <div className="pc-last">
        <span className="kpi-lab"><Icon name="checkCircle" size={15} />Aktivitas Terakhir<InfoTip k="lastActivity" /></span>
        {!last ? <p className="pc-desc muted">Belum ada aktivitas yang terlaksana.</p> : (
          <>
            <div className="pc-head">
              {full
                ? <button type="button" className="row-link" onClick={() => setOpen(true)}>{name}</button>
                : <b className="pc-name">{name}</b>}
              <StatusBadge status={activityStatus(last)} />
            </div>
            <p className="pc-desc">{describe(last)}</p>
            <div className="row-meta">
              <span title={fmtDate(last.date)}>{fmtRelative(last.date)}</span>
              {last.pic && <span>PIC {last.pic}</span>}
            </div>
          </>
        )}
      </div>
      {full && <ActivityDetail activity={open ? last : null} onClose={() => setOpen(false)} canEdit={false} />}
    </section>
  );
}
