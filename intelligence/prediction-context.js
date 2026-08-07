import { settings } from "../settings/index.js";
import { FOCUS_MODES } from "./prediction-types.js";

function modeFromEvent(event){
  if (!event) return null;
  const text = `${event.title||""} ${event.type||""}`.toLowerCase();
  for (const [mode, keywords] of Object.entries(settings.modes?.rules || {})) {
    if ((keywords||[]).some(keyword => text.includes(keyword.toLowerCase()))) return mode;
  }
  return null;
}

export function determineFocusMode({current=null,next=null,now=new Date()} = {}){
  return modeFromEvent(current) ||
         modeFromEvent(next) ||
         (now.getHours() >= (settings.modes?.recoveryStartHour ?? 21)
           ? FOCUS_MODES.RECOVERY
           : (settings.modes?.defaultMode || FOCUS_MODES.HOME));
}
