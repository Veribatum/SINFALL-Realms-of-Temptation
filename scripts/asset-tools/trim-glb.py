"""Keep gameplay clips and compact a self-contained KayKit glTF 2.0 binary.

Usage: python scripts/asset-tools/trim-glb.py source.glb assets/models/rogue.glb
No mesh, skeleton, texture, or keyframe values are changed.
"""
import json
import struct
import sys
from pathlib import Path

CLIPS = {'Idle', 'Walking_A', 'Running_A', 'Interact', 'Cheer', 'Death_A',
         'Hit_A', 'Block', '1H_Melee_Attack_Slice_Horizontal',
         'Spellcast_Shoot', 'Sit_Chair_Idle'}


def compact(source, destination):
    raw = Path(source).read_bytes()
    magic, version, length = struct.unpack_from('<III', raw)
    assert magic == 0x46546c67 and version == 2 and length == len(raw)
    size, kind = struct.unpack_from('<II', raw, 12)
    assert kind == 0x4e4f534a
    doc = json.loads(raw[20:20 + size])
    offset = 20 + size
    binary_size, kind = struct.unpack_from('<II', raw, offset)
    assert kind == 0x004e4942 and len(doc['buffers']) == 1
    binary = raw[offset + 8:offset + 8 + binary_size]
    doc['animations'] = [a for a in doc['animations'] if a['name'] in CLIPS]
    used = set()
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            used.update(primitive['attributes'].values())
            if 'indices' in primitive:
                used.add(primitive['indices'])
            for target in primitive.get('targets', []):
                used.update(target.values())
    for skin in doc.get('skins', []):
        if 'inverseBindMatrices' in skin:
            used.add(skin['inverseBindMatrices'])
    for animation in doc['animations']:
        for sampler in animation['samplers']:
            used.update([sampler['input'], sampler['output']])
    accessors = {old: new for new, old in enumerate(sorted(used))}
    views = set()
    for index in used:
        accessor = doc['accessors'][index]
        if 'bufferView' in accessor:
            views.add(accessor['bufferView'])
        for part in ['indices', 'values']:
            if part in accessor.get('sparse', {}):
                views.add(accessor['sparse'][part]['bufferView'])
    views.update(image['bufferView'] for image in doc.get('images', []) if 'bufferView' in image)
    view_map = {old: new for new, old in enumerate(sorted(views))}
    packed = bytearray()
    new_views = []
    for index in sorted(views):
        view = dict(doc['bufferViews'][index])
        assert view['buffer'] == 0
        packed.extend(b'\0' * (-len(packed) % 4))
        start = view.get('byteOffset', 0)
        data = binary[start:start + view['byteLength']]
        assert len(data) == view['byteLength']
        view['byteOffset'] = len(packed)
        packed.extend(data)
        new_views.append(view)
    new_accessors = []
    for index in sorted(used):
        accessor = doc['accessors'][index]
        if 'bufferView' in accessor:
            accessor['bufferView'] = view_map[accessor['bufferView']]
        for part in ['indices', 'values']:
            if part in accessor.get('sparse', {}):
                item = accessor['sparse'][part]
                item['bufferView'] = view_map[item['bufferView']]
        new_accessors.append(accessor)
    for mesh in doc['meshes']:
        for primitive in mesh['primitives']:
            primitive['attributes'] = {k: accessors[v] for k, v in primitive['attributes'].items()}
            if 'indices' in primitive:
                primitive['indices'] = accessors[primitive['indices']]
            for target in primitive.get('targets', []):
                for key, value in list(target.items()):
                    target[key] = accessors[value]
    for skin in doc.get('skins', []):
        if 'inverseBindMatrices' in skin:
            skin['inverseBindMatrices'] = accessors[skin['inverseBindMatrices']]
    for animation in doc['animations']:
        for sampler in animation['samplers']:
            sampler['input'] = accessors[sampler['input']]
            sampler['output'] = accessors[sampler['output']]
    for image in doc.get('images', []):
        if 'bufferView' in image:
            image['bufferView'] = view_map[image['bufferView']]
    doc['accessors'], doc['bufferViews'] = new_accessors, new_views
    doc['buffers'] = [{'byteLength': len(packed)}]
    encoded = json.dumps(doc, separators=(',', ':')).encode()
    encoded += b' ' * (-len(encoded) % 4)
    packed.extend(b'\0' * (-len(packed) % 4))
    result = struct.pack('<III', magic, 2, 28 + len(encoded) + len(packed))
    result += struct.pack('<II', len(encoded), 0x4e4f534a) + encoded
    result += struct.pack('<II', len(packed), 0x004e4942) + packed
    Path(destination).write_bytes(result)
    print(f'{destination}: {len(raw):,} → {len(result):,} bytes, {len(doc["animations"])} clips')


if __name__ == '__main__':
    compact(*sys.argv[1:])
