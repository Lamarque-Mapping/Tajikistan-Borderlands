"""Verify and restore the map data packaged alongside this static site."""
import hashlib
import json
from pathlib import Path
import tarfile
import tempfile

ROOT = Path(__file__).resolve().parents[1]
bundle = ROOT / 'site-data'
manifest = json.loads((bundle / 'manifest.json').read_text())
target = ROOT / 'dist/data'
target.mkdir(parents=True, exist_ok=True)
with tempfile.TemporaryFile() as archive:
    digest = hashlib.sha256()
    for part in manifest['parts']:
        path = bundle / part['name']
        content = path.read_bytes()
        if len(content) != part['bytes'] or hashlib.sha256(content).hexdigest() != part['sha256']:
            raise ValueError('Data part failed verification: ' + part['name'])
        archive.write(content)
        digest.update(content)
    if digest.hexdigest() != manifest['sha256']:
        raise ValueError('Data archive checksum mismatch')
    archive.seek(0)
    with tarfile.open(fileobj=archive, mode='r:gz') as tar:
        # Extraction must never escape the data directory or create links.
        for member in tar.getmembers():
            if not member.isfile() or Path(member.name).is_absolute() or '..' in Path(member.name).parts:
                raise ValueError('Unexpected archive member: ' + member.name)
        tar.extractall(target, filter='data')
for item in manifest['files']:
    path = target / item['path']
    if hashlib.sha256(path.read_bytes()).hexdigest() != item['sha256']:
        raise ValueError('Restored file failed verification: ' + item['path'])
print(f"Restored and verified {len(manifest['files'])} map data files.")
