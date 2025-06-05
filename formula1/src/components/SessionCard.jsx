import React, { memo } from "react";

// Helper function to format seconds into MM:SS.mmm
const formatLapTime = (seconds) => {
    if (typeof seconds !== 'number' || isNaN(seconds)) {
        return "N/A";
    }
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    const milliseconds = Math.round((remainingSeconds - Math.floor(remainingSeconds)) * 1000);

    const formattedMinutes = String(minutes).padStart(2, '0');
    const formattedSeconds = String(Math.floor(remainingSeconds)).padStart(2, '0');
    const formattedMilliseconds = String(milliseconds).padStart(3, '0');

    return `${formattedMinutes}:${formattedSeconds}.${formattedMilliseconds}`;
};

const SessionCard = memo(({ session, fastestLapData, flippedCardKey, setFlippedCardKey }) => {
    const isFlipped = flippedCardKey === session.session_key;
    const teamColour = fastestLapData?.teamColour || '21212c'; // Default dark color if no team color is found

    return (
        <div
            className="qualifying-card"
            onClick={() => setFlippedCardKey(isFlipped ? null : session.session_key)}
        >
            <div className={`qualifying-card-inner ${isFlipped ? "is-flipped" : ""}`}>
                {/* --- Frente do Cartão (Informações da Sessão) --- */}
                <div className="qualifying-card-front">
                    <p>{session.location} - Circuito: {session.circuit_short_name} - <strong>{session.session_name}</strong></p>
                    <p>País: {session.country_name} - ({session.country_code}) </p>
                    <p>
                        Data: {new Date(session.date_start).toLocaleString('pt-BR', {
                            day: '2-digit', month: '2-digit', year: 'numeric',
                            hour: '2-digit', minute: '2-digit', hour12: false,
                        })}
                    </p>
                </div>

                {/* --- Verso do Cartão (Melhor Tempo de Volta) --- */}
                <div
                    className="qualifying-card-back"
                    style={{ backgroundColor: `#${teamColour}` }}
                >
                    {fastestLapData ? (
                        <>
                            <div className="qualifying-best-lap-background"
                                style={{ color: `#${teamColour}28` }}>
                            </div>
                            <p>Melhor Volta: </p>
                            <p>{fastestLapData.driverName} - {formatLapTime(fastestLapData.lapTime)}</p>
                        </>
                    ) : (
                        <p>Melhor Volta: Carregando...</p>
                    )}
                </div>
            </div>
        </div>
    );
});

export default SessionCard;