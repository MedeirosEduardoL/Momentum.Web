import { useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { readLinkToken } from "./link-token";

export function useLinkToken() {
  const fragment = useLocation({ select: location => location.hash });
  const navigate = useNavigate();
  const [token] = useState(() => readLinkToken(fragment));

  useEffect(() => {
    if (fragment) {
      void navigate({ to: ".", replace: true });
    }
  }, [fragment, navigate]);

  return token;
}
