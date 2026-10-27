"""Append covered, adult Corsair and Moonveil outfits to Sinfall's female GLB.

Usage: python scripts/asset-tools/pack-revealing-outfits.py SOURCE_DIRECTORY
SOURCE_DIRECTORY contains Superhero_Female_FullBody.gltf and its .bin from
the retained Quaternius CC0 adult base mirror. Run pack-adult-characters.py
first when rebuilding every asset. Re-running this append step is idempotent.
The existing skeleton, animations, textures and legacy meshes are preserved.
"""
from pathlib import Path
import copy, hashlib, json, struct, sys
import numpy as np

OUT = Path(__file__).resolve().parents[2] / 'assets/models/adult-female.glb'
SRC = Path(sys.argv[1])
TYPES = {5121: np.dtype('u1'), 5123: np.dtype('<u2'), 5125: np.dtype('<u4'), 5126: np.dtype('<f4')}
SIZES = {'SCALAR': 1, 'VEC2': 2, 'VEC3': 3, 'VEC4': 4, 'MAT4': 16}
ATTRS = ['POSITION', 'NORMAL', 'TEXCOORD_0', 'JOINTS_0', 'WEIGHTS_0']


def read(path):
    if path.suffix == '.glb':
        raw = path.read_bytes()
        length = struct.unpack_from('<I', raw, 12)[0]
        doc = json.loads(raw[20:20 + length])
        return doc, raw[28 + length:]
    doc = json.loads(path.read_text())
    return doc, (path.parent / doc['buffers'][0]['uri']).read_bytes()


def array(source, index):
    doc, raw = source
    a = doc['accessors'][index]
    view = doc['bufferViews'][a['bufferView']]
    dtype, size = TYPES[a['componentType']], SIZES[a['type']]
    stride = view.get('byteStride', dtype.itemsize * size)
    offset = view.get('byteOffset', 0) + a.get('byteOffset', 0)
    result = np.ndarray((a['count'], size), dtype=dtype, buffer=raw,
                        offset=offset, strides=(stride, dtype.itemsize)).copy()
    if a.get('normalized') and dtype.kind != 'f':
        result = result.astype('f4') / np.iinfo(dtype).max
    return result


def interpolate(a, b, t):
    point = {key: a[key] * (1 - t) + b[key] * t
             for key in a if key not in ['JOINTS_0', 'WEIGHTS_0']}
    weights = {}
    for vertex, factor in [(a, 1 - t), (b, t)]:
        for joint, weight in zip(vertex['JOINTS_0'], vertex['WEIGHTS_0']):
            weights[int(joint)] = weights.get(int(joint), 0) + float(weight) * factor
    top = sorted(weights.items(), key=lambda item: -item[1])[:4]
    top += [(0, 0)] * (4 - len(top))
    point['JOINTS_0'] = np.array([item[0] for item in top])
    point['WEIGHTS_0'] = np.array([item[1] for item in top])
    return point


def clipped(source, primitive, planes):
    """Clip triangle polygons; interpolate skin weights at every new seam."""
    attrs = {key: array(source, index) for key, index in primitive['attributes'].items() if key in ATTRS}
    triangles = array(source, primitive['indices']).flatten().reshape(-1, 3)
    pieces = []
    for triangle in triangles:
        poly = [{key: value[i].copy() for key, value in attrs.items()} for i in triangle]
        for plane in planes:
            result = []
            for a, b in zip(poly, poly[1:] + poly[:1]):
                da, db = plane(a['POSITION']), plane(b['POSITION'])
                if da >= 0:
                    result.append(a)
                if (da >= 0) != (db >= 0):
                    result.append(interpolate(a, b, da / (da - db)))
            poly = result
            if not poly:
                break
        for i in range(1, len(poly) - 1):
            tri = [poly[0], poly[i], poly[i + 1]]
            p = [vertex['POSITION'] for vertex in tri]
            if np.linalg.norm(np.cross(p[1] - p[0], p[2] - p[0])) > 1e-10:
                pieces.extend(tri)
    return {key: np.array([vertex[key] for vertex in pieces]) for key in attrs}


doc, binary = read(OUT)
extras = doc['asset'].setdefault('extras', {})
previous = extras.get('adultFemaleOutfitsBuild')
if previous:
    for key in ['nodes', 'meshes', 'accessors', 'bufferViews', 'materials']:
        doc[key] = doc[key][:previous[key]]
    doc['nodes'][65]['children'] = [index for index in doc['nodes'][65]['children'] if index < previous['nodes']]
    binary = binary[:previous['binaryLength']]
