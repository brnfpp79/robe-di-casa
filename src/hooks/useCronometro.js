import { useEffect, useRef } from "react";
import { useUserProfile } from "./useUserProfile";
import { registraTempo } from "../attivita/attivita";

/* Cronometro "schermata aperta": conta finché il componente è montato e la
   scheda è visibile; a smontaggio (o quando la scheda passa in background)
   scarica i secondi accumulati nel documento di oggi.
   Uso:  useCronometro("matematica");                                        */
export function useCronometro(sezione) {
  const { profileId } = useUserProfile();
  const inizio = useRef(null);

  useEffect(() => {
    if (!profileId) return;

    const avvia = () => { if (inizio.current == null) inizio.current = Date.now(); };
    const ferma = () => {
      if (inizio.current == null) return;
      const sec = (Date.now() - inizio.current) / 1000;
      inizio.current = null;
      registraTempo(profileId, sezione, sec).catch((e) => console.error("Tempo non salvato:", e));
    };
    const onVis = () => (document.hidden ? ferma() : avvia());

    avvia();
    document.addEventListener("visibilitychange", onVis);
    return () => { ferma(); document.removeEventListener("visibilitychange", onVis); };
  }, [profileId, sezione]);
}