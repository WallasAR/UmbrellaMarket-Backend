import { haversineKm } from "../utils/geo.js";

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

const estimateUberDelivery = (params) => {
  const local = estimateLocalDelivery(params);
  return {
    ...local,
    courier: "uber",
    provider: process.env.UBER_API_KEY ? "uber_api" : "simulated",
    price: Number((local.price * 1.35).toFixed(2)),
    eta_minutes: Math.max(25, local.eta_minutes - 10)
  };
};

const estimate99Delivery = (params) => {
  const local = estimateLocalDelivery(params);
  return {
    ...local,
    courier: "99",
    provider: process.env.NINETYNINE_API_KEY ? "99_api" : "simulated",
    price: Number((local.price * 1.28).toFixed(2)),
    eta_minutes: Math.max(28, local.eta_minutes - 5)
  };
};

const getAvailableCouriers = () => {
  const couriers = [
    { id: "local", label: "Entrega local", available: true },
    { id: "uber", label: "Uber", available: true, mode: process.env.UBER_API_KEY ? "api" : "simulated" },
    { id: "99", label: "99 Entrega", available: true, mode: process.env.NINETYNINE_API_KEY ? "api" : "simulated" }
  ];
  return couriers;
};

const getDeliveryQuote = (provider, params) => {
  if (provider === "uber") return estimateUberDelivery(params);
  if (provider === "99") return estimate99Delivery(params);
  return estimateLocalDelivery(params);
};

export { getDeliveryQuote, estimateLocalDelivery, getAvailableCouriers };
