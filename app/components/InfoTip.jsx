// Tombol (i) kecil yang membuka keterangan indikator: arti, cara hitung, tabel skor, catatan.
import { useEffect, useId, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { KPI } from "../lib/kpi.js";
import { Icon } from "./Icon.jsx";

const WIDTH = 320;

/** k: kunci di lib/kpi.js. now: kalimat angka saat ini (opsional), mis. "139 dari 158 kegiatan selesai". */
export function InfoTip({ k, now }) {
  const info = KPI[k];
  const [pos, setPos] = useState(null);
  const btn = useRef(null);
  const pop = useRef(null);
  const id = useId();
  const open = !!pos;

  const place = () => {
    const r = btn.current.getBoundingClientRect();
    const left = Math.min(Math.max(12, r.left + r.width / 2 - WIDTH / 2), window.innerWidth - WIDTH - 12);
    setPos({ top: r.bottom + 8, left, above: false, anchor: r.top });
  };
  // balik ke atas tombol bila tidak muat di bawah
  useLayoutEffect(() => {
    if (!pos || pos.above || !pop.current) return;
    const h = pop.current.offsetHeight;
    if (pos.top + h > window.innerHeight - 12 && pos.anchor - h - 8 > 12) setPos({ ...pos, top: pos.anchor - h - 8, above: true });
  }, [pos]);
  useEffect(() => {
    if (!open) return;
    const close = (e) => { if (!pop.current?.contains(e.target) && !btn.current?.contains(e.target)) setPos(null); };
    const esc = (e) => { if (e.key === "Escape") { setPos(null); btn.current?.focus(); } };
    const hide = () => setPos(null);
    document.addEventListener("pointerdown", close);
    document.addEventListener("keydown", esc);
    window.addEventListener("resize", hide);
    window.addEventListener("scroll", hide, true);
    return () => {
      document.removeEventListener("pointerdown", close);
      document.removeEventListener("keydown", esc);
      window.removeEventListener("resize", hide);
      window.removeEventListener("scroll", hide, true);
    };
  }, [open]);

  if (!info) return null;
  return (
    <>
      <button ref={btn} type="button" className={"info-btn" + (open ? " on" : "")} aria-label={"Keterangan " + info.title}
        aria-expanded={open} aria-controls={open ? id : undefined} onClick={(e) => { e.stopPropagation(); open ? setPos(null) : place(); }}>
        <Icon name="info" size={14} />
      </button>
      {open && createPortal(
        <div ref={pop} id={id} className="info-pop" role="dialog" aria-label={info.title} style={{ top: pos.top, left: pos.left, width: WIDTH }}>
          <b className="info-title">{info.title}</b>
          <p>{info.arti}</p>
          {now && <p className="info-now">{now}</p>}
          <div className="info-sec">
            <span>Cara hitung</span>
            <p>{info.rumus}</p>
          </div>
          {info.skor && (
            <dl className="info-tbl">
              {info.skor.map(([a, b]) => <div key={a} className={b.length > 14 ? "long" : ""}><dt>{a}</dt><dd>{b}</dd></div>)}
            </dl>
          )}
          {info.catatan && <p className="info-note">{info.catatan}</p>}
        </div>,
        document.body,
      )}
    </>
  );
}
