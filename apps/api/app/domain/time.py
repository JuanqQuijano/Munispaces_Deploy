from datetime import date

from app.domain.enums import DAY_SLOTS


def minutes_to_label(minutes: int) -> str:
    hours = minutes // 60
    mins = minutes % 60
    period = "pm" if hours >= 12 else "am"
    hour12 = hours % 12 or 12
    return f"{hour12:02d}:{mins:02d} {period}"


def slot_range_label(slots: list[int]) -> str:
    if not slots:
        return ""
    ordered = sorted(slots)
    return f"{minutes_to_label(ordered[0])} - {minutes_to_label(ordered[-1] + 60)}"


def parse_slot_label(text: str) -> int | None:
    raw = text.strip().lower().replace(".", "")
    for period in ("am", "pm"):
        if raw.endswith(period):
            clock = raw[: -len(period)].strip()
            if ":" not in clock:
                return None
            hour_s, min_s = clock.split(":", 1)
            try:
                hours = int(hour_s)
                mins = int(min_s)
            except ValueError:
                return None
            if period == "pm" and hours != 12:
                hours += 12
            if period == "am" and hours == 12:
                hours = 0
            return hours * 60 + mins
    return None


def slots_overlap(left: list[int], right: list[int]) -> bool:
    return bool(set(left) & set(right))


def is_valid_day_slots(slots: list[int]) -> bool:
    if not slots:
        return False
    ordered = sorted(slots)
    allowed = set(DAY_SLOTS)
    if any(slot not in allowed for slot in ordered):
        return False
    consecutive = all(ordered[i] + 60 == ordered[i + 1] for i in range(len(ordered) - 1))
    return consecutive


def parse_fecha(value: str | None) -> date:
    if not value:
        return date.today()
    text = value.strip()
    if "/" in text:
        day, month, year = text.split("/")
        return date(int(year), int(month), int(day))
    return date.fromisoformat(text)
