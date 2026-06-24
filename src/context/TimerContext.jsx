import { createContext, useContext, useState, useEffect, useRef } from "react"

const TimerContext = createContext()

export function TimerProvider({ children }) {
  const [timers, setTimers] = useState({})
  const intervalli = useRef({})

  function startTimer(key, secondi, ricettaNome, passoIndex, passoLabel) {
    if (intervalli.current[key]) clearInterval(intervalli.current[key])
    setTimers(prev => ({
      ...prev,
      [key]: { secondi, attivo: true, finito: false, ricettaNome, passoIndex, passoLabel }
    }))
  }

  function resetTimer(key) {
    clearInterval(intervalli.current[key])
    delete intervalli.current[key]
    setTimers(prev => {
      const nuovi = { ...prev }
      delete nuovi[key]
      return nuovi
    })
  }

  useEffect(() => {
    Object.keys(timers).forEach(key => {
      if (timers[key]?.attivo && !intervalli.current[key]) {
        intervalli.current[key] = setInterval(() => {
          setTimers(prev => {
            if (!prev[key]) return prev
            const s = prev[key].secondi - 1
            if (s <= 0) {
              clearInterval(intervalli.current[key])
              delete intervalli.current[key]
              try { new Audio("https://www.soundjay.com/buttons/beep-07.mp3").play() } catch(e) {}
              return { ...prev, [key]: { ...prev[key], secondi: 0, attivo: false, finito: true } }
            }
            return { ...prev, [key]: { ...prev[key], secondi: s } }
          })
        }, 1000)
      }
    })
  }, [timers])

  const timersAttivi = Object.values(timers).filter(t => t.attivo || t.finito)

  return (
    <TimerContext.Provider value={{ timers, startTimer, resetTimer, timersAttivi }}>
      {children}
    </TimerContext.Provider>
  )
}

export function useTimer() {
  return useContext(TimerContext)
}