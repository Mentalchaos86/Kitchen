let currentPrediction = {
  now:null, next:null, later:[], gap:null, prepare:null,
  mode:"home", predictionType:"NONE", confidence:0, generatedAt:null
};
export function getPrediction(){ return currentPrediction; }
export function setPrediction(prediction){
  currentPrediction = prediction;
  window.dispatchEvent(new CustomEvent("homehub:prediction-change",{detail:currentPrediction}));
  return currentPrediction;
}
