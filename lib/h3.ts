// Import H3 from here, never from "h3-js" directly: the shim must be evaluated before h3-js loads.
import "@/lib/h3-shim";

export * from "h3-js";
