import { toast } from "sonner";
import { getApiErrorMessage } from "./api-error";

export function toastApiError(error: unknown) {
  toast.error(getApiErrorMessage(error));
}
