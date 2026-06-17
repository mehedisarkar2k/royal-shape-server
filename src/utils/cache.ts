import NodeCache from "node-cache";

// Initialize cache with no standard expiration (infinity), 
// we will invalidate it manually on mutations.
export const appCache = new NodeCache({ stdTTL: 0, checkperiod: 0 });
