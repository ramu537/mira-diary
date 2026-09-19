import { ImageOff } from "lucide-react";
import { useEffect, useState } from "react";
import { apiBlobRequest, apiUrl } from "../api/client";

export default function ExperienceImage({ experienceId, slug, media, className = "", eager = false }) {
  const [source, setSource] = useState(slug ? apiUrl(`/public/experiences/${encodeURIComponent(slug)}/media/${media.id}`) : "");
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    if (slug) {
      setSource(apiUrl(`/public/experiences/${encodeURIComponent(slug)}/media/${media.id}`));
      setFailed(false);
      return undefined;
    }
    let active = true;
    let objectUrl = "";
    setSource("");
    setFailed(false);
    apiBlobRequest(`/experiences/${experienceId}/media/${media.id}/content`)
      .then((blob) => {
        if (!active) return;
        objectUrl = URL.createObjectURL(blob);
        setSource(objectUrl);
      })
      .catch(() => { if (active) setFailed(true); });
    return () => { active = false; if (objectUrl) URL.revokeObjectURL(objectUrl); };
  }, [experienceId, media.id, slug]);

  if (failed) return <span className={`experience-image-fallback ${className}`}><ImageOff size={20} /><span>Image unavailable</span></span>;
  if (!source) return <span className={`experience-image-fallback ${className}`} aria-hidden="true" />;
  return <img className={className} src={source} alt={media.altText || media.caption || "Experience"} loading={eager ? "eager" : "lazy"} onError={() => setFailed(true)} />;
}