base = {key: len(doc[key]) for key in ['nodes', 'meshes', 'accessors', 'bufferViews', 'materials']}
base['binaryLength'] = len(binary)
binary = bytearray(binary)
cache = {}
source = (doc, bytes(binary))
body = read(SRC / 'Superhero_Female_FullBody.gltf')
assert body[0]['skins'][0]['joints'] == doc['skins'][0]['joints'], 'Adult skeleton joint order differs'
roles = {'skin': next(i for i, material in enumerate(doc['materials']) if material['name'] == 'skin' and 'baseColorTexture' not in material.get('pbrMetallicRoughness', {}))}
for name, color, roughness, metallic in [('cloth', [1, 1, 1, 1], .8, 0),
                                         ('leather', [.45, .24, .12, 1], .72, 0),
                                         ('metal', [.76, .57, .25, 1], .42, .65)]:
    roles[name] = len(doc['materials'])
    doc['materials'].append({'name': name, 'doubleSided': True,
                             'pbrMetallicRoughness': {'baseColorFactor': color,
                                                     'roughnessFactor': roughness,
                                                     'metallicFactor': metallic}})


def acc(value):
    value = np.ascontiguousarray(value)
    count = value.shape[1]
    kind = {1: 'SCALAR', 2: 'VEC2', 3: 'VEC3', 4: 'VEC4'}[count]
    component = 5126 if value.dtype.kind == 'f' else 5123 if value.dtype.itemsize == 2 else 5125
    key = (kind, component, hashlib.sha256(value.tobytes()).digest())
    if key in cache:
        return cache[key]
    while len(binary) % 4:
        binary.append(0)
    view = len(doc['bufferViews'])
    doc['bufferViews'].append({'buffer': 0, 'byteOffset': len(binary), 'byteLength': value.nbytes})
    binary.extend(value.tobytes())
    index = len(doc['accessors'])
    entry = {'bufferView': view, 'componentType': component, 'count': len(value), 'type': kind}
    if kind in ['VEC3', 'SCALAR']:
        entry.update(min=value.min(0).tolist(), max=value.max(0).tolist())
    doc['accessors'].append(entry)
    cache[key] = index
    return index


def add(name, attrs, role, offset=0):
    if not attrs or not len(attrs['POSITION']):
        return
    attrs = {key: value.copy() for key, value in attrs.items()}
    normals = attrs['NORMAL']
    normals /= np.maximum(np.linalg.norm(normals, axis=1, keepdims=True), 1e-8)
    attrs['POSITION'] += normals * offset
    weights = attrs['WEIGHTS_0']
    weights /= np.maximum(weights.sum(1, keepdims=True), 1e-8)
    # Merge seam duplicates generated by triangle clipping, preserving normals/UVs.
    keys = np.concatenate([np.round(attrs[key], 6) for key in ATTRS if key in attrs], axis=1)
    _, used, inverse = np.unique(keys, axis=0, return_index=True, return_inverse=True)
    packed = {key: acc(value[used].astype('<u2' if key == 'JOINTS_0' else '<f4')) for key, value in attrs.items()}
    primitive = {'attributes': packed, 'indices': acc(inverse.astype('<u2' if len(used) < 65536 else '<u4').reshape(-1, 1)), 'material': roles[role]}
    append_mesh(name, [primitive])


def append_mesh(name, primitives):
    mesh = len(doc['meshes'])
    doc['meshes'].append({'name': name, 'primitives': primitives,
                          'extras': {'adultOutfit': 'corsair' if name.startswith('Corsair') else 'moonveil'}})
    node = len(doc['nodes'])
    doc['nodes'].append({'name': name, 'mesh': mesh, 'skin': 0})
    doc['nodes'][65]['children'].append(node)


def garment(name, original, role, planes=(), offset=0):
    mesh = next(mesh for mesh in source[0]['meshes'] if mesh['name'] == original)
    if not planes and not offset:
        primitives = copy.deepcopy(mesh['primitives'])
        for primitive in primitives:
            primitive['material'] = roles[role]
        append_mesh(name, primitives)
    else:
        parts = [clipped(source, primitive, planes) for primitive in mesh['primitives']]
        attrs = {key: np.concatenate([part[key] for part in parts]) for key in parts[0]}
        add(name, attrs, role, offset)


def exposed_skin(name, crop, hem, boots):
    primitive = body[0]['meshes'][2]['primitives'][0]
    regions = [
        # Midriff, from waistband to the cropped bodice's hem.
        [lambda p: p[1] - 1.048, lambda p: crop + .007 - p[1]],
        # Both bare arms and hands; chest geometry beneath the bodice is omitted.
        [lambda p: abs(p[0]) - .158, lambda p: p[1] - 1.328, lambda p: 1.49 - p[1]],
        # Authored upper chest and neck fill the V; no collar slab.
        [lambda p: p[1] - (1.378 + abs(p[0]) * 1.03), lambda p: p[2] + .07, lambda p: 1.515 - p[1]],
        [lambda p: p[1] - 1.478, lambda p: -p[2] - .07, lambda p: 1.515 - p[1]],
        # Bare thighs and knees. The pelvis is covered by fitted opaque bottoms.
        [lambda p: p[1] - boots, lambda p: hem(p) + .007 - p[1]],
    ]
    parts = [clipped(body, primitive, planes) for planes in regions]
    attrs = {key: np.concatenate([part[key] for part in parts]) for key in parts[0]}
    add(name, attrs, 'skin')


