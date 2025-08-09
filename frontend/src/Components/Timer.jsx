const Timer = ({timeLeft}) => {

    const m = math.floor(timeLeft/60)
    const s = timeLeft % 60

    return (
        <div className="timer">
        {m}:{s.toString().padStart(2, "0")}
        </div>
    )
}

export default Timer