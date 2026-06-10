import { estimateLocalDelivery, estimateUberFallback, estimate99Fallback } from "../utils/deliveryPricing.js";
import { isUberConfigured, fetchUberQuote, scheduleUberDelivery } from "./courierProviders/uberDirect.js";
import { is99Configured, fetch99Quote, schedule99Delivery } from "./courierProviders/ninenine.js";

const getAvailableCouriers = () => [
  { id: "local", label: "Entrega local", available: true, mode: "local" },
  { id: "uber", label: "Uber Direct", available: true, mode: isUberConfigured() ? "api" : "simulated" },
  { id: "99", label: "99 Entrega", available: true, mode: is99Configured() ? "api" : "simulated" }
];

const getDeliveryQuote = async (provider, params) => {
  if (provider === "uber") {
    if (isUberConfigured()) {
      try {
        return await fetchUberQuote(params);
      } catch (err) {
        console.warn("Uber quote fallback:", err.message);
      }
    }
    return estimateUberFallback(params);
  }

  if (provider === "99") {
    if (is99Configured()) {
      try {
        return await fetch99Quote(params);
      } catch (err) {
        console.warn("99 quote fallback:", err.message);
      }
    }
    return estimate99Fallback(params);
  }

  return estimateLocalDelivery(params);
};

const scheduleExternalDelivery = async (courier, payload) => {
  if (courier === "uber" && isUberConfigured()) {
    try {
      return await scheduleUberDelivery(payload);
    } catch (err) {
      console.warn("Uber schedule fallback:", err.message);
    }
  }

  if (courier === "99" && is99Configured()) {
    try {
      return await schedule99Delivery(payload);
    } catch (err) {
      console.warn("99 schedule fallback:", err.message);
    }
  }

  return null;
};

export {
  getDeliveryQuote,
  estimateLocalDelivery,
  getAvailableCouriers,
  scheduleExternalDelivery
};