def skirt(name, trim=False):
    """A weighted open-front skirt: adult briefs remain beneath every slit."""
    positions, normals, joints, weights, uv, indices = [], [], [], [], [], []
    joint_order = doc['skins'][0]['joints']
    pelvis = joint_order.index(63)
    left, right = joint_order.index(57), joint_order.index(62)
    # Leave clearance outside the authored hips/thighs as the idle and walk
    # clips rotate the legs. The front slit preserves the exposed silhouette.
    rings = [(1.04, .185, .14), (.91, .228, .18), (.72, .25, .19), (.5, .276, .2), (.22, .31, .21)]
    arcs = [(55, 305)] if not trim else [(55, 57), (303, 305)]
    steps = 40 if not trim else 1
    for start, end in arcs:
        base_index = len(positions)
        for row, (height, width, depth) in enumerate(rings):
            for step in range(steps + 1):
                angle = np.deg2rad(start + (end - start) * step / steps)
                x, z = np.sin(angle) * width, np.cos(angle) * depth
                positions.append([x, height, z])
                normal = np.array([np.sin(angle) / width, .13, np.cos(angle) / depth])
                normal /= np.linalg.norm(normal)
                normals.append(normal)
                thigh_weight = min(.65, max(0, (1.04 - height) / .82) * .65) * abs(np.sin(angle)) ** 1.5
                joints.append([pelvis, left if x > 0 else right, 0, 0])
                weights.append([1 - thigh_weight, thigh_weight, 0, 0])
                uv.append([step / steps, row / (len(rings) - 1)])
        for row in range(len(rings) - 1):
            for step in range(steps):
                a = base_index + row * (steps + 1) + step
                b = a + steps + 1
                indices.extend([a, a + 1, b, a + 1, b + 1, b])
    ids = np.array(indices)
    attrs = {key: np.array(value)[ids] for key, value in [('POSITION', positions), ('NORMAL', normals), ('TEXCOORD_0', uv), ('JOINTS_0', joints), ('WEIGHTS_0', weights)]}
    add(name, attrs, 'metal' if trim else 'cloth', .0015 if trim else 0)


for prefix, crop, hem, boots in [('Corsair', 1.245, lambda p: .875, .538),
                                  ('Moonveil', 1.27, lambda p: .862 + .073 * min(1, abs(p[0]) / .2), .444)]:
    exposed_skin(prefix + '_Skin', crop, hem, boots)
    garment(prefix + '_Body', 'Female_Ranger_Body', 'cloth', [lambda p: p[1] - crop])
    garment(prefix + '_Bodice_Trim', 'Female_Ranger_Body', 'metal',
            [lambda p: p[1] - crop, lambda p: crop + .012 - p[1]], .0018)
    garment(prefix + '_Bottoms', 'Female_Ranger_Legs', 'leather' if prefix == 'Corsair' else 'cloth', [lambda p: p[1] - hem(p)], .002)
    garment(prefix + '_Waist_Trim', 'Female_Ranger_Legs', 'metal', [lambda p: p[1] - 1.035], .003)
    garment(prefix + '_Bracers', 'Female_Ranger_Arms_Bracer', 'leather')
    garment(prefix + '_Boots', 'Female_Ranger_Feet' if prefix == 'Corsair' else 'Female_Peasant_Feet', 'leather')
skirt('Moonveil_Split_Skirt')
skirt('Moonveil_Skirt_Trim', True)

extras['femaleAdultOutfits'] = True
extras['adultOutfits'] = ['corsair', 'moonveil']
extras['adultFemaleOutfitsBuild'] = base
extras['adultOutfitSource'] = 'Quaternius CC0 adult Superhero Female body; fitted Ranger/Peasant garments; Sinfall split-skirt geometry'
doc['buffers'][0]['byteLength'] = len(binary)
j = json.dumps(doc, separators=(',', ':')).encode()
j += b' ' * (-len(j) % 4)
binary.extend(b'\0' * (-len(binary) % 4))
raw = struct.pack('<III', 0x46546c67, 2, 28 + len(j) + len(binary))
raw += struct.pack('<II', len(j), 0x4e4f534a) + j + struct.pack('<II', len(binary), 0x004e4942) + binary
OUT.write_bytes(raw)
print(f'{OUT}: {len(raw):,} bytes; {len(binary) - base["binaryLength"]:,} appended geometry bytes; {len(doc["animations"])} retained clips')
print('New meshes:', ', '.join(mesh['name'] for mesh in doc['meshes'][base['meshes']:]))
