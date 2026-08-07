# Prediction Store

HomeHub exposes one public prediction API:

```js
import { getPrediction } from "./intelligence/prediction-api.js";
const prediction = getPrediction();
```

All future Predict UI modules should read from this shared source.
