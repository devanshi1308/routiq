// Scripted driver replies for the demo. A real app would send messages over a websocket.
export const QUICK_REPLIES = ["I'm here", "Be right there", "I'm looking for you", "Where are you?"];

export const driverReply = (text: string, etaSec: number): string => {
  const t = text.toLowerCase();
  const mins = Math.max(1, Math.ceil(etaSec / 60));
  if (/where|how far|eta|when/.test(t)) return etaSec > 0 ? `I'm about ${mins} min away.` : "I'm at the pickup point now.";
  if (/looking for you|can.t find|where r u/.test(t)) return "I can see the pickup point. I'll find you, please stay there.";
  if (/be right there|coming/.test(t)) return "No problem, I'll wait for you.";
  if (/wait/.test(t)) return "Sure, no problem. I'll wait.";
  if (/gate|here|outside|standing|at the/.test(t)) return "Okay, I can see the location. Coming to you.";
  if (/shirt|wearing|dress|wear/.test(t)) return "Got it, I'll look out for you.";
  if (/pin|otp/.test(t)) return "Please share the 4-digit PIN when I arrive.";
  if (/thank/.test(t)) return "You're welcome!";
  return "Okay 👍";
};
