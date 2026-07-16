import { useEffect, useState } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase";

const KNOWN = ["family", "fil", "vale", "richi"];

export function useUserProfile() {
  const [state, setState] = useState({ user: null, profileId: null, loading: true });

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        setState({ user: null, profileId: null, loading: false });
        return;
      }
      try {
        const snap = await getDoc(doc(db, "users", user.uid));
        const raw = snap.exists() ? snap.data().profile : null;
        const profileId = KNOWN.includes(raw) ? raw : null;
        setState({ user, profileId, loading: false });
      } catch (err) {
        console.error("[useUserProfile] profilo non leggibile, vista ospite:", err);
        setState({ user, profileId: null, loading: false });
      }
    });
    return unsub;
  }, []);

  return state;
}