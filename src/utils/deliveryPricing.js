import { haversineKm } from "./geo.js";

const BASE_FEE = 6.9;
const PER_KM_RATE = 2.5;
const MIN_ETA_MINUTES = 30;
const MAX_ETA_MINUTES = 120;

const estimateLocalDelivery = ({ originLat, originLng, destLat, destLng }) => {
  const distanceKm = haversineKm(originLat, originLng, destLat, destLng);
  const price = Number((BASE_FEE + distanceKm * PER_KM_RATE).toFixed(2));
  const etaMinutes = Math.min(
    MAX_ETA_MINUTES,
    Math.max(MIN_ETA_MINUTES, Math.round(distanceKm * 8 + 20))
  );

  return {
    courier: "local",
    price,
    eta_minutes: etaMinutes,
    distance_km: Number(distanceKm.toFixed(2))
  };
};

const estimateUberFallback = (params) => {
  const local = estimateLocalDelivery(params);
  return {
    ...local,
    courier: "uber",
    provider: "simulated",
    price: Number((local.price * 1.35).toFixed(2)),
    eta_minutes: Math.max(25, local.eta_minutes - 10)
  };
};

const estimate99Fallback = (params) => {
  const local = estimateLocalDelivery(params);
  return {
    ...local,
    courier: "99",
    provider: "simulated",
    price: Number((local.price * 1.28).toFixed(2)),
    eta_minutes: Math.max(28, local.eta_minutes - 5)
  };
};

export { estimateLocalDelivery, estimateUberFallback, estimate99Fallback };
