export function resolveProviderLink(url: string): string | null {
  // -------------------
  // Google Drive
  // -------------------
  if (url.includes("drive.google.com")) {
     let match: RegExpMatchArray | null;

    // /file/d/<id>
    match = url.match(/\/file\/d\/([^/]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }

    // open?id=<id>
    match = url.match(/[?&]id=([^&]+)/);
    if (match) {
      return `https://drive.google.com/uc?export=download&id=${match[1]}`;
    }
   
    // already uc? link
    if (url.includes("/uc?export=download")) {
      return url;
    }

    // folder link (needs API)
    match = url.match(/drive\.google\.com\/drive\/folders\/([^/?]+)/);
    if (match) {
      return "GOOGLE_DRIVE_API_ACCESS_REQUIRED";
    }
  }

  // -------------------
  // Dropbox
  // -------------------
  if (url.includes("dropbox.com")) {
    return url.replace("?dl=0", "?dl=1");
  }

  // -------------------
  // OneDrive
  // -------------------
  if (url.includes("1drv.ms")) {
    // redirects resolve actual file
    return url;
  }
  return null;
}
