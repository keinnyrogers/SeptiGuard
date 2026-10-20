import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { fetchComplaintPhoto } from "@/api";

export default function ComplaintAttachment({ token, photoUrl }) {
  const [imageUrl, setImageUrl] = useState("");
  const [error, setError] = useState("");
  const [open, setOpen] = useState(false);

  useEffect(() => {
    let active = true;
    let objectUrl;

    fetchComplaintPhoto(token, photoUrl)
      .then((url) => {
        if (active) {
          objectUrl = url;
          setImageUrl(url);
        } else {
          URL.revokeObjectURL(url);
        }
      })
      .catch((fetchError) => {
        if (active) setError(fetchError.message);
      });

    return () => {
      active = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [photoUrl, token]);

  if (error) return <p className="text-sm text-destructive">{error}</p>;
  if (!imageUrl) return <p className="text-sm text-muted-foreground">Loading photo…</p>;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full cursor-zoom-in text-left"
        aria-label="View full complaint photo"
      >
        <img src={imageUrl} alt="Complaint attachment preview" className="max-h-60 w-full rounded-lg border border-border object-cover" />
      </button>
      <Button type="button" variant="outline" size="sm" className="mt-2" onClick={() => setOpen(true)}>
        View full photo
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] max-w-4xl overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Complaint attachment</DialogTitle>
          </DialogHeader>
          <img src={imageUrl} alt="Full complaint attachment" className="max-h-[75vh] w-full rounded-md object-contain" />
        </DialogContent>
      </Dialog>
    </>
  );
}
