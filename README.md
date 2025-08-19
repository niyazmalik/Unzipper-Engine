# Unzipper-Engine
A robust backend engine that downloads files from a URL, safely extracts archives, and uploads their contents to Google Drive — with streaming, retries, concurrency control, and cleanup built in.

## Design Considerations

This project is being built with production-level challenges in mind:

- **What if the URL contains large files (multi-GB)?**  
  Do we stream to disk or risk memory overload?  

- **What if the network drops mid-download?**  
  How do we handle partial files and retries?  

- **What if the zip is huge?**  
  Can temp storage handle the blow-up?  

- **What if the zip is malicious (zip bomb, zip slip)?**  
  How do we sanitize extraction?  

- **What if the folder has thousands of files?**  
  Do we upload sequentially or manage concurrency with rate limits?  

- **What if Drive API quotas are hit?**  
  Do we back off and retry?  

- **What if the request takes too long?**  
  Should we enqueue jobs and let a worker handle processing?  

- **What if the process crashes mid-way?**  
  How do we make sure temp files are always cleaned up?  

---

> In progress...
