import { create } from 'zustand'

const useStore = create((set) => ({
    room: null, 
    winner: null, 
    isActor: false,
    emoji: null,
    timeLeft: null,


    setEmoji: (emoji) => set({ emoji }),
    setRoom: (room) => set({ room }),
    setWinner: (winner) => set({ winner }),
    setIsActor: (isActor) => set({ isActor }),
    setTimeLeft: (timeLeft) => set({ timeLeft }),
    reset: () => set({ room: null, winner: null, isActor: false, emoji: null, timeLeft: null }),
}))

export default useStore

