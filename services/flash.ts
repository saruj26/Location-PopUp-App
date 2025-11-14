let _flashMessage: string | null = null;

export function setFlash(message: string) {
  _flashMessage = message;
}

export function consumeFlash(): string | null {
  const m = _flashMessage;
  _flashMessage = null;
  return m;
}
