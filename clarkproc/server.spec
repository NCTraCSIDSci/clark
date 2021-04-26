# -*- mode: python ; coding: utf-8 -*-

block_cipher = None

a = Analysis(['./clarkproc/server_app.py'],
             pathex=['.'],
             binaries=[],
             datas=[],
             hiddenimports = [
                'distutils',
                'scipy',
                'scipy.sparse.csgraph',
                'sklearn.neighbors.typedefs',
                'sklearn.neighbors.quad_tree',
                'sklearn.tree._utils',
                'sklearn.utils._cython_blas',
                'sklearn.metrics.cluster',
                'pkg_resources.py2_warn'
             ],
             hookspath=[],
             runtime_hooks=[],
             excludes=[],
             win_no_prefer_redirects=False,
             win_private_assemblies=False,
             cipher=block_cipher,
             noarchive=False)
pyz = PYZ(a.pure, a.zipped_data,
             cipher=block_cipher)
exe = EXE(pyz,
          a.scripts,
          [],
          exclude_binaries=True,
          name='clark_server',
          debug=False,
          bootloader_ignore_signals=False,
          strip=False,
          upx=True,
          console=True )
coll = COLLECT(exe,
               a.binaries,
               a.zipfiles,
               a.datas,
               strip=False,
               upx=True,
               upx_exclude=[],
               name='clark_server')
