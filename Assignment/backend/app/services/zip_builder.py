import zipfile
import os

OUTPUT_DIR = "outputs"

def build_zip(job_id: str, file_paths: list[str]) -> str:
    zip_path = os.path.join(OUTPUT_DIR, f"job_{job_id}.zip")

    with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
        for path in file_paths:
            if os.path.exists(path):
                zf.write(path, arcname=os.path.basename(path))

    return zip_path
