const EVENT_NAME = "boardgame-wiki:achievement-earned";

export function celebrateAchievement(label: string) {
  window.dispatchEvent(new CustomEvent<string>(EVENT_NAME, { detail: label }));
}

export function onAchievementEarned(handler: (label: string) => void) {
  const listener = (e: Event) => handler((e as CustomEvent<string>).detail);
  window.addEventListener(EVENT_NAME, listener);
  return () => window.removeEventListener(EVENT_NAME, listener);
}
