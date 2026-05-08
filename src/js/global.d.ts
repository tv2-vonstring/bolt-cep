import { cep_node, cep, __adobe_cep__ } from "./lib/cep-types";

declare module "*.png";
declare module "*.gif";
declare module "*.jpg";
declare module "*.svg";

declare global {
  interface Window {
    cep_node: cep_node;
    cep: cep;
    __adobe_cep__: __adobe_cep__;
  }
  const __CEP_ID__: string;
  const HOSTED_URL: string;
  const IS_HOSTED: boolean;
}
