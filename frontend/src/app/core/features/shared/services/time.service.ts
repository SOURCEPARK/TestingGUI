export function formatSeconds(totalSeconds: number): string {
    const seconds = totalSeconds % 60;
    const totalMinutes = Math.floor(totalSeconds / 60);
    const minutes = totalMinutes % 60;
    const totalHours = Math.floor(totalMinutes / 60);
    const hours = totalHours % 24;
    const days = Math.floor(totalHours / 24);

    const parts: string[] = [];

    if (days > 0) parts.push(`${days} ${days === 1 ? "Tag" : "Tage"}`);
    if (hours > 0) parts.push(`${hours} ${hours === 1 ? "Stunde" : "Stunden"}`);
    if (minutes > 0) parts.push(`${minutes} ${minutes === 1 ? "Minute" : "Minuten"}`);
    if (seconds > 0 || parts.length === 0) {
        parts.push(`${seconds} ${seconds === 1 ? "Sekunde" : "Sekunden"}`);
    }

    return parts.join(" ");
}